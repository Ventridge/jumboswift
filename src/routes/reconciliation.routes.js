// services/payment-service/src/routes/reconciliation.routes.js
const express = require('express');
const router = express.Router();
const ReconciliationController = require('../controllers/reconciliation.controller');
const auth = require('../middleware/auth');

// Initiate Reconciliation
router.post(
  '/reconcile',
  auth,
  [
    body('date').isISO8601(),
    body('type').isIn(['automatic', 'manual'])
  ],
  async (req, res) => {
    try {
      const controller = new ReconciliationController();
      const reconciliation = await controller.initiateReconciliation(
        req.business.id,
        req.body
      );
      res.json(reconciliation);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get Reconciliation Status
router.get(
  '/status/:reconciliationId',
  auth,
  async (req, res) => {
    try {
      const controller = new ReconciliationController();
      const status = await controller.getReconciliationStatus(
        req.business.id,
        req.params.reconciliationId
      );
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;