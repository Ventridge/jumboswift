// services/business-service/src/routes/mpesa.routes.js
const express = require("express");
const router = express.Router();
const MpesaController = require("../controllers/mpesa.controller.js");
const { auth } = require("../middleware/auth.js");
const { validateMpesaCredentials } = require("../utils/validation.js");

/**
 * @route POST /api/mpesa/credentials
 * @description Add M-Pesa credentials for a business
 * @access Private
 */
router.post("/credentials", auth, async (req, res) => {
  try {
    // Validate input
    const validationErrors = validateMpesaCredentials(req.body);
    if (validationErrors) {
      return res.status(400).json({
        status: "error",
        message: "Validation error",
        errors: validationErrors,
      });
    }

    await MpesaController.addCredentials(req, res);
  } catch (error) {
    console.error("Add credentials error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to add M-Pesa credentials",
    });
  }
});

/**
 * @route PUT /api/mpesa/credentials
 * @description Update M-Pesa credentials
 * @access Private
 */
router.put("/credentials", auth, async (req, res) => {
  try {
    // const validationErrors = validateMpesaCredentials(req.body);
    // if (validationErrors) {
    //   return res.status(400).json({
    //     status: "error",
    //     message: "Validation error",
    //     errors: validationErrors,
    //   });
    // }

    await MpesaController.updateCredentials(req, res);
  } catch (error) {
    console.error("Update credentials error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update M-Pesa credentials",
    });
  }
});

/**
 * @route GET /api/mpesa/credentials
 * @description Get business M-Pesa credentials
 * @access Private
 */
router.get("/credentials", auth, async (req, res) => {
  try {
    await MpesaController.getCredentials(req, res);
  } catch (error) {
    console.error("Get credentials error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve M-Pesa credentials",
    });
  }
});

/**
 * @route DELETE /api/mpesa/credentials
 * @description Delete M-Pesa credentials
 * @access Private
 */
router.delete("/credentials", auth, async (req, res) => {
  try {
    await MpesaController.deleteCredentials(req, res);
  } catch (error) {
    console.error("Delete credentials error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete M-Pesa credentials",
    });
  }
});

/**
 * @route POST /api/mpesa/register-urls
 * @description Register M-Pesa callback URLs
 * @access Private
 */
router.post("/register-urls", auth, async (req, res) => {
  try {
    await MpesaController.registerUrls(req, res);
  } catch (error) {
    console.error("Register URLs error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to register M-Pesa URLs",
    });
  }
});

/**
 * @route POST /api/mpesa/callback
 * @description Handle M-Pesa payment callback
 * @access Public
 */
router.post("/callback", async (req, res) => {
  try {
    await MpesaController.handleCallback(req, res);
  } catch (error) {
    console.error("Callback handling error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to process M-Pesa callback",
    });
  }
});

/**
 * @route GET /api/mpesa/transactions
 * @description Get M-Pesa transactions for a business
 * @access Private
 */
// Regular transaction search with amount matching
//GET /transactions?amount=1000&timeWindow=5&matchExact=true
router.get("/transactions", auth, async (req, res) => {
  try {
    await MpesaController.getTransactions(req, res);
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve M-Pesa transactions",
    });
  }
});

//findMatchingTransaction

/** 
 * @route GET /api/mpesa/transaction
 * @description Get M-Pesa transaction details
 * @access Private
 */

// Specific POS transaction matching
//GET /transactions/match?amount=1000&timeWindow=5&matchExact=true
router.get("/transaction", auth, async (req, res) => {
  try {
    await MpesaController.findMatchingTransaction(req, res);
  } catch (error) {
    console.error("Get transaction details error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve M-Pesa transaction details",
    });
  }
}
);


/**
 * @route POST /api/mpesa/simulate
 * @description Simulate M-Pesa payment (for testing)
 * @access Private
 */
router.post("/simulate", auth, async (req, res) => {
  try {
    // Only allow in development/test environment
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        status: "error",
        message: "Simulation not allowed in production",
      });
    }

    await MpesaController.simulatePayment(req, res);
  } catch (error) {
    console.error("Payment simulation error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to simulate M-Pesa payment",
    });
  }
});

/**
 * @route GET /api/mpesa/balance
 * @description Get M-Pesa account balance
 * @access Private
 */
router.get("/balance", auth, async (req, res) => {
  try {
    await MpesaController.getBalance(req, res);
  } catch (error) {
    console.error("Get balance error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve M-Pesa balance",
    });
  }
});

module.exports = router;
