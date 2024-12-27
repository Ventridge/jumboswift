// integration/mpesa/src/MpesaClient.js
const axios = require('axios');
const moment = require('moment');

class MpesaClient {
    constructor(credentials) {
      console.log('MpesaClient credentials:', credentials);
        // Validate required credentials
        const requiredFields = [
            'shortcode',
            'consumerKey',
            'consumerSecret',
            'passkey',
            'callbackUrl'
        ];

        for (const field of requiredFields) {
            if (!credentials[field]) {
                throw new Error(`Missing required credential: ${field}`);
            }
        }

        this.credentials = credentials;
        this.baseUrl = credentials.environment === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
    }
    async generateAccessToken() {
      try {
          const auth = Buffer.from(
              `${this.credentials.consumerKey}:${this.credentials.consumerSecret}`
          ).toString('base64');

          const response = await axios.get(
              `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
              {
                  headers: {
                      Authorization: `Basic ${auth}`
                  }
              }
          );

          return response.data.access_token;
      } catch (error) {
          console.error('Access token generation error:', error.response?.data || error.message);
          throw new Error('Failed to generate access token');
      }
  }


    generatePassword(timestamp) {
        return Buffer.from(
            `${this.credentials.shortcode}${this.credentials.passkey}${timestamp}`
        ).toString('base64');
    }

    async initiateSTKPush(payload) {
        const { amount, phoneNumber, accountReference, description } = payload;

        if (!amount || !phoneNumber || !accountReference) {
            throw new Error('Missing required payment parameters');
        }

        const token = await this.generateAccessToken();
        const timestamp = moment().format('YYYYMMDDHHmmss');
        const password = this.generatePassword(timestamp);

        try {
            const response = await axios.post(
                `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
                {
                    BusinessShortCode: this.credentials.shortcode,
                    Password: password,
                    Timestamp: timestamp,
                    TransactionType: "CustomerPayBillOnline",
                    Amount: amount,
                    PartyA: phoneNumber,
                    PartyB: this.credentials.shortcode,
                    PhoneNumber: phoneNumber,
                    CallBackURL: this.credentials.callbackUrl,
                    AccountReference: accountReference,
                    TransactionDesc: description || 'Payment'
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('STK Push error:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = MpesaClient;