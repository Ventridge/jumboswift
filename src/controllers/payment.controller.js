const VaultService = require("../services/vault.service");
const MpesaClient = require("../services/mpesa.service");
const MpesaCredential = require("../models/MpesaCredential");
const Transaction = require("../models/Transaction");
const { ObjectId } = require('mongoose').Types;

// services/payment-service/src/controllers/payment.controller.js
class PaymentController {
    constructor() {
      this.vaultService = new VaultService();
    }

    async createTransaction(transactionData) {
      try {
          const transaction = new Transaction({
              businessId: transactionData.businessId,
              amount: transactionData.amount,
              phoneNumber: transactionData.phoneNumber,
              checkoutRequestID: transactionData.checkoutRequestId,
              merchantRequestID: transactionData.merchantRequestId || '', // Add this if available
              status: 'pending',
              accountReference: transactionData.accountReference,
              metadata: {
                  initiatedFrom: 'api',
                  ...transactionData.metadata
              }
          });

          return await transaction.save();
      } catch (error) {
          console.error('Error creating transaction:', error);
          throw new Error('Failed to create transaction record');
      }
  }

  
    async initiateMpesaPayment(data) {
      try {
          // 1. Get M-Pesa credentials from MongoDB
          const mpesaCredentials = await MpesaCredential.findOne({
              businessId: data.businessId
          });
          
          if (!mpesaCredentials) {
              throw new Error('M-Pesa credentials not found');
          }

          // 2. Get sensitive credentials from Vault
          const vaultCredentials = await this.vaultService.getMpesaCredentials(data.businessId);

          console.log('Vault credentials:', vaultCredentials);
          
          if (!vaultCredentials) {
              throw new Error('Vault credentials not found');
          }

          // 3. Combine all credentials
          const credentials = {
              shortcode: mpesaCredentials.shortcode,
              paybillNumber: mpesaCredentials.paybillNumber,
              callbackUrl: mpesaCredentials.callbackUrl,
              timeoutUrl: mpesaCredentials.timeoutUrl,
              environment: mpesaCredentials.environment,
              consumerKey: vaultCredentials.consumerKey,
              consumerSecret: vaultCredentials.consumerSecret,
              passkey: vaultCredentials.passkey
          };

          // 4. Initialize MPesa client with complete credentials
          const mpesa = new MpesaClient(credentials);

          // 5. Initiate payment
          const paymentResult = await mpesa.initiateSTKPush({
              amount: data.amount,
              phoneNumber: data.phoneNumber,
              accountReference: data.accountReference,
              description: data.description || 'Payment'
          });

          console.log('Payment result:', paymentResult);

          // 6. Create transaction record
          await this.createTransaction({
            businessId: data.businessId,
            checkoutRequestId: paymentResult.CheckoutRequestID,
            merchantRequestId: paymentResult.MerchantRequestID,
            amount: data.amount,
            phoneNumber: data.phoneNumber,
            accountReference: data.accountReference,
            metadata: {
                description: data.description,
                customerMessage: paymentResult.CustomerMessage
            }
        });


          return {
              checkoutRequestId: paymentResult.CheckoutRequestID,
              merchantRequestId: paymentResult.MerchantRequestID,
              responseCode: paymentResult.ResponseCode,
              customerMessage: paymentResult.CustomerMessage
          };

      } catch (error) {
          console.error('Payment initiation error:', error);
          throw error;
      }
  }
  
    async handleMpesaCallback(callbackData) {
      const { ResultCode, CheckoutRequestID, ResultDesc } = callbackData.Body.stkCallback;
      
      // Update transaction status
      const transaction = await this.updateTransactionStatus(
        CheckoutRequestID,
        ResultCode === 0 ? 'completed' : 'failed',
        ResultDesc
      );
  
      // Send webhook if business has registered
      if (transaction.businessId) {
        await this.webhookService.sendWebhook(transaction.businessId, {
          type: ResultCode === 0 ? 'payment.success' : 'payment.failed',
          data: {
            transactionId: transaction.id,
            amount: transaction.amount,
            status: transaction.status,
            description: ResultDesc
          }
        });
      }
    }
  }

module.exports = PaymentController;