import axios from "axios";
import config from "../config/envConfig.js";
import { getMpesaCredentials } from "../utils/getMpesaCredentials.js";

class MpesaService {
  constructor() {
    this.baseUrl = config.env === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
    this.credentials = null;
    this.businessId = null;
  }

  async init() {
    try {
      this.credentials = await getMpesaCredentials(this.businessId);
    } catch (error) {
      throw new Error(`Failed to get MPesa credentials: ${error.message}`);
    }
  }

  async getAccessToken() {
    try {
      await this.init();
      const auth = Buffer.from(`${this.credentials.consumerKey}:${this.credentials.consumerSecret}`).toString("base64");
      const response = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });
      return response.data.access_token;
    } catch (error) {
      throw new Error(`Failed to get MPesa access token: ${error.message}`);
    }
  }

  async initiateSTKPush(payment, phoneNumber) {
    try {
      this.businessId = payment.businessId;
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(timestamp);

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: this.credentials.shortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: payment.amount,
          PartyA: phoneNumber,
          PartyB: this.credentials.shortCode,
          PhoneNumber: phoneNumber,
          CallBackURL: this.credentials.callbackUrl,
          AccountReference: payment.accountReference,
          TransactionDesc: `Payment for ${payment._id}`,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return {
        success: true,
        checkoutRequestId: response.data.CheckoutRequestID,
        merchantRequestId: response.data.MerchantRequestID,
        responseCode: response.data.ResponseCode,
        customerMessage: response.data.CustomerMessage,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data,
      };
    }
  }

  async processPayment(payment, credentials) {
    // For MPesa, we initiate STK push and track the status
    const result = await this.initiateSTKPush(payment, payment.phoneNumber);
    return result;
  }

  generateTimestamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    const second = String(date.getSeconds()).padStart(2, "0");
    return `${year}${month}${day}${hour}${minute}${second}`;
  }

  generatePassword(timestamp) {
    const shortcode = this.credentials.shortCode;
    const passkey = this.credentials.passKey;
    const str = shortcode + passkey + timestamp;
    return Buffer.from(str).toString("base64");
  }

  async handleCallback(callbackData) {
    try {
      const {
        Body: {
          stkCallback: { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc },
        },
      } = callbackData;

      // Find and update payment status
      const payment = await PaymentModel.findOne({
        "processorResponse.merchantRequestId": MerchantRequestID,
      });

      if (!payment) {
        throw new Error("Payment not found");
      }

      payment.status = ResultCode === "0" ? "completed" : "failed";
      payment.processorResponse = {
        ...payment.processorResponse,
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        checkoutRequestId: CheckoutRequestID,
      };

      await payment.save();

      return { received: true };
    } catch (error) {
      throw new Error(`MPesa Callback Error: ${error.message}`);
    }
  }
}

export default MpesaService;
