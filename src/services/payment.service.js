// services/payment-service/src/server.js

const express = require('express');
const VaultService = require('./vault');

class PaymentService {
  constructor() {
    this.app = express();
  }

  async init() {
    await this.setupDatabase();
    await this.setupVault();
  }

  async setupVault() {
    try {
      this.vault = await VaultService.connect({
        address: process.env.VAULT_ADDR || 'http://vault:8200',
        token: process.env.VAULT_TOKEN
      });
    } catch (error) {
      console.error('Failed to setup Vault:', error);
      process.exit(1);
    }
  }

  async processMpesaPayment(businessId, paymentData) {
    try {
      // Get business credentials from vault
      const credentials = await this.vault.getMpesaCredentials(businessId);

      // Initialize M-Pesa client
      const mpesa = new MpesaClient(credentials);

      // Process payment
      const result = await mpesa.initiatePayment({
        amount: paymentData.amount,
        phone: paymentData.phoneNumber,
        reference: paymentData.reference
      });

      // Store transaction
      await this.storeTransaction({
        businessId,
        transactionId: result.transactionId,
        amount: paymentData.amount,
        status: 'pending'
      });

      return result;
    } catch (error) {
      console.error('Payment processing failed:', error);
      throw error;
    }
  }
}

module.exports = PaymentService;