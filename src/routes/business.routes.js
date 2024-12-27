const express = require('express');
const router = express.Router();
const BusinessController = require('../controllers/business.controller');
const { auth } = require('../middleware/auth');

// Public routes
router.post('/register', BusinessController.register);

// Protected routes
router.get('/profile', auth, BusinessController.getProfile);
router.put('/profile', auth, BusinessController.updateProfile);
router.post('/mpesa-credentials', auth, BusinessController.addMpesaCredentials);
router.get('/transactions', auth, BusinessController.getTransactions);
router.get('/statistics', auth, BusinessController.getStatistics);

module.exports = router;