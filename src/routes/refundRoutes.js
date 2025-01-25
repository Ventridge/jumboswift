// src/routes/refundRoutes.js
import express from "express";
import RefundController from "../controllers/RefundController.js";
import { validatePayload } from "../middlewares/validator.js";
import { authenticateRequest } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticateRequest);

/**
 * @swagger
 * /refunds/process:
 *   post:
 *     tags: [Refunds]
 *     summary: Process a refund
 *     description: Initiate a refund for a previous payment
 *     security:
 *       - ApiKeyAuth: []
 *       - ApiSecretAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessId
 *               - paymentId
 *               - amount
 *             properties:
 *               businessId:
 *                 type: string
 *                 description: ID of the business processing the refund
 *               paymentId:
 *                 type: string
 *                 description: ID of the original payment
 *               amount:
 *                 type: number
 *                 description: Amount to refund
 *                 minimum: 1
 *               reason:
 *                 type: string
 *                 maxLength: 200
 *               refundMethod:
 *                 type: string
 *                 enum: [same_as_payment, manual]
 *                 default: same_as_payment
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Refund'
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Original payment not found
 */
router.post("/process", validatePayload("refund"), RefundController.processRefund);

/**
 * @swagger
 * /refunds/{refundId}:
 *   get:
 *     tags: [Refunds]
 *     summary: Get refund details
 *     description: Retrieve details of a specific refund
 *     security:
 *       - ApiKeyAuth: []
 *       - ApiSecretAuth: []
 *     parameters:
 *       - in: path
 *         name: refundId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the refund to retrieve
 *     responses:
 *       200:
 *         description: Refund details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Refund'
 *       404:
 *         description: Refund not found
 */
router.get("/:refundId", RefundController.getRefundDetails);

/**
 * @swagger
 * /refunds:
 *   get:
 *     tags: [Refunds]
 *     summary: List refunds
 *     description: Retrieve a list of refunds with optional filters
 *     security:
 *       - ApiKeyAuth: []
 *       - ApiSecretAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed]
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *         description: Format YYYY-MM-DD,YYYY-MM-DD
 *     responses:
 *       200:
 *         description: List of refunds retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Refund'
 */
router.get("/", RefundController.listRefunds);

export default router;
