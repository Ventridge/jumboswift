// services/transaction-service/src/routes/transaction.routes.js
const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const TransactionController = require('../controllers/transaction.controller');
const auth = require('../middleware/auth');

// Get Transaction Details
router.get(
  '/:transactionId',
  auth,
  async (req, res) => {
    try {
      const controller = new TransactionController();
      const transaction = await controller.getTransactionDetails(
        req.business.id,
        req.params.transactionId
      );
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get Transaction Statistics
router.get(
  '/statistics',
  auth,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('groupBy').optional().isIn(['day', 'week', 'month'])
  ],
  async (req, res) => {
    try {
      const controller = new TransactionController();
      const stats = await controller.getTransactionStats(
        req.business.id,
        req.query
      );
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Export Transactions
router.post(
  '/export',
  auth,
  [
    body('format').isIn(['csv', 'xlsx']),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('filters').optional().isObject()
  ],
  async (req, res) => {
    try {
      const controller = new TransactionController();
      const exportUrl = await controller.exportTransactions(
        req.business.id,
        req.body
      );
      res.json({ url: exportUrl });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;