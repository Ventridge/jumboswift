// services/business-service/src/utils/validation.js
const validator = require('validator');

/**
 * Validates business registration data
 * @param {Object} data Business registration data
 * @returns {Object|null} Validation errors or null if valid
 */
const validateBusinessData = (data) => {
    const errors = {};

    // Business Name validation
    if (!data.businessName) {
        errors.businessName = 'Business name is required';
    } else if (data.businessName.length < 2 || data.businessName.length > 100) {
        errors.businessName = 'Business name must be between 2 and 100 characters';
    }

    // Email validation
    if (!data.email) {
        errors.email = 'Email is required';
    } else if (!validator.isEmail(data.email)) {
        errors.email = 'Invalid email format';
    }

    // Password validation
    if (!data.password) {
        errors.password = 'Password is required';
    } else if (data.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long';
    } else if (!/\d/.test(data.password) || !/[a-zA-Z]/.test(data.password)) {
        errors.password = 'Password must contain both letters and numbers';
    }

    // Phone number validation
    if (!data.phoneNumber) {
        errors.phoneNumber = 'Phone number is required';
    } else if (!/^254\d{9}$/.test(data.phoneNumber)) {
        errors.phoneNumber = 'Invalid phone number format. Must start with 254 followed by 9 digits';
    }

    // Business type validation
    if (!data.businessType) {
        errors.businessType = 'Business type is required';
    } else if (!['retail', 'service', 'wholesale', 'manufacturing', 'other'].includes(data.businessType)) {
        errors.businessType = 'Invalid business type';
    }

    return Object.keys(errors).length > 0 ? errors : null;
};

/**
 * Validates M-Pesa credentials
 * @param {Object} data M-Pesa credential data
 * @returns {Object|null} Validation errors or null if valid
 */
const validateMpesaCredentials = (data) => {
    const errors = {};

    // Paybill number validation
    if (!data.paybillNumber) {
        errors.paybillNumber = 'Paybill number is required';
    } else if (!/^\d{6}$/.test(data.paybillNumber)) {
        errors.paybillNumber = 'Invalid paybill number format. Must be 6 digits';
    }

    // Consumer key validation
    if (!data.consumerKey) {
        errors.consumerKey = 'Consumer key is required';
    } else if (data.consumerKey.length < 10) {
        errors.consumerKey = 'Invalid consumer key format';
    }

    // Consumer secret validation
    if (!data.consumerSecret) {
        errors.consumerSecret = 'Consumer secret is required';
    } else if (data.consumerSecret.length < 10) {
        errors.consumerSecret = 'Invalid consumer secret format';
    }

    // Passkey validation
    if (!data.passkey) {
        errors.passkey = 'Passkey is required';
    } else if (data.passkey.length < 8) {
        errors.passkey = 'Passkey must be at least 8 characters long';
    }

    // Callback URL validation
    if (data.callbackUrl && !validator.isURL(data.callbackUrl, { protocols: ['https'] })) {
        errors.callbackUrl = 'Callback URL must be a valid HTTPS URL';
    }

    return Object.keys(errors).length > 0 ? errors : null;
};

/**
 * Validates payment data
 * @param {Object} data Payment data
 * @returns {Object|null} Validation errors or null if valid
 */
const validatePaymentData = (data) => {
    const errors = {};

    // Amount validation
    if (!data.amount) {
        errors.amount = 'Amount is required';
    } else if (isNaN(data.amount) || data.amount <= 0) {
        errors.amount = 'Amount must be a positive number';
    }

    // Phone number validation
    if (!data.phoneNumber) {
        errors.phoneNumber = 'Phone number is required';
    } else if (!/^254\d{9}$/.test(data.phoneNumber)) {
        errors.phoneNumber = 'Invalid phone number format. Must start with 254 followed by 9 digits';
    }

    // Account reference validation
    if (!data.accountReference) {
        errors.accountReference = 'Account reference is required';
    } else if (data.accountReference.length > 20) {
        errors.accountReference = 'Account reference must not exceed 20 characters';
    }

    return Object.keys(errors).length > 0 ? errors : null;
};

/**
 * Validates webhook URL
 * @param {string} url Webhook URL
 * @returns {Object|null} Validation error or null if valid
 */
const validateWebhookUrl = (url) => {
    if (!url) {
        return { webhookUrl: 'Webhook URL is required' };
    }

    if (!validator.isURL(url, { protocols: ['https'] })) {
        return { webhookUrl: 'Invalid webhook URL. Must be a valid HTTPS URL' };
    }

    return null;
};

module.exports = {
    validateBusinessData,
    validateMpesaCredentials,
    validatePaymentData,
    validateWebhookUrl
};