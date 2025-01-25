// src/routes/paymentRoutes.js
import express from "express";
import PaymentController from "../controllers/PaymentController.js";
import { authenticateRequest } from "../middlewares/auth.js";
import { validatePayload } from "../middlewares/validator.js";

const router = express.Router();

/**
 * @swagger
 * /payments/webhooks/mpesa:
 *   post:
 *     tags: [Payments]
 *     summary: Handle MPesa callback webhook
 *     description: Endpoint for receiving MPesa payment notifications
 *     security: []  # No auth required for webhooks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Body:
 *                 type: object
 *                 properties:
 *                   stkCallback:
 *                     type: object
 *                     properties:
 *                       MerchantRequestID:
 *                         type: string
 *                       CheckoutRequestID:
 *                         type: string
 *                       ResultCode:
 *                         type: string
 *                       ResultDesc:
 *                         type: string
 *     responses:
 *       200:
 *         description: Webhook processed successfully
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
 *                     received:
 *                       type: boolean
 */
router.post("/webhooks/mpesa", PaymentController.handleMpesaCallback);

/**
 * @swagger
 * /payments/webhooks/stripe:
 *   post:
 *     tags: [Payments]
 *     summary: Handle Stripe webhook events
 *     description: Endpoint for receiving Stripe payment notifications
 *     security: []  # No auth required for webhooks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post("/webhooks/stripe", PaymentController.handleStripeWebhook);

// Protected routes
router.use(authenticateRequest);

/**
 * @swagger
 * /payments/process:
 *   post:
 *     tags: [Payments]
 *     summary: Process a new payment
 *     description: Process a payment using the specified payment method (card or mpesa)
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
 *               - customerId
 *               - amount
 *               - paymentMethod
 *               - type
 *             properties:
 *               businessId:
 *                 type: string
 *                 description: ID of the business receiving payment
 *               customerId:
 *                 type: string
 *                 description: ID of the customer making payment
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *                 minimum: 1
 *               currency:
 *                 type: string
 *                 enum: [KES, USD, EUR, GBP]
 *                 default: KES
 *               paymentMethod:
 *                 type: string
 *                 enum: [card, mpesa]
 *               type:
 *                 type: string
 *                 enum: [one-time, recurring]
 *               phoneNumber:
 *                 type: string
 *                 description: Required for MPesa payments
 *               paymentMethodId:
 *                 type: string
 *                 description: Required for card payments
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Payment processed successfully
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
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                     amount:
 *                       type: number
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Payment processing failed
 */
router.post("/process", validatePayload("payment"), PaymentController.processPayment);

/**
 * @swagger
 * /payments/stk-push:
 *   post:
 *     tags: [Payments]
 *     summary: Initiate MPesa STK Push
 *     description: Initiate an MPesa STK push request to a customer's phone
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
 *               - phoneNumber
 *               - amount
 *             properties:
 *               businessId:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *                 pattern: ^254[0-9]{9}$
 *               amount:
 *                 type: number
 *                 minimum: 1
 *               accountReference:
 *                 type: string
 *                 maxLength: 20
 *               transactionDesc:
 *                 type: string
 *                 maxLength: 20
 *     responses:
 *       200:
 *         description: STK push initiated successfully
 *       400:
 *         description: Invalid request data
 */
router.post("/stk-push", validatePayload("stkPush"), PaymentController.initiateSTKPush);

/**
 * @swagger
 * /payments/{paymentId}/status:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment status
 *     description: Retrieve the current status of a payment
 *     security:
 *       - ApiKeyAuth: []
 *       - ApiSecretAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the payment to check
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
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
 *                     status:
 *                       type: string
 *                       enum: [pending, processing, completed, failed]
 *                     processorResponse:
 *                       type: object
 *       404:
 *         description: Payment not found
 */
router.get("/:paymentId/status", PaymentController.getPaymentStatus);

export default router;
