// services/webhook-service/src/routes/webhook.routes.js
const express = require("express");
const router = express.Router();
const WebhookController = require("../controllers/webhook.controller");
const auth = require("../middleware/auth");

// Register Webhook URL
router.post(
  "/register",
  auth,
  [
    body("webhookUrl").isURL().withMessage("Valid webhook URL required"),
    body("events").isArray().withMessage("Events must be an array"),
    body("events.*")
      .isIn(["payment.success", "payment.failed", "payment.pending"])
      .withMessage("Invalid event type"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const webhookController = new WebhookController();
      const result = await webhookController.registerWebhook(
        req.business._id,
        req.body
      );

      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
