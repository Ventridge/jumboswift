// src/utils/validators.js
import Joi from "joi";

// Common validation schemas
const commonSchemas = {
  businessId: Joi.string().required().trim(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).uppercase().default("KES"),
  phoneNumber: Joi.string()
    .pattern(/^254[0-9]{9}$/)
    .messages({
      "string.pattern.base": "Phone number must be in format 254XXXXXXXXX",
    }),
  email: Joi.string().email(),
};

// Payment validation schema
export const paymentSchema = Joi.object({
  businessId: commonSchemas.businessId,
  customerId: Joi.string().required(),
  amount: commonSchemas.amount,
  currency: commonSchemas.currency,
  paymentMethod: Joi.string().valid("card", "mpesa", "cash").required(),
  type: Joi.string().valid("one-time", "recurring").required(),
  phoneNumber: Joi.when("paymentMethod", {
    is: "mpesa",
    then: commonSchemas.phoneNumber.required(),
    otherwise: commonSchemas.phoneNumber.optional(),
  }),
  paymentMethodId: Joi.when("paymentMethod", {
    is: "card",
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
  metadata: Joi.object().default({}),
});

// Business setup validation schema
export const businessSetupSchema = Joi.object({
  businessId: commonSchemas.businessId,
  name: Joi.string().required().min(2).max(100),
  paymentMethods: Joi.array()
    .items(
      Joi.object({
        type: Joi.string().valid("card", "mpesa", "cash").required(),
        isActive: Joi.boolean().default(true),
        processingFees: Joi.object({
          percentage: Joi.number().min(0).max(100).default(0),
          fixed: Joi.number().min(0).default(0),
        }).default({}),
      })
    )
    .min(1),
});

// Payment credentials validation schemas
const stripeCredentialsSchema = Joi.object({
  publishableKey: Joi.string().required(),
  secretKey: Joi.string().required(),
});

const mpesaCredentialsSchema = Joi.object({
  shortCode: Joi.string().required(),
  consumerKey: Joi.string().required(),
  consumerSecret: Joi.string().required(),
  passKey: Joi.string().required(),
  type: Joi.string().valid("paybill", "till").required(),
  callbackUrl: Joi.string().uri().required(),
});

export const credentialsSchema = Joi.object({
  businessId: commonSchemas.businessId,
  paymentMethod: Joi.string().valid("stripe", "mpesa", "cash").required(),
  credentials: Joi.alternatives().conditional("paymentMethod", {
    switch: [
      { is: "stripe", then: stripeCredentialsSchema },
      { is: "mpesa", then: mpesaCredentialsSchema },
    ],
  }),
});

// STK Push validation schema
export const stkPushSchema = Joi.object({
  businessId: commonSchemas.businessId,
  customerId: Joi.string().required(),
  phoneNumber: commonSchemas.phoneNumber.required(),
  amount: commonSchemas.amount,
  accountReference: Joi.string().max(20).default("Payment"),
  transactionDesc: Joi.string().max(20).default("Payment"),
});

// Refund validation schema
export const refundSchema = Joi.object({
  businessId: commonSchemas.businessId,
  paymentId: Joi.string().required(),
  amount: commonSchemas.amount,
  reason: Joi.string().max(200),
  refundMethod: Joi.string().valid("same_as_payment", "manual").default("same_as_payment"),
  metadata: Joi.object().default({}),
});

// Payment schedule validation schema
export const scheduleSchema = Joi.object({
  businessId: commonSchemas.businessId,
  customerId: Joi.string().required(),
  paymentMethod: Joi.string().valid("card", "mpesa").required(),
  amount: commonSchemas.amount,
  currency: commonSchemas.currency,
  frequency: Joi.string().valid("daily", "weekly", "monthly", "yearly").required(),
  startDate: Joi.date().min("now").required(),
  metadata: Joi.object().default({}),
});

// Invoice validation schema
export const invoiceSchema = Joi.object({
  businessId: commonSchemas.businessId,
  customerId: Joi.string().required(),
  items: Joi.array()
    .items(
      Joi.object({
        description: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        unitPrice: Joi.number().positive().required(),
        tax: Joi.number().min(0).max(100).default(0),
      })
    )
    .min(1)
    .required(),
  currency: commonSchemas.currency,
  dueDate: Joi.date().min("now").required(),
  paymentTerms: Joi.string().max(200),
  notes: Joi.string().max(500),
  metadata: Joi.object().default({}),
});

// Validation middleware
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const options = {
      abortEarly: false, // Include all errors
      allowUnknown: true, // Ignore unknown props
      stripUnknown: true, // Remove unknown props
    };

    const { error, value } = schema.validate(req.body, options);

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors,
      });
    }

    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
};

// Export validation middleware factory functions
export const validatePayment = () => validateRequest(paymentSchema);
export const validateBusinessSetup = () => validateRequest(businessSetupSchema);
export const validateCredentials = () => validateRequest(credentialsSchema);
export const validateSTKPush = () => validateRequest(stkPushSchema);
export const validateRefund = () => validateRequest(refundSchema);
export const validateSchedule = () => validateRequest(scheduleSchema);
export const validateInvoice = () => validateRequest(invoiceSchema);
