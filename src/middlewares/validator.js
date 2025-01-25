// src/middlewares/validator.js
import {
  paymentSchema,
  businessSetupSchema,
  credentialsSchema,
  stkPushSchema,
  refundSchema,
  scheduleSchema,
  invoiceSchema,
} from "../utils/validators.js";

export const validatePayload = (type) => {
  return async (req, res, next) => {
    try {
      let schema;

      // Select the appropriate schema based on the request type
      switch (type) {
        case "payment":
          schema = paymentSchema;
          break;
        case "businessSetup":
          schema = businessSetupSchema;
          break;
        case "credentials":
          req.body.businessId = req.params.businessId;
          schema = credentialsSchema;
          break;
        case "stkPush":
          schema = stkPushSchema;
          break;
        case "refund":
          schema = refundSchema;
          break;
        case "schedule":
          schema = scheduleSchema;
          break;
        case "invoice":
          schema = invoiceSchema;
          break;
        default:
          return res.status(500).json({
            status: "error",
            message: "Invalid validation type",
          });
      }

      const options = {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true,
      };

      const { error, value } = schema.validate(req.body, options);

      if (error) {
        // Format validation errors
        const errors = error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message.replace(/['"]/g, ""),
        }));

        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors,
        });
      }

      // Update request body with validated and sanitized data
      req.body = value;
      next();
    } catch (err) {
      next(err);
    }
  };
};

// Custom validators for specific fields
export const validatePhoneNumber = (phoneNumber) => {
  const phoneRegex = /^254[0-9]{9}$/;
  return phoneRegex.test(phoneNumber);
};

export const validateAmount = (amount) => {
  return typeof amount === "number" && amount > 0;
};

export const validateCurrency = (currency) => {
  const validCurrencies = ["KES", "USD", "EUR", "GBP"];
  return validCurrencies.includes(currency.toUpperCase());
};

// Business rule validators
export const validateBusinessRules = async (req, res, next) => {
  try {
    const { businessId, amount, currency } = req.body;

    // Get business configuration
    const business = await Business.findOne({ businessId });
    if (!business) {
      return res.status(404).json({
        status: "error",
        message: "Business not found",
      });
    }

    // Check business status
    if (business.status !== "active") {
      return res.status(403).json({
        status: "error",
        message: "Business is not active",
      });
    }

    // Validate amount limits
    const limits = business.transactionLimits?.[currency.toUpperCase()];
    if (limits) {
      if (amount < limits.min || amount > limits.max) {
        return res.status(400).json({
          status: "error",
          message: `Amount must be between ${limits.min} and ${limits.max} ${currency}`,
        });
      }
    }

    // Add validated business to request
    req.business = business;
    next();
  } catch (err) {
    next(err);
  }
};

// Utility function to clean sensitive data
export const sanitizeSensitiveData = (data) => {
  const sensitiveFields = ["password", "secretKey", "consumerSecret", "passkey"];
  const sanitized = { ...data };

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = "********";
    }
  });

  return sanitized;
};

// Export validators for use in tests
export const validators = {
  validatePhoneNumber,
  validateAmount,
  validateCurrency,
  sanitizeSensitiveData,
};
