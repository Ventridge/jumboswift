import crypto from "crypto";
import ApiApp from "../models/ApiApp.js";
import Business from "../models/Business.js";
import Invoice from "../models/Invoice.js";

/**
 * Generate a unique invoice number for a business
 * Format: BSN-YYYY-XXXXX (e.g., BSN-2024-00001)
 */
export const generateInvoiceNumber = async (businessId) => {
  try {
    // Get the current year
    const currentYear = new Date().getFullYear();

    // Find the latest invoice number for this business and year
    const latestInvoice = await Invoice.findOne(
      {
        businessId,
        invoiceNumber: new RegExp(`BSN-${currentYear}-`),
      },
      {},
      { sort: { invoiceNumber: -1 } }
    );

    let sequenceNumber = 1;
    if (latestInvoice) {
      const lastSequence = parseInt(latestInvoice.invoiceNumber.split("-")[2]);
      sequenceNumber = lastSequence + 1;
    }

    // Pad sequence number with zeros
    const paddedSequence = sequenceNumber.toString().padStart(5, "0");
    return `BSN-${currentYear}-${paddedSequence}`;
  } catch (error) {
    throw new Error("Failed to generate invoice number");
  }
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount, currency = "KES") => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

/**
 * Calculate payment processing fee
 */
export const calculateProcessingFee = async (amount, paymentMethod, businessId) => {
  // Fetch business's processing fee configuration
  const business = await Business.findById(businessId);
  if (!business) return 0;

  const feeConfig = business.paymentMethods.find((method) => method.type === paymentMethod)?.processingFees;

  if (!feeConfig) return 0;

  // Calculate fee: percentage + fixed amount
  const percentageFee = amount * (feeConfig.percentage / 100);
  const totalFee = percentageFee + (feeConfig.fixed || 0);

  return Math.round(totalFee * 100) / 100; // Round to 2 decimal places
};

/**
 * Generate a unique transaction reference
 */
export const generateTransactionRef = (prefix = "TRX") => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Validate phone number format (Kenyan format)
 */
export const validatePhoneNumber = (phoneNumber) => {
  const phoneRegex = /^254[0-9]{9}$/;
  return phoneRegex.test(phoneNumber);
};

/**
 * Format phone number to required format
 */
export const formatPhoneNumber = (phoneNumber) => {
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "");

  // If number starts with 0, replace with 254
  if (cleaned.startsWith("0")) {
    return `254${cleaned.substring(1)}`;
  }

  // If number starts with +, remove it
  if (cleaned.startsWith("+")) {
    return cleaned.substring(1);
  }

  return cleaned;
};

/**
 * Check if date is a business day
 */
export const isBusinessDay = (date) => {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 is Sunday, 6 is Saturday
};

/**
 * Add business days to a date
 */
export const addBusinessDays = (date, days) => {
  let currentDate = new Date(date);
  let remainingDays = days;

  while (remainingDays > 0) {
    currentDate.setDate(currentDate.getDate() + 1);
    if (isBusinessDay(currentDate)) {
      remainingDays--;
    }
  }

  return currentDate;
};

/**
 * Parse date range string
 */
export const parseDateRange = (dateRange) => {
  if (!dateRange) return null;

  try {
    const [start, end] = dateRange.split(",");
    return {
      start: new Date(start),
      end: new Date(end),
    };
  } catch (error) {
    throw new Error("Invalid date range format");
  }
};

/**
 * Calculate pagination values
 */
export const calculatePagination = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return {
    skip,
    limit: parseInt(limit),
  };
};

/**
 * Format error response
 */
export const formatErrorResponse = (error) => {
  return {
    status: "error",
    message: error.message || "Internal server error",
    code: error.code || 500,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  };
};

/**
 * Deep clone object (without functions)
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Extract error message from various error types
 */
export const extractErrorMessage = (error) => {
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  if (error.msg) return error.msg;
  return "An unknown error occurred";
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 * Sanitize object (remove null and undefined values)
 */
export const sanitizeObject = (obj) => {
  const sanitized = { ...obj };
  Object.keys(sanitized).forEach((key) => {
    if (sanitized[key] === null || sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });
  return sanitized;
};

/**
 * Get next business date from a given date
 */
export const getNextBusinessDay = (date = new Date()) => {
  let nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  while (!isBusinessDay(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }

  return nextDay;
};

/**
 * Check if string is valid JSON
 */
export const isValidJSON = (str) => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Generate a unique App ID
 * Format: APP-XXXXX-XXXXX
 */
export const generateAppId = async () => {
  const prefix = "APP";
  const randomPart = () => crypto.randomBytes(3).toString("hex").toUpperCase();

  let appId;
  let isUnique = false;

  while (!isUnique) {
    appId = `${prefix}-${randomPart()}-${randomPart()}`;
    // Check if appId already exists
    const existingApp = await ApiApp.findOne({ appId });
    if (!existingApp) {
      isUnique = true;
    }
  }

  return appId;
};

/**
 * Generate API credentials pair
 * apiKey format: pk_live_XXXXX or pk_test_XXXXX
 * apiSecret format: sk_live_XXXXX or sk_test_XXXXX
 */
export const generateApiCredentials = (environment = "live") => {
  const keyPrefix = "pk";
  const secretPrefix = "sk";
  const randomKey = crypto.randomBytes(24).toString("hex");
  const randomSecret = crypto.randomBytes(32).toString("hex");

  return {
    apiKey: `${keyPrefix}_${environment}_${randomKey}`,
    apiSecret: `${secretPrefix}_${environment}_${randomSecret}`,
  };
};

/**
 * Hash API Secret for storage
 */
export const hashApiSecret = (apiSecret) => {
  return crypto.createHash("sha256").update(apiSecret).digest("hex");
};

/**
 * Verify API credentials
 */
export const verifyApiCredentials = (providedSecret, storedHash) => {
  return crypto.timingSafeEqual(Buffer.from(providedSecret, "hex"), Buffer.from(storedHash, "hex"));
};

/**
 * Generate access token for temporary operations
 */
export const generateAccessToken = (appId, expiresIn = "1h") => {
  const payload = {
    appId,
    type: "access_token",
    exp: Math.floor(Date.now() / 1000) + (typeof expiresIn === "string" ? parseTimeString(expiresIn) : expiresIn),
  };

  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
};

/**
 * Parse time string to seconds
 * Example: '1h' => 3600, '30m' => 1800
 */
export const parseTimeString = (timeString) => {
  const units = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  const match = timeString.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error("Invalid time string format");

  const [, value, unit] = match;
  return parseInt(value) * units[unit];
};

/**
 * Validate IP address format
 */
export const isValidIpAddress = (ip) => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([\da-f]{1,4}:){7}[\da-f]{1,4}$/i;

  if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
    return false;
  }

  if (ipv4Regex.test(ip)) {
    const parts = ip.split(".");
    return parts.every((part) => {
      const num = parseInt(part);
      return num >= 0 && num <= 255;
    });
  }

  return true;
};

/**
 * Format API credentials for display
 * Masks sensitive parts of the credentials
 */
export const formatApiCredentials = (credentials) => {
  const maskString = (str) => {
    if (!str) return "";
    const visibleLength = 4;
    const firstPart = str.slice(0, visibleLength);
    const lastPart = str.slice(-visibleLength);
    return `${firstPart}${"*".repeat(8)}${lastPart}`;
  };

  return {
    apiKey: maskString(credentials.apiKey),
    apiSecret: maskString(credentials.apiSecret),
  };
};

/**
 * Generate webhook signing secret
 */
export const generateWebhookSecret = () => {
  return `whsk_${crypto.randomBytes(32).toString("hex")}`;
};

/**
 * Sign webhook payload
 */
export const signWebhookPayload = (payload, secret) => {
  return crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
};

/**
 * Verify webhook signature
 */
export const verifyWebhookSignature = (payload, signature, secret) => {
  const expectedSignature = signWebhookPayload(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
};

/**
 * Calculate rate limit remaining
 */
export const calculateRateLimitRemaining = (rateLimit, currentCount) => {
  return Math.max(0, rateLimit.maxRequests - currentCount);
};

/**
 * Check if IP is in CIDR range
 */
export const isIpInCidrRange = (ip, cidr) => {
  const [range, bits] = cidr.split("/");
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);

  const ipNum = ip.split(".").reduce((num, octet) => (num << 8) + parseInt(octet), 0);
  const rangeNum = range.split(".").reduce((num, octet) => (num << 8) + parseInt(octet), 0);

  return (ipNum & mask) === (rangeNum & mask);
};

/**
 * Validate API key format
 */
export const isValidApiKey = (apiKey) => {
  const keyRegex = /^pk_[a-f0-9]{48}$/;
  return keyRegex.test(apiKey);
};

/**
 * Validate API secret format
 */
export const isValidApiSecret = (apiSecret) => {
  const secretRegex = /^sk_[a-f0-9]{64}$/;
  return secretRegex.test(apiSecret);
};

export default {
  generateInvoiceNumber,
  formatCurrency,
  calculateProcessingFee,
  generateTransactionRef,
  validatePhoneNumber,
  formatPhoneNumber,
  isBusinessDay,
  addBusinessDays,
  parseDateRange,
  calculatePagination,
  formatErrorResponse,
  deepClone,
  extractErrorMessage,
  isEmpty,
  sanitizeObject,
  getNextBusinessDay,
  isValidJSON,
  generateAppId,
  generateApiCredentials,
  hashApiSecret,
  verifyApiCredentials,
  generateAccessToken,
  parseTimeString,
  isValidIpAddress,
  formatApiCredentials,
  generateWebhookSecret,
  signWebhookPayload,
  verifyWebhookSignature,
  calculateRateLimitRemaining,
  isIpInCidrRange,
  isValidApiKey,
  isValidApiSecret,
};
