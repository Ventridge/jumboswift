class CashService {
  async processPayment(payment) {
    try {
      return {
        success: true,
        transactionId: payment._id.toString(),
        status: "completed",
        details: {
          method: "cash",
          amount: payment.amount,
          currency: payment.currency,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error,
      };
    }
  }

  async processRefund(refund, originalPayment) {
    try {
      return {
        success: true,
        transactionId: refund._id.toString(),
        status: "completed",
        details: {
          method: "cash",
          amount: refund.amount,
          currency: originalPayment.currency,
          originalTransactionId: originalPayment._id,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error,
      };
    }
  }

  async verifyCredentials() {
    return { success: true };
  }
}

export default CashService;
