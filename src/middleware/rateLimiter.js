// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const { RateLimiterRedis } = require('rate-limiter-flexible');

const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    enableOfflineQueue: false
});

const createRateLimiter = (options = {}) => {
    const rateLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'middleware',
        points: options.max || 100, // Number of points
        duration: options.windowMs || 60, // Per second(s)
        blockDuration: 60 * 15 // Block for 15 minutes if consumed more than points
    });

    return async (req, res, next) => {
        try {
            const key = options.keyGenerator ? 
                options.keyGenerator(req) : 
                req.ip;

            await rateLimiter.consume(key);
            next();
        } catch (error) {
            res.status(429).json({
                status: 'error',
                message: options.message || 'Too many requests, please try again later'
            });
        }
    };
};

// Export both the rate limiter creator and specific limiters
module.exports = {
    createRateLimiter,
    loginLimiter: createRateLimiter({
        keyPrefix: 'login_limiter',
        points: 5, // 5 attempts
        duration: 60 * 15, // Per 15 minutes
        blockDuration: 60 * 60, // Block for 1 hour
        message: 'Too many login attempts, please try again later'
    }),
    
    registrationLimiter: createRateLimiter({
        keyPrefix: 'registration_limiter',
        points: 3, // 3 attempts
        duration: 60 * 60, // Per hour
        blockDuration: 60 * 60 * 24, // Block for 24 hours
        message: 'Too many registration attempts, please try again later'
    }),

    generalLimiter: createRateLimiter({
        keyPrefix: 'general_limiter',
        points: 100, // 100 requests
        duration: 60 * 15, // Per 15 minutes
        message: 'Too many requests, please try again later'
    })
};