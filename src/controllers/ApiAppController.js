// src/controllers/ApiAppController.js
import ApiApp from "../models/ApiApp.js";
import { generateAppId } from "../utils/helpers.js";

export default class ApiAppController {
  static async registerApp(req, res, next) {
    try {
      const { name, description, ipWhitelist, accessScopes, rateLimit } = req.body;

      // Generate unique App ID
      const appId = await generateAppId();

      // Generate API credentials
      const { apiKey, apiSecret } = ApiApp.generateCredentials();

      const app = await ApiApp.create({
        appId,
        name,
        description,
        apiKey,
        apiSecret,
        ipWhitelist,
        accessScopes,
        rateLimit,
      });

      // Return everything including secret only on initial creation
      return res.status(201).json({
        status: "success",
        message: "Application registered successfully",
        data: {
          appId: app.appId,
          name: app.name,
          apiKey: app.apiKey,
          apiSecret: app.apiSecret, // Only returned on creation
          accessScopes: app.accessScopes,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAppDetails(req, res, next) {
    try {
      const { appId } = req.params;

      const app = await ApiApp.findOne({ appId }).select("-apiSecret"); // Never return secret after initial creation

      if (!app) {
        return res.status(404).json({
          status: "error",
          message: "Application not found",
        });
      }

      return res.status(200).json({
        status: "success",
        data: app,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateApp(req, res, next) {
    try {
      const { appId } = req.params;
      const { name, description, ipWhitelist, accessScopes, rateLimit, status } = req.body;

      const app = await ApiApp.findOne({ appId });
      if (!app) {
        return res.status(404).json({
          status: "error",
          message: "Application not found",
        });
      }

      // Update fields
      Object.assign(app, {
        name,
        description,
        ipWhitelist,
        accessScopes,
        rateLimit,
        status,
      });

      await app.save();

      return res.status(200).json({
        status: "success",
        message: "Application updated successfully",
        data: {
          appId: app.appId,
          name: app.name,
          status: app.status,
          accessScopes: app.accessScopes,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async rotateApiSecret(req, res, next) {
    try {
      const { appId } = req.params;

      const app = await ApiApp.findOne({ appId });
      if (!app) {
        return res.status(404).json({
          status: "error",
          message: "Application not found",
        });
      }

      // Generate new API secret
      const { apiSecret: newApiSecret } = ApiApp.generateCredentials();
      app.apiSecret = newApiSecret;
      await app.save();

      return res.status(200).json({
        status: "success",
        message: "API secret rotated successfully",
        data: {
          appId: app.appId,
          apiKey: app.apiKey,
          apiSecret: newApiSecret, // Return new secret only during rotation
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async revokeAccess(req, res, next) {
    try {
      const { appId } = req.params;

      const app = await ApiApp.findOne({ appId });
      if (!app) {
        return res.status(404).json({
          status: "error",
          message: "Application not found",
        });
      }

      app.status = "suspended";
      await app.save();

      return res.status(200).json({
        status: "success",
        message: "Application access revoked successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
