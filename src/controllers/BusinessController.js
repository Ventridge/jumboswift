import Business from "../services/BusinessService.js";
import { validateBusinessSetup } from "../utils/validators.js";

const BusinessService = new Business();

export default class BusinessController {
  static async registerBusiness(req, res, next) {
    try {
      const { app } = req;

      const business = await BusinessService.registerBusiness(req.body, app.appId);

      return res.status(201).json({
        status: "success",
        data: business,
      });
    } catch (error) {
      next(error);
    }
  }

  static async setupPaymentMethods(req, res, next) {
    try {
      const { app } = req;
      const setup = await BusinessService.setupPaymentMethods(req.body, req);

      return res.status(200).json({
        status: "success",
        data: setup,
      });
    } catch (error) {
      next(error);
    }
  }

  static async connectBusiness(req, res, next) {
    try {
      const { businessId } = req.body;
      const { app } = req;

      const business = await BusinessService.connectBusinessToApp(businessId, app.appId);

      return res.status(200).json({
        status: "success",
        data: business,
      });
    } catch (error) {
      next(error);
    }
  }

  static async disconnectBusiness(req, res, next) {
    try {
      const { businessId } = req.params;
      const { app } = req;

      const business = await BusinessService.disconnectBusinessFromApp(businessId, app.appId);

      return res.status(200).json({
        status: "success",
        data: business,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCredentials(req, res, next) {
    try {
      const { businessId } = req.params;
      const { app } = req;
      req.body.app = app._id;
      const credentials = await BusinessService.updateCredentials(businessId, req);

      return res.status(200).json({
        status: "success",
        data: credentials,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPaymentMethods(req, res, next) {
    try {
      const { businessId } = req.params;
      const methods = await BusinessService.getPaymentMethods(businessId);

      return res.status(200).json({
        status: "success",
        data: methods,
      });
    } catch (error) {
      next(error);
    }
  }
}
