import RefundService from "../services/RefundService.js";

export default class RefundController {
  static async processRefund(req, res, next) {
    try {
      const { businessId } = req.user;
      const refundData = {
        ...req.body,
        businessId,
      };

      const refund = await RefundService.processRefund(refundData);

      return res.status(200).json({
        status: "success",
        data: refund,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRefundDetails(req, res, next) {
    try {
      const { refundId } = req.params;
      const refund = await RefundService.getRefundDetails(refundId);

      // Ensure business has access to this refund
      if (refund.businessId !== req.user.businessId) {
        return res.status(403).json({
          status: "error",
          message: "Access denied",
        });
      }

      return res.status(200).json({
        status: "success",
        data: refund,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listRefunds(req, res, next) {
    try {
      const { status, dateRange } = req.query;
      const { businessId } = req.user;

      const filters = {
        status,
        dateRange: dateRange ? JSON.parse(dateRange) : undefined,
      };

      const refunds = await RefundService.listRefunds(businessId, filters);

      return res.status(200).json({
        status: "success",
        data: refunds,
      });
    } catch (error) {
      next(error);
    }
  }
}
