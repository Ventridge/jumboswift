
import RefundModel from '../models/Refund.js';
import PaymentModel from '../models/Payment.js';
import StripeService from './StripeService.js';
import MpesaService from './MpesaService.js';

class RefundService {
  constructor() {
    this.processors = {
      card: new StripeService(),
      mpesa: new MpesaService(),
    };
  }

  async processRefund(refundData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get original payment
      const payment = await PaymentModel.findById(refundData.paymentId);
      if (!payment) {
        throw new Error('Original payment not found');
      }

      // Validate refund amount
      if (refundData.amount > (payment.amount - payment.refundedAmount)) {
        throw new Error('Refund amount exceeds available amount');
      }

      // Create refund record
      const refund = await RefundModel.create({
        ...refundData,
        status: 'processing',
      });

      // Process refund with appropriate processor
      const processor = this.processors[payment.paymentMethod];
      const result = await processor.processRefund(refund, payment);

      // Update refund record
      refund.processorResponse = result;
      refund.status = result.success ? 'completed' : 'failed';
      await refund.save();

      // Update original payment
      if (result.success) {
        payment.refundedAmount += refund.amount;
        payment.refunded = payment.refundedAmount === payment.amount;
        await payment.save();
      }

      await session.commitTransaction();
      return refund;

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export default RefundService;

