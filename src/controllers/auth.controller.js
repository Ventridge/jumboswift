const Business = require("../models/Business.js");
const TokenService = require("../services/token.service.js");
const { validateBusinessData } = require("../utils/validation.js");
const logger = require("../utils/logger.js");

class AuthController {
  static async register(req, res) {
    try {
      const { businessName, email, password, phoneNumber, businessType } =
        req.body;

      // Validate input
      const validationErrors = validateBusinessData({
        businessName,
        email,
        password,
        phoneNumber,
        businessType,
      });

      if (validationErrors) {
        return res.status(400).json({
          status: "error",
          message: "Validation error",
          errors: validationErrors,
        });
      }

      // Check existing business
      const existingBusiness = await Business.findOne({ email });
      if (existingBusiness) {
        return res.status(409).json({
          status: "error",
          message: "Business already exists with this email",
        });
      }

      // Create new business
      const business = new Business({
        businessName,
        email,
        password,
        phoneNumber,
        businessType,
      });

      await business.save();

      // Generate tokens
      const tokenService = new TokenService();
      const { accessToken, refreshToken } =
        await tokenService.generateAuthTokens(business);

      res.status(201).json({
        status: "success",
        message: "Business registered successfully",
        data: {
          business: {
            id: business._id,
            businessName: business.businessName,
            email: business.email,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    } catch (error) {
      logger.error("Registration error:", error);
      res.status(500).json({
        status: "error",
        message: "Registration failed",
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find business
      const business = await Business.findOne({ email });
      if (!business) {
        return res.status(401).json({
          status: "error",
          message: "Invalid credentials",
        });
      }

      // Verify password
      const isValid = await business.comparePassword(password);
      if (!isValid) {
        return res.status(401).json({
          status: "error",
          message: "Invalid credentials",
        });
      }

      // Generate tokens
      const tokenService = new TokenService();
      const { accessToken, refreshToken } =
        await tokenService.generateAuthTokens(business);

      res.json({
        status: "success",
        data: {
          business: {
            id: business._id,
            businessName: business.businessName,
            email: business.email,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    } catch (error) {
      logger.error("Login error:", error);
      res.status(500).json({
        status: "error",
        message: "Login failed",
      });
    }
  }

  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const tokenService = new TokenService();

      const newTokens = await tokenService.refreshAuthTokens(refreshToken);

      res.json({
        status: "success",
        data: {
          tokens: newTokens,
        },
      });
    } catch (error) {
      logger.error("Token refresh error:", error);
      res.status(401).json({
        status: "error",
        message: "Invalid refresh token",
      });
    }
  }

  static async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      const tokenService = new TokenService();

      await tokenService.revokeToken(refreshToken);

      res.json({
        status: "success",
        message: "Logged out successfully",
      });
    } catch (error) {
      logger.error("Logout error:", error);
      res.status(500).json({
        status: "error",
        message: "Logout failed",
      });
    }
  }
}

module.exports = AuthController;
