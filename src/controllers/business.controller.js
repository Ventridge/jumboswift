// services/business-service/src/controllers/business.controller.js
const Business = require("../models/Business.js");
const MpesaCredential = require("../models/MpesaCredential.js");
const Transaction = require("../models/Transaction.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { validateBusinessData } = require("../utils/validation.js");
const VaultService = require("../services/vault.service.js");

class BusinessController {
  /**
   * Register a new business
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   */
  static async register(req, res) {
    try {
      const { businessName, email, password, phoneNumber, businessType } =
        req.body;

      // Validate input data
      const validationError = validateBusinessData({
        businessName,
        email,
        password,
        phoneNumber,
        businessType,
      });

      if (validationError) {
        return res.status(400).json({
          status: "error",
          message: "Validation error",
          errors: validationError,
        });
      }

      // Check if business already exists
      const existingBusiness = await Business.findOne({ email });
      if (existingBusiness) {
        return res.status(409).json({
          status: "error",
          message: "Business with this email already exists",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create new business
      const business = new Business({
        businessName,
        email,
        password: hashedPassword,
        phoneNumber,
        businessType,
        status: "pending",
      });

      await business.save();

      // Generate JWT token
      const token = jwt.sign(
        { businessId: business._id },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "24h" }
      );

      res.status(201).json({
        status: "success",
        message: "Business registered successfully",
        data: {
          business: {
            id: business._id,
            businessName: business.businessName,
            email: business.email,
            status: business.status,
          },
          token,
        },
      });
    } catch (error) {
      console.error("Business registration error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to register business",
      });
    }
  }

  /**
   * Get business profile
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   */
  static async getProfile(req, res) {
    try {
      const business = await Business.findById(req.business._id).select(
        "-password -__v"
      );

      if (!business) {
        return res.status(404).json({
          status: "error",
          message: "Business not found",
        });
      }

      // Get M-Pesa integration status
      const mpesaCredentials = await MpesaCredential.findOne({
        businessId: business._id,
      }).select("paybillNumber status");

      res.json({
        status: "success",
        data: {
          business,
          mpesaIntegration: mpesaCredentials || null,
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to get business profile",
      });
    }
  }

  /**
   * Update business profile
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   */
  static async updateProfile(req, res) {
    try {
      const { businessName, phoneNumber, address, businessType } = req.body;

      const updates = {
        ...(businessName && { businessName }),
        ...(phoneNumber && { phoneNumber }),
        ...(address && { address }),
        ...(businessType && { businessType }),
      };

      const business = await Business.findByIdAndUpdate(
        req.business._id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select("-password -__v");

      if (!business) {
        return res.status(404).json({
          status: "error",
          message: "Business not found",
        });
      }

      res.json({
        status: "success",
        message: "Profile updated successfully",
        data: { business },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to update business profile",
      });
    }
  }

  /**
   * Add M-Pesa credentials
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   */
  static async addMpesaCredentials(req, res) {
    try {
      const { paybillNumber, consumerKey, consumerSecret, passkey } = req.body;

      if (!paybillNumber || !consumerKey || !consumerSecret || !passkey) {
        return res.status(400).json({
          status: "error",
          message: "All fields are required",
        });
      }

      // Check if credentials already exist
      const existingCredentials = await MpesaCredential.findOne({
        businessId: req.business._id,
      });

      if (existingCredentials) {
        return res.status(409).json({
          status: "error",
          message: "M-Pesa credentials already exist",
        });
      }

      // Store credentials in vault
      const vault = new VaultService();
      await vault.storeMpesaCredentials(req.business._id, {
        consumerKey,
        consumerSecret,
        passkey,
      });

      // Store reference in database
      const mpesaCredential = new MpesaCredential({
        businessId: req.business._id,
        paybillNumber,
        status: "active",
      });

      await mpesaCredential.save();

      res.status(201).json({
        status: "success",
        message: "M-Pesa credentials added successfully",
      });
    } catch (error) {
      console.error("Add M-Pesa credentials error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to add M-Pesa credentials",
      });
    }
  }

  /**
   * Get business transactions
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   */
  static async getTransactions(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;
      const status = req.query.status;

      const query = { businessId: req.business._id };

      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      if (status) {
        query.status = status;
      }

      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Transaction.countDocuments(query);

      res.json({
        status: "success",
        data: {
          transactions,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to get transactions",
      });
    }
  }

  /**
   * Get transaction statistics
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   */
  static async getStatistics(req, res) {
    try {
      const startDate = req.query.startDate
        ? new Date(req.query.startDate)
        : new Date(new Date().setDate(new Date().getDate() - 30));

      const endDate = req.query.endDate
        ? new Date(req.query.endDate)
        : new Date();

      const stats = await Transaction.aggregate([
        {
          $match: {
            businessId: req.business._id,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
            successfulTransactions: {
              $sum: {
                $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
              },
            },
            failedTransactions: {
              $sum: {
                $cond: [{ $eq: ["$status", "failed"] }, 1, 0],
              },
            },
          },
        },
      ]);

      res.json({
        status: "success",
        data: stats[0] || {
          totalTransactions: 0,
          totalAmount: 0,
          successfulTransactions: 0,
          failedTransactions: 0,
        },
      });
    } catch (error) {
      console.error("Get statistics error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to get transaction statistics",
      });
    }
  }
}

module.exports = BusinessController;
