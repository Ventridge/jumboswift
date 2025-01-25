import Stripe from "stripe";
import PaymentCredential from "../models/PaymentCredential.js";
import Payment from "../models/Payment.js";
import Invoice from "../models/Invoice.js";
import NotificationService from "./NotificationService.js";
import mongoose from "mongoose";

class StripeService {
  constructor() {
    this.notificationService = new NotificationService();
  }

  async getStripeInstance(businessId) {
    const credentials = await PaymentCredential.findOne({
      businessId,
      paymentMethod: 'stripe',
      isActive: true
    });

    if (!credentials?.credentials?.secretKey) {
      throw new Error('Stripe credentials not found');
    }

    return new Stripe(credentials.credentials.secretKey);
  }

  async processPayment(payment, businessId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const stripe = await this.getStripeInstance(businessId);

      // Create payment intent with proper error handling
      const paymentIntent = await stripe.paymentIntents.create({
        amount: payment.amount * 100,
        currency: payment.currency.toLowerCase(),
        payment_method: payment.paymentMethodId,
        confirm: true,
        metadata: {
          businessId: payment.businessId,
          customerId: payment.customerId,
          paymentId: payment._id.toString(),
          invoiceId: payment.invoiceId || null,
        },
        description: payment.description || 'Payment',
        statement_descriptor: payment.statementDescriptor || 'Payment',
        capture_method: payment.captureMethod || 'automatic',
        setup_future_usage: payment.type === 'recurring' ? 'off_session' : undefined,
      }, {
        idempotencyKey: `payment_${payment._id}`
      });

      // Update payment record with Stripe response
      const updatedPayment = await Payment.findByIdAndUpdate(
        payment._id,
        {
          $set: {
            status: paymentIntent.status === 'succeeded' ? 'completed' : 'processing',
            processorResponse: {
              transactionId: paymentIntent.id,
              chargeId: paymentIntent.latest_charge,
              status: paymentIntent.status,
              paymentMethod: paymentIntent.payment_method,
              receiptUrl: paymentIntent.charges?.data[0]?.receipt_url,
              last4: paymentIntent.payment_method_details?.card?.last4,
              brand: paymentIntent.payment_method_details?.card?.brand,
            }
          }
        },
        { new: true, session }
      );

      await session.commitTransaction();

      return {
        success: paymentIntent.status === "succeeded",
        transactionId: paymentIntent.id,
        status: paymentIntent.status,
        details: paymentIntent,
        payment: updatedPayment
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async createCustomer(customerData, businessId) {
    const stripe = await this.getStripeInstance(businessId);
    
    return stripe.customers.create({
      email: customerData.email,
      name: customerData.name,
      phone: customerData.phone,
      metadata: {
        businessId: customerData.businessId,
        customerId: customerData.customerId,
      },
      description: customerData.description || 'Customer',
    }, {
      idempotencyKey: `customer_${customerData.customerId}`
    });
  }

  async handleWebhook(event, signature, businessId) {
    const credentials = await PaymentCredential.findOne({
      businessId,
      paymentMethod: 'stripe',
      isActive: true
    });

    if (!credentials?.credentials?.webhookSecret) {
      throw new Error('Stripe webhook secret not found');
    }

    const stripe = await this.getStripeInstance(businessId);
    const webhookEvent = stripe.webhooks.constructEvent(
      event, 
      signature, 
      credentials.credentials.webhookSecret
    );

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      switch (webhookEvent.type) {
        case "payment_intent.succeeded":
          await this.handlePaymentSuccess(webhookEvent.data.object, session);
          break;
        case "payment_intent.failed":
          await this.handlePaymentFailure(webhookEvent.data.object, session);
          break;
        case "payment_intent.canceled":
          await this.handlePaymentCancellation(webhookEvent.data.object, session);
          break;
        case "charge.refunded":
          await this.handleRefund(webhookEvent.data.object, session);
          break;
        case "charge.dispute.created":
          await this.handleDisputeCreated(webhookEvent.data.object, session);
          break;
        case "charge.dispute.closed":
          await this.handleDisputeClosed(webhookEvent.data.object, session);
          break;
      }

      await session.commitTransaction();
      return { received: true };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async handlePaymentSuccess(paymentIntent, session) {
    const { paymentId, invoiceId } = paymentIntent.metadata;

    // Update payment status
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        $set: {
          status: 'completed',
          processorResponse: {
            transactionId: paymentIntent.id,
            chargeId: paymentIntent.latest_charge,
            status: paymentIntent.status,
            paymentMethod: paymentIntent.payment_method,
            receiptUrl: paymentIntent.charges?.data[0]?.receipt_url,
            last4: paymentIntent.payment_method_details?.card?.last4,
            brand: paymentIntent.payment_method_details?.card?.brand,
          }
        }
      },
      { new: true, session }
    );

    // Update invoice if payment is linked to one
    if (invoiceId) {
      const invoice = await Invoice.findById(invoiceId);
      if (invoice) {
        invoice.status = 'paid';
        invoice.paidAt = new Date();
        invoice.paymentId = payment._id;
        await invoice.save({ session });
      }
    }

    // Send success notification
    await this.notificationService.sendPaymentNotification(payment, 'success');
  }

  async handlePaymentFailure(paymentIntent, session) {
    const { paymentId, invoiceId } = paymentIntent.metadata;

    // Update payment status with failure details
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        $set: {
          status: 'failed',
          processorResponse: {
            transactionId: paymentIntent.id,
            status: paymentIntent.status,
            errorCode: paymentIntent.last_payment_error?.code,
            errorMessage: paymentIntent.last_payment_error?.message,
            declineCode: paymentIntent.last_payment_error?.decline_code,
          }
        }
      },
      { new: true, session }
    );

    // Update invoice if payment is linked to one
    if (invoiceId) {
      await Invoice.findByIdAndUpdate(
        invoiceId,
        { 
          $set: { lastFailedPayment: new Date() },
          $inc: { failedPaymentAttempts: 1 }
        },
        { session }
      );
    }

    // Send failure notification
    await this.notificationService.sendPaymentNotification(payment, 'failure');
  }

  async handlePaymentCancellation(paymentIntent, session) {
    const { paymentId } = paymentIntent.metadata;

    await Payment.findByIdAndUpdate(
      paymentId,
      {
        $set: {
          status: 'cancelled',
          processorResponse: {
            transactionId: paymentIntent.id,
            status: paymentIntent.status,
            cancelReason: paymentIntent.cancellation_reason,
          }
        }
      },
      { session }
    );
  }

  async handleRefund(charge, session) {
    const payment = await Payment.findOne({
      'processorResponse.chargeId': charge.id
    });

    if (payment) {
      payment.refunded = charge.refunded;
      payment.refundedAmount = charge.amount_refunded / 100;
      payment.status = charge.refunded ? 'refunded' : 'partially_refunded';
      
      await payment.save({ session });
      
      // Send refund notification
      await this.notificationService.sendPaymentNotification(payment, 'refund');
    }
  }

  async handleDisputeCreated(dispute, session) {
    const payment = await Payment.findOne({
      'processorResponse.chargeId': dispute.charge
    });

    if (payment) {
      payment.disputed = true;
      payment.disputeDetails = {
        reason: dispute.reason,
        status: dispute.status,
        amount: dispute.amount / 100,
        created: dispute.created,
        evidence_due_by: dispute.evidence_details?.due_by
      };
      
      await payment.save({ session });
      
      // Send dispute notification
      await this.notificationService.sendPaymentNotification(payment, 'dispute');
    }
  }

  async handleDisputeClosed(dispute, session) {
    const payment = await Payment.findOne({
      'processorResponse.chargeId': dispute.charge
    });

    if (payment) {
      payment.disputeDetails = {
        ...payment.disputeDetails,
        status: dispute.status,
        resolvedAt: new Date(),
        resolution: dispute.status === 'won' ? 'won' : 'lost'
      };
      
      await payment.save({ session });
      
      // Send dispute resolution notification
      await this.notificationService.sendPaymentNotification(payment, 'dispute_resolved');
    }
  }

  async processRefund(refundData, payment) {
    const stripe = await this.getStripeInstance(payment.businessId);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const refund = await stripe.refunds.create({
        charge: payment.processorResponse.chargeId,
        amount: refundData.amount * 100,
        reason: refundData.reason,
        metadata: {
          refundId: refundData._id.toString(),
          paymentId: payment._id.toString(),
          businessId: payment.businessId
        }
      }, {
        idempotencyKey: `refund_${refundData._id}`
      });

      // Update payment record
      payment.refunded = refund.amount === payment.amount;
      payment.refundedAmount = (payment.refundedAmount || 0) + (refund.amount / 100);
      payment.status = payment.refunded ? 'refunded' : 'partially_refunded';
      
      await payment.save({ session });

      await session.commitTransaction();
      return {
        success: true,
        refundId: refund.id,
        status: refund.status,
        details: refund
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export default StripeService;