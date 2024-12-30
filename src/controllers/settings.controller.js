// services/business-service/src/controllers/settings.controller.js
const Business = require("../models/Business");
const validator = require("validator");

class SettingsController {
  /**
   * Get business settings
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   */
  static async getSettings(req, res) {
    try {
      const business = await Business.findById(req.business._id).select(
        "settings notifications webhookUrl"
      );

      if (!business) {
        return res.status(404).json({
          status: "error",
          message: "Business not found",
        });
      }

      res.json({
        status: "success",
        data: {
          settings: business.settings || {},
          notifications: business.notifications || {},
          webhookUrl: business.webhookUrl,
        },
      });
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to retrieve settings",
      });
    }
  }

  /**
   * Update business settings
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   */
  static async updateSettings(req, res) {
    try {
      const { settings } = req.body;

      if (!settings || typeof settings !== "object") {
        return res.status(400).json({
          status: "error",
          message: "Invalid settings data",
        });
      }

      const business = await Business.findById(req.business._id);
      if (!business) {
        return res.status(404).json({
          status: "error",
          message: "Business not found",
        });
      }

      // Update settings
      business.settings = {
        ...business.settings,
        ...settings,
      };

      await business.save();

      res.json({
        status: "success",
        message: "Settings updated successfully",
        data: { settings: business.settings },
      });
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to update settings",
      });
    }
  }

  /**
   * Update notification preferences
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   */
  static async updateNotifications(req, res) {
    try {
      const { notifications } = req.body;

      if (!notifications || typeof notifications !== "object") {
        return res.status(400).json({
          status: "error",
          message: "Invalid notification settings",
        });
      }

      // Validate email addresses if provided
      if (notifications.emailAddresses) {
        for (const email of notifications.emailAddresses) {
          if (!validator.isEmail(email)) {
            return res.status(400).json({
              status: "error",
              message: `Invalid email address: ${email}`,
            });
          }
        }
      }

      // Validate phone numbers if provided
      if (notifications.phoneNumbers) {
        for (const phone of notifications.phoneNumbers) {
          if (!/^254\d{9}$/.test(phone)) {
            return res.status(400).json({
              status: "error",
              message: `Invalid phone number: ${phone}`,
            });
          }
        }
      }

      const business = await Business.findById(req.business._id);
      if (!business) {
        return res.status(404).json({
          status: "error",
          message: "Business not found",
        });
      }

      // Update notification settings
      business.notifications = {
        ...business.notifications,
        ...notifications,
      };

      await business.save();

      res.json({
        status: "success",
        message: "Notification settings updated successfully",
        data: { notifications: business.notifications },
      });
    } catch (error) {
      console.error("Update notifications error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to update notification settings",
      });
    }
  }

  /**
   * Set webhook URL
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   */
  static async setWebhook(req, res) {
    try {
      const { webhookUrl } = req.body;

      if (!webhookUrl) {
        return res.status(400).json({
          status: "error",
          message: "Webhook URL is required",
        });
      }

      // Validate webhook URL
      if (!validator.isURL(webhookUrl, { protocols: ["https"] })) {
        return res.status(400).json({
          status: "error",
          message: "Invalid webhook URL. Must be a valid HTTPS URL",
        });
      }

      const business = await Business.findById(req.business._id);
      if (!business) {
        return res.status(404).json({
          status: "error",
          message: "Business not found",
        });
      }

      // Update webhook URL
      business.webhookUrl = webhookUrl;
      await business.save();

      // Test webhook connectivity
      try {
        const testResult = await SettingsController.testWebhook(webhookUrl);
        if (!testResult.success) {
          return res.status(400).json({
            status: "error",
            message: "Webhook URL is not responding correctly",
          });
        }
      } catch (error) {
        return res.status(400).json({
          status: "error",
          message: "Failed to verify webhook URL",
        });
      }

      res.json({
        status: "success",
        message: "Webhook URL set successfully",
        data: { webhookUrl: business.webhookUrl },
      });
    } catch (error) {
      console.error("Set webhook error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to set webhook URL",
      });
    }
  }

  /**
   * Test webhook connectivity
   * @param {string} webhookUrl Webhook URL to test
   * @returns {Promise<Object>} Test result
   */
  static async testWebhook(webhookUrl) {
    try {
      const axios = require("axios");
      const testPayload = {
        event: "test",
        timestamp: new Date().toISOString(),
      };

      const response = await axios.post(webhookUrl, testPayload, {
        headers: {
          "Content-Type": "application/json",
          "X-Test-Header": "true",
        },
        timeout: 5000, // 5 seconds timeout
      });

      return {
        success: response.status === 200,
        statusCode: response.status,
      };
    } catch (error) {
      console.error("Webhook test error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = SettingsController;
