// src/interfaces/PaymentProcessor.js
class PaymentProcessor {
  async processPayment(payment, credentials) {
    throw new Error("Method not implemented");
  }

  async verifyCredentials(credentials) {
    throw new Error("Method not implemented");
  }

  async handleWebhook(payload, signature) {
    throw new Error("Method not implemented");
  }

  async processRefund(refund, originalPayment) {
    throw new Error("Method not implemented");
  }
}

export default PaymentProcessor;
