import express from "express";
import BusinessController from "../controllers/BusinessController.js";
import { authenticateRequest } from "../middlewares/auth.js";
import { validatePayload } from "../middlewares/validator.js";

const router = express.Router();

router.use(authenticateRequest);

/**
 * @swagger
 * /business/setup:
 *   post:
 *     tags: [Business]
 *     summary: Setup new business
 *     description: Create and setup a new business entity with base configuration
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
 *               - name
 *             properties:
 *               businessId:
 *                 type: string
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, suspended, pending]
 *                 default: pending
 *               apps:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - appId
 *                   properties:
 *                     appId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [active, inactive]
 *                       default: active
 *                     connectedAt:
 *                       type: string
 *                       format: date-time
 *     responses:
 *       201:
 *         description: Business created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     businessId:
 *                       type: string
 *                     name:
 *                       type: string
 *                     status:
 *                       type: string
 *                     apps:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Invalid request payload
 *       409:
 *         description: Business already exists
 */
router.post("/setup", validatePayload("businessSetup"), BusinessController.registerBusiness);

/**
 * @swagger
 * /business/{businessId}/credentials:
 *   put:
 *     tags: [Business]
 *     summary: Update payment credentials
 *     description: Update payment processor credentials for a business
 *     security:
 *       - ApiKeyAuth: []
 *       - ApiSecretAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethod
 *               - credentials
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [card, mpesa, cash]
 *               credentials:
 *                 type: object
 *                 oneOf:
 *                   - type: object
 *                     required:
 *                       - publishableKey
 *                       - secretKey
 *                     properties:
 *                       publishableKey:
 *                         type: string
 *                       secretKey:
 *                         type: string
 *                   - type: object
 *                     required:
 *                       - shortCode
 *                       - consumerKey
 *                       - consumerSecret
 *                       - passKey
 *                       - type
 *                       - callbackUrl
 *                     properties:
 *                       shortCode:
 *                         type: string
 *                       consumerKey:
 *                         type: string
 *                       consumerSecret:
 *                         type: string
 *                       passKey:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [paybill, till]
 *                       callbackUrl:
 *                         type: string
 *                         format: uri
 *     responses:
 *       200:
 *         description: Credentials updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentMethod:
 *                       type: string
 *                       enum: [card, mpesa, cash]
 *                     isActive:
 *                       type: boolean
 *       400:
 *         description: Invalid credentials format
 *       404:
 *         description: Business not found
 */
router.put("/:businessId/credentials", validatePayload("credentials"), BusinessController.updateCredentials);

/**
 * @swagger
 * /business/{businessId}/payment-methods:
 *   get:
 *     tags: [Business]
 *     summary: Get business payment methods
 *     description: Retrieve configured payment methods for a business
 *     security:
 *       - ApiKeyAuth: []
 *       - ApiSecretAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [card, mpesa, cash]
 *                       isActive:
 *                         type: boolean
 *                       processingFees:
 *                         type: object
 *                         properties:
 *                           percentage:
 *                             type: number
 *                           fixed:
 *                             type: number
 */
router.get("/:businessId/payment-methods", BusinessController.getPaymentMethods);

/**
 * @swagger
 * /business/{businessId}/payment-methods:
 *   post:
 *     tags: [Business]
 *     summary: Setup payment methods
 *     description: Configure payment methods for a business
 *     security:
 *       - ApiKeyAuth: []
 *       - ApiSecretAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethods
 *             properties:
 *               paymentMethods:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - type
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [card, mpesa, cash]
 *                     isActive:
 *                       type: boolean
 *                       default: true
 *                     processingFees:
 *                       type: object
 *                       properties:
 *                         percentage:
 *                           type: number
 *                           default: 0
 *                         fixed:
 *                           type: number
 *                           default: 0
 *     responses:
 *       200:
 *         description: Payment methods configured successfully
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
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [card, mpesa, cash]
 *                       isActive:
 *                         type: boolean
 *                       processingFees:
 *                         type: object
 *                         properties:
 *                           percentage:
 *                             type: number
 *                           fixed:
 *                             type: number
 *       400:
 *         description: Invalid payment method configuration
 *       404:
 *         description: Business not found
 */
router.post("/:businessId/payment-methods", BusinessController.setupPaymentMethods);

export default router;
