const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { loginLimiter, registrationLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting to specific routes
router.post('/register', registrationLimiter, AuthController.register);
router.post('/login', loginLimiter, AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

module.exports = router;