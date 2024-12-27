// services/payment-service/src/routes/payment.routes.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const PaymentController = require('../controllers/payment.controller');
const {auth} = require('../middleware/auth');


// Initiate M-Pesa Payment
router.post(
  '/mpesa/initiate',
  auth,
  [
    body('amount').isFloat({ min: 1 }).withMessage('Valid amount required'),
    body('phoneNumber').matches(/^254\d{9}$/).withMessage('Valid Kenyan phone number required'),
    body('accountReference').notEmpty().withMessage('Account reference required')
  ],
  async (req, res) => {

    // example request body
    // {
    //   "amount": 100,
    //   "phoneNumber": "254712345678
    //   "accountReference": "Payment for goods"
    // }
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const paymentController = new PaymentController();
      const result = await paymentController.initiateMpesaPayment({
        ...req.body,
        businessId: req.business.id
      });
      
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// M-Pesa Callback
router.post(
  '/mpesa/callback',
  async (req, res) => {
    try {
      const paymentController = new PaymentController();
      await paymentController.handleMpesaCallback(req.body);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);


module.exports = router;