import { validatePayload } from "../middlewares/validator.js";
import Payment from "../services/PaymentService.js";

const PaymentService = new Payment();

export default class PaymentController {
  static async processPayment(req, res, next) {
    try {
      const payment = await PaymentService.processPayment(req.body, req);

      return res.status(200).json({
        status: "success",
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async initiateSTKPush(req, res, next) {
    try {
      const { businessId, phoneNumber, amount } = req.body;

      if (!businessId || !phoneNumber || !amount) {
        return res.status(400).json({
          status: "error",
          message: "Missing required fields",
        });
      }

      req.body.paymentMethod = "mpesa";
      req.body.type = "one-time";

      const result = await PaymentService.processPayment(req);

      return res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPaymentStatus(req, res, next) {
    try {
      const { paymentId } = req.params;
      const payment = await PaymentService.getPaymentStatus(paymentId);

      return res.status(200).json({
        status: "success",
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async handleMpesaCallback(req, res, next) {
    try {
      const result = await PaymentService.handleMpesaCallback(req.body);

      return res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async handleStripeWebhook(req, res, next) {
    try {
      const signature = req.headers["stripe-signature"];
      const result = await PaymentService.handleStripeWebhook(req.body, signature);

      return res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
