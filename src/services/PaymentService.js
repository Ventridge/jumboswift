import StripeService from "./StripeService.js";
import MpesaService from "./MpesaService.js";
import CashService from "./CashService.js";
import PaymentModel from "../models/Payment.js";
import BusinessModel from "../models/Business.js";
import PaymentCredentialModel from "../models/PaymentCredential.js";
import mongoose from "mongoose";

class PaymentService {
  constructor() {
    this.processors = {
      card: new StripeService(),
      mpesa: new MpesaService(),
      cash: new CashService(),
    };
  }

  async processPayment(req) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const paymentData = req.body;

      const { app } = req;
      // Validate business and payment method
      const business = await BusinessModel.findOne({
        businessId: paymentData.businessId,
        "apps.appId": app._id,
        "apps.status": "active",
        "paymentMethods.type": paymentData.paymentMethod,
        "paymentMethods.isActive": true,
      });

      if (!business) {
        throw new Error("Invalid business or payment method");
      }

      // Get payment credentials (except for cash)
      let credentials = null;
      if (paymentData.paymentMethod !== "cash") {
        credentials = await PaymentCredentialModel.findOne({
          businessId: paymentData.businessId,
          paymentMethod: paymentData.paymentMethod,
          isActive: true,
        });

        if (!credentials) {
          throw new Error("Payment credentials not found");
        }
      }

      // Create initial payment record
      const payment = await PaymentModel.create({
        ...paymentData,
        status: "processing",
      });

      // Process payment with appropriate processor
      const processor = this.processors[paymentData.paymentMethod];

      const result = await processor.processPayment({ ...paymentData, ...payment?._doc }, credentials);

      // Update payment record
      payment.processorResponse = result;
      payment.status = result.success ? "completed" : "failed";
      await payment.save();

      await session.commitTransaction();
      return payment;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async validatePaymentMethod(businessId, appId, paymentMethod) {
    const business = await BusinessModel.findOne({
      businessId,
      "apps.appId": appId,
      "apps.status": "active",
    });

    return business?.paymentMethods.some((method) => method.type === paymentMethod && method.isActive);
  }

  async getPaymentStatus(paymentId, appId) {
    const payment = await PaymentModel.findOne({
      _id: paymentId,
      appId,
    });

    if (!payment) {
      throw new Error("Payment not found");
    }
    return payment;
  }

  async getPaymentsByBusiness(businessId, appId, filters = {}) {
    const query = {
      businessId,
      appId,
    };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.paymentMethod) {
      query.paymentMethod = filters.paymentMethod;
    }

    if (filters.dateRange) {
      query.createdAt = {
        $gte: new Date(filters.dateRange.start),
        $lte: new Date(filters.dateRange.end),
      };
    }

    const payments = await PaymentModel.find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit || 100);

    return payments;
  }

  async handleCallback(callbackData, paymentMethod) {
    const processor = this.processors[paymentMethod];
    return processor.handleCallback(callbackData);
  }
}

export default PaymentService;
