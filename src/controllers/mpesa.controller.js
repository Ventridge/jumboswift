// services/business-service/src/controllers/mpesa.controller.js
const MpesaCredential = require("../models/MpesaCredential");
const Transaction = require("../models/Transaction");
const VaultService = require("../services/vault.service");
const axios = require("axios");

class MpesaController {
  /**
   * Add M-Pesa credentials for a business
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   */
  static async addCredentials(req, res) {
    try {
      const {
        paybillNumber,
        consumerKey,
        consumerSecret,
        passkey,
        environment = "sandbox",
        shortcode,
        callbackUrl,
        timeoutUrl,
      } = req.body;
      console.log("req.body:", req.body);
      console.log("req.business:", req.business);

      // Check if credentials already exist
      const existingCredentials = await MpesaCredential.findOne({
        businessId: req.business._id,
      });

      if (existingCredentials) {
        return res.status(409).json({
          status: "error",
          message: "M-Pesa credentials already exist for this business",
        });
      }

      // Store sensitive data in vault
      const vaultService = new VaultService();
      await vaultService.storeMpesaCredentials(req.business._id, {
        consumerKey,
        consumerSecret,
        passkey,
        environment,
      });

      // Store non-sensitive data in database
      const credentials = new MpesaCredential({
        businessId: req.business._id,
        paybillNumber,
        environment,
        status: "active",
        vaultSecretPath: `secret/mpesa/${req.business._id}`,
        shortcode: shortcode || paybillNumber, // Often shortcode is same as paybill
        callbackUrl:
          callbackUrl || `${process.env.API_BASE_URL}/mpesa/callback`,
        timeoutUrl: timeoutUrl || `${process.env.API_BASE_URL}/mpesa/timeout`,
      });

      // const newCredential = new MpesaCredential({
      //     businessId: '60b9f6f6b6b2f40015d2f7e7',
      //     paybillNumber: '123456',
      //     shortcode: '123456',
      //     callbackUrl: 'https://example.com/callback',
      //     timeoutUrl: 'https://example.com/timeout',
      //     vaultSecretPath: 'secret/data/mpesa/123456'
      // });

      await credentials.save();

      res.status(201).json({
        status: "success",
        message: "M-Pesa credentials added successfully",
      });
    } catch (error) {
      console.error("Add credentials error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to add M-Pesa credentials",
      });
    }
  }

  /**
   * Update M-Pesa credentials
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   */
  static async updateCredentials(req, res) {
    try {
      const {
        paybillNumber,
        consumerKey,
        consumerSecret,
        passkey,
        environment,
        callbackUrl,
        timeoutUrl,
      } = req.body;

      const credentials = await MpesaCredential.findOne({
        businessId: req.business._id,
      });

      if (!credentials) {
        return res.status(404).json({
          status: "error",
          message: "M-Pesa credentials not found",
        });
      }

      // Update vault data
      const vaultService = new VaultService();
      await vaultService.updateMpesaCredentials(req.business._id, {
        consumerKey,
        consumerSecret,
        passkey,
        environment: environment || credentials.environment,
      });

      // Update database record
      credentials.paybillNumber = paybillNumber || credentials.paybillNumber;
      credentials.environment = environment || credentials.environment;
      await credentials.save();

      if (callbackUrl) {
        credentials.callbackUrl = callbackUrl;
      }

      if (timeoutUrl) {
        credentials.timeoutUrl = timeoutUrl;
      }

      await credentials.save();

      res.json({
        status: "success",
        message: "M-Pesa credentials updated successfully",
      });
    } catch (error) {
      console.error("Update credentials error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to update M-Pesa credentials",
      });
    }
  }

  /**
   * Get M-Pesa credentials
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   */
  static async getCredentials(req, res) {
    try {
      const credentials = await MpesaCredential.findOne({
        businessId: req.business._id,
      }).select("-vaultSecretPath");

      if (!credentials) {
        return res.status(404).json({
          status: "error",
          message: "M-Pesa credentials not found",
        });
      }

      res.json({
        status: "success",
        data: credentials,
      });
    } catch (error) {
      console.error("Get credentials error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to retrieve M-Pesa credentials",
      });
    }
  }

  /**
   * Delete M-Pesa credentials
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   */
  static async deleteCredentials(req, res) {
    try {
      const credentials = await MpesaCredential.findOne({
        businessId: req.business._id,
      });

      if (!credentials) {
        return res.status(404).json({
          status: "error",
          message: "M-Pesa credentials not found",
        });
      }

      // Delete from vault
      const vaultService = new VaultService();
      await vaultService.deleteMpesaCredentials(req.business._id);

      // Delete from database
      await credentials.remove();

      res.json({
        status: "success",
        message: "M-Pesa credentials deleted successfully",
      });
    } catch (error) {
      console.error("Delete credentials error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to delete M-Pesa credentials",
      });
    }
  }

  /**
   * Handle M-Pesa callback
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   */
  static async handleCallback(req, res) {
    try {
      const callbackData = req.body;
      console.log("Callback data:", callbackData);

      // Extract data from the nested structure
      const stkCallback = callbackData.Body.stkCallback;
      const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
        stkCallback;

      // Find related transaction
      const transaction = await Transaction.findOne({
        checkoutRequestID: CheckoutRequestID,
      });

      if (!transaction) {
        console.error("Transaction not found for callback:", CheckoutRequestID);
        return res.status(404).json({
          status: "error",
          message: "Transaction not found",
        });
      }

      // Extract metadata items
      let metadata = {};
      if (CallbackMetadata && CallbackMetadata.Item) {
        CallbackMetadata.Item.forEach((item) => {
          metadata[item.Name] = item.Value;
        });
      }

      // Prepare callback data for transaction update
      const processedCallback = {
        ResultCode,
        ResultDesc,
        MpesaReceiptNumber: metadata.MpesaReceiptNumber,
        Amount: metadata.Amount,
        TransactionDate: metadata.TransactionDate,
        PhoneNumber: metadata.PhoneNumber,
      };

      // Update transaction with processed callback data
      await transaction.handleCallback(processedCallback);

      res.json({
        status: "success",
        message: "Callback processed successfully",
      });
    } catch (error) {
      console.error("Callback handling error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to process callback",
      });
    }
  }

  /**
   * Get M-Pesa transactions
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   */
  static async getTransactions(req, res) {
    try {
      const {
        startDate,
        endDate,
        status,
        page = 1,
        limit = 10,
        amount, // Add amount parameter
        timeWindow = 5, // Time window in minutes to look back
        matchExact = true, // Whether to match amount exactly
      } = req.query;

      const query = { businessId: req.business._id };

      // Date range filter
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      // Status filter
      if (status) {
        query.status = status;
      }

      // Amount matching logic
      if (amount) {
        const numericAmount = parseFloat(amount);
        if (!isNaN(numericAmount)) {
          if (matchExact) {
            query.amount = numericAmount;
          } else {
            // Allow for small variations (e.g., ±1 for rounding)
            query.amount = {
              $gte: numericAmount - 1,
              $lte: numericAmount + 1,
            };
          }

          // Add time window constraint
          query.createdAt = {
            $gte: new Date(Date.now() - timeWindow * 60 * 1000), // Convert minutes to milliseconds
          };
        }
      }

      // Get transactions
      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Transaction.countDocuments(query);

      // Add a helper method to find the most recent matching transaction
      const findRecentMatchingTransaction = async () => {
        if (!amount) return null;

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount)) return null;

        const matchQuery = {
          businessId: req.business._id,
          status: "completed",
          amount: matchExact
            ? numericAmount
            : {
                $gte: numericAmount - 1,
                $lte: numericAmount + 1,
              },
          createdAt: {
            $gte: new Date(Date.now() - timeWindow * 60 * 1000),
          },
        };

        return await Transaction.findOne(matchQuery).sort({ createdAt: -1 });
      };

      // If amount is specified, include the most recent matching transaction
      const recentMatch = amount ? await findRecentMatchingTransaction() : null;

      res.json({
        status: "success",
        data: {
          transactions,
          recentMatch, // Include the most recent matching transaction if found
          pagination: {
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
          },
          filters: {
            amount: amount ? parseFloat(amount) : null,
            timeWindow,
            matchExact,
          },
        },
      });
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to retrieve transactions",
      });
    }
  }

  // Add a new method specifically for POS transaction matching
  static async findMatchingTransaction(req, res) {
    try {
      const {
        amount,
        timeWindow = 5, // Default 5 minutes
        matchExact = true,
      } = req.query;

      if (!amount) {
        return res.status(400).json({
          status: "error",
          message: "Amount is required",
        });
      }

      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid amount",
        });
      }

      const query = {
        businessId: req.business._id,
        status: "completed",
        createdAt: {
          $gte: new Date(Date.now() - timeWindow * 60 * 1000),
        },
      };

      // Set amount matching criteria
      if (matchExact) {
        query.amount = numericAmount;
      } else {
        query.amount = {
          $gte: numericAmount - 1,
          $lte: numericAmount + 1,
        };
      }

      const transaction = await Transaction.findOne(query).sort({
        createdAt: -1,
      });

      if (!transaction) {
        return res.status(404).json({
          status: "success",
          message: "No matching transaction found",
          data: {
            searchCriteria: {
              amount: numericAmount,
              timeWindow,
              matchExact,
            },
          },
        });
      }

      res.json({
        status: "success",
        data: {
          transaction,
          searchCriteria: {
            amount: numericAmount,
            timeWindow,
            matchExact,
          },
        },
      });
    } catch (error) {
      console.error("Find matching transaction error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to find matching transaction",
      });
    }
  }
  /**
   * Register M-Pesa callback URLs
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   */
  static async registerUrls(req, res) {
    try {
      const credentials = await MpesaCredential.findOne({
        businessId: req.business._id,
      });

      if (!credentials) {
        return res.status(404).json({
          status: "error",
          message: "M-Pesa credentials not found",
        });
      }

      // Get access token
      const vaultService = new VaultService();
      const mpesaCredentials = await vaultService.getMpesaCredentials(
        req.business._id
      );

      const tokenUrl =
        credentials.environment === "production"
          ? "https://api.safaricom.co.ke/oauth/v1/generate"
          : "https://sandbox.safaricom.co.ke/oauth/v1/generate";

      const auth = Buffer.from(
        `${mpesaCredentials.consumerKey}:${mpesaCredentials.consumerSecret}`
      ).toString("base64");

      const {
        data: { access_token },
      } = await axios.get(tokenUrl, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      // Register URLs
      const registerUrl =
        credentials.environment === "production"
          ? "https://api.safaricom.co.ke/mpesa/c2b/v1/registerurl"
          : "https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl";

      await axios.post(
        registerUrl,
        {
          ShortCode: credentials.paybillNumber,
          ResponseType: "Completed",
          ConfirmationURL: `${process.env.API_BASE_URL}/mpesa/callback`,
          ValidationURL: `${process.env.API_BASE_URL}/mpesa/validate`,
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      res.json({
        status: "success",
        message: "URLs registered successfully",
      });
    } catch (error) {
      console.error("Register URLs error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to register URLs",
      });
    }
  }
}

module.exports = MpesaController;
