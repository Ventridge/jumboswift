// services/report-service/src/routes/report.routes.js
const express = require("express");
const router = express.Router();
const ReportController = require("../controllers/report.controller.js");
const { auth } = require("../middleware/auth");

// Generate Business Report
router.post(
  "/generate",
  auth,

  async (req, res) => {
    /* [
    body('type').isIn(['daily', 'weekly', 'monthly']),
    body('format').isIn(['pdf', 'csv']),
    body('startDate').isISO8601(),
    body('endDate').optional().isISO8601()
  ],*/

    try {
      const controller = new ReportController();
      const report = await controller.generateReport(
        req.business._id,
        req.body
      );
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Schedule Report
router.post(
  "/schedule",
  auth,

  async (req, res) => {
    try {
      /* [
    body('type').isIn(['daily', 'weekly', 'monthly']),
    body('format').isIn(['pdf', 'csv']),
    body('schedule').isObject(),
    body('recipients').isArray()
  ],*/
      const controller = new ReportController();
      const schedule = await controller.scheduleReport(
        req.business._id,
        req.body
      );
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
