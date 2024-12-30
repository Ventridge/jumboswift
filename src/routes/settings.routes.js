// services/business-service/src/routes/settings.routes.js
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { auth } = require("../middleware/auth.js");
const SettingsController = require("../controllers/settings.controller.js");

// Update Business Profile
router.put(
  "/profile",
  auth,
  [
    body("businessName").optional().trim().notEmpty(),
    body("phoneNumber")
      .optional()
      .matches(/^254\d{9}$/),
    body("email").optional().isEmail(),
    body("address").optional().isObject(),
  ],
  async (req, res) => {
    try {
      const settingsController = new SettingsController();
      const profile = await settingsController.updateProfile(
        req.business._id,
        req.body
      );
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update Notification Settings
router.put(
  "/notifications",
  auth,
  [
    body("email").isBoolean(),
    body("sms").isBoolean(),
    body("webhook").isBoolean(),
    body("emailAddresses").optional().isArray(),
    body("phoneNumbers").optional().isArray(),
  ],
  async (req, res) => {
    try {
      const settingsController = new SettingsController();
      const settings = await settingsController.updateNotificationSettings(
        req.business._id,
        req.body
      );
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
