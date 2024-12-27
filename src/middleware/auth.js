// services/business-service/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const Business = require('../models/Business');

/**
 * Authentication middleware for protecting routes
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
const auth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({
                status: 'error',
                message: 'No authentication token provided'
            });
        }

        // Check if token follows Bearer scheme
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token format'
            });
        }

        // Extract token
        const token = authHeader.replace('Bearer ', '');

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'payment-secret-gateway');

            console.log('Decoded token:', decoded);

            // Check if business exists
            const business = await Business.findOne({
                _id: decoded.businessId,
               // status: 'active'
            });

            if (!business) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Business not found or inactive'
                });
            }

            // Add business and token to request object
            req.business = business;
            req.token = token;

            next();
        } catch (error) {
            console.log('JWT error:', error.message);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    status: 'error',
                    message: 'Token has expired'
                });
            }

            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid token'
                });
            }

            throw error;
        }
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Authentication failed'
        });
    }
};

/**
 * Role-based authorization middleware
 * @param {String[]} allowedRoles Array of allowed roles
 */
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.business) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Authentication required'
                });
            }

            if (!allowedRoles.includes(req.business.role)) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Access denied'
                });
            }

            next();
        } catch (error) {
            console.error('Authorization error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Authorization failed'
            });
        }
    };
};

/**
 * API key authentication middleware
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
const apiKeyAuth = async (req, res, next) => {
    try {
        const apiKey = req.header('X-API-Key');

        if (!apiKey) {
            return res.status(401).json({
                status: 'error',
                message: 'API key is required'
            });
        }

        // Find business by API key
        const business = await Business.findOne({
            apiKey,
            status: 'active'
        });

        if (!business) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid API key'
            });
        }

        req.business = business;
        next();
    } catch (error) {
        console.error('API key authentication error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Authentication failed'
        });
    }
};

/**
 * Webhook authentication middleware
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
const webhookAuth = async (req, res, next) => {
    try {
        const webhookSignature = req.header('X-Webhook-Signature');
        const webhookTimestamp = req.header('X-Webhook-Timestamp');

        if (!webhookSignature || !webhookTimestamp) {
            return res.status(401).json({
                status: 'error',
                message: 'Missing webhook authentication headers'
            });
        }

        // Verify webhook signature
        const isValid = verifyWebhookSignature(
            webhookSignature,
            webhookTimestamp,
            JSON.stringify(req.body),
            process.env.WEBHOOK_SECRET
        );

        if (!isValid) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid webhook signature'
            });
        }

        next();
    } catch (error) {
        console.error('Webhook authentication error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Webhook authentication failed'
        });
    }
};

/**
 * Verify webhook signature
 * @param {string} signature Webhook signature
 * @param {string} timestamp Webhook timestamp
 * @param {string} body Request body
 * @param {string} secret Webhook secret
 * @returns {boolean}
 */
const verifyWebhookSignature = (signature, timestamp, body, secret) => {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    const data = `${timestamp}.${body}`;
    const expectedSignature = hmac.update(data).digest('hex');
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
};

module.exports = {
    auth,
    authorize,
    apiKeyAuth,
    webhookAuth
};