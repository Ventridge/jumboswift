// src/validators/apiAppValidator.js
import Joi from "joi";
import { isValidIpAddress } from "../utils/helpers.js";

const apiAppSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.min": "App name must be at least 3 characters long",
    "string.max": "App name cannot exceed 100 characters",
    "any.required": "App name is required",
  }),

  description: Joi.string().max(500).optional().messages({
    "string.max": "Description cannot exceed 500 characters",
  }),

  ipWhitelist: Joi.array()
    .items(
      Joi.string().custom((value, helpers) => {
        if (!isValidIpAddress(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      })
    )
    .unique()
    .optional()
    .messages({
      "array.unique": "Duplicate IP addresses are not allowed",
      "any.invalid": "Invalid IP address format",
    }),

  accessScopes: Joi.array().items(Joi.string().valid("payments", "refunds", "invoices", "all")).unique().default(["all"]).messages({
    "array.unique": "Duplicate access scopes are not allowed",
    "any.only": "Invalid access scope",
  }),

  rateLimit: Joi.object({
    windowMs: Joi.number().min(1000).default(900000).messages({
      "number.min": "Rate limit window must be at least 1 second",
    }),
    maxRequests: Joi.number().min(1).default(100).messages({
      "number.min": "Maximum requests must be at least 1",
    }),
  }).default({
    windowMs: 900000,
    maxRequests: 100,
  }),

  environment: Joi.string().valid("test", "live").default("live").messages({
    "any.only": "Environment must be either test or live",
  }),

  metadata: Joi.object().pattern(Joi.string(), Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean(), Joi.object())).optional(),
});

// Validate API credentials format
const apiCredentialsSchema = Joi.object({
  apiKey: Joi.string()
    .pattern(/^pk_(live|test)_[a-f0-9]{48}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid API key format",
      "any.required": "API key is required",
    }),

  apiSecret: Joi.string()
    .pattern(/^sk_(live|test)_[a-f0-9]{64}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid API secret format",
      "any.required": "API secret is required",
    }),
});

// Validator middleware
export const validateApiApp = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: errorMessages,
      });
    }

    req.validatedData = value;
    next();
  };
};

// Export schemas and validators
export const validators = {
  create: validateApiApp(apiAppSchema),
  update: validateApiApp(apiAppSchema.fork(["name"], (schema) => schema.optional())),
  credentials: validateApiApp(apiCredentialsSchema),
};

export default validators;
