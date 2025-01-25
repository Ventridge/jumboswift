// src/routes/apiAppRoutes.js
import express from "express";
import ApiAppController from "../controllers/ApiAppController.js";
import { validators } from "../validators/apiAppValidator.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: API Apps
 *   description: API application management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ApiApp:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *         description:
 *           type: string
 *           maxLength: 500
 *         ipWhitelist:
 *           type: array
 *           items:
 *             type: string
 *             format: ipv4
 *         accessScopes:
 *           type: array
 *           items:
 *             type: string
 *             enum: [payments, refunds, invoices, all]
 *         rateLimit:
 *           type: object
 *           properties:
 *             windowMs:
 *               type: number
 *               minimum: 1000
 *             maxRequests:
 *               type: number
 *               minimum: 1
 */

/**
 * @swagger
 * /admin/apps/register:
 *   post:
 *     tags: [API Apps]
 *     summary: Register a new API application
 *     description: Create a new API application with specified access scopes and rate limits
 *     security:
 *       - ApiKeyAuth: []
 *       - ApiSecretAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiApp'
 *     responses:
 *       201:
 *         description: API application registered successfully
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
 *                     appId:
 *                       type: string
 *                     apiKey:
 *                       type: string
 *                     apiSecret:
 *                       type: string
 *                     accessScopes:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Invalid request data
 */
router.post("/register", validators.create, ApiAppController.registerApp);

/**
 * @swagger
 * /admin/apps/{appId}:
 *   get:
 *     tags: [API Apps]
 *     summary: Get API application details
 *     parameters:
 *       - in: path
 *         name: appId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - ApiKeyAuth: []
 *       - ApiSecretAuth: []
 *     responses:
 *       200:
 *         description: Application details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/ApiApp'
 *       404:
 *         description: Application not found
 *
 *   put:
 *     tags: [API Apps]
 *     summary: Update API application
 *     parameters:
 *       - in: path
 *         name: appId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - ApiKeyAuth: []
 *       - ApiSecretAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               ipWhitelist:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: ipv4
 *               accessScopes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [payments, refunds, invoices, all]
 *               rateLimit:
 *                 type: object
 *                 properties:
 *                   windowMs:
 *                     type: number
 *                     minimum: 1000
 *                   maxRequests:
 *                     type: number
 *                     minimum: 1
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *     responses:
 *       200:
 *         description: Application updated successfully
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
 *                     appId:
 *                       type: string
 *                     name:
 *                       type: string
 *                     status:
 *                       type: string
 *                     accessScopes:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Application not found
 */
router.get("/:appId", ApiAppController.getAppDetails);
router.put("/:appId", validators.update, ApiAppController.updateApp);

/**
 * @swagger
 * /admin/apps/{appId}/rotate-secret:
 *   post:
 *     tags: [API Apps]
 *     summary: Rotate API secret
 *     description: Generate a new API secret for the application
 *     parameters:
 *       - in: path
 *         name: appId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - ApiKeyAuth: []
 *       - ApiSecretAuth: []
 *     responses:
 *       200:
 *         description: API secret rotated successfully
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
 *                     appId:
 *                       type: string
 *                     apiKey:
 *                       type: string
 *                     apiSecret:
 *                       type: string
 *       404:
 *         description: Application not found
 */
router.post("/:appId/rotate-secret", ApiAppController.rotateApiSecret);

/**
 * @swagger
 * /admin/apps/{appId}/revoke:
 *   post:
 *     tags: [API Apps]
 *     summary: Revoke application access
 *     description: Suspend an API application's access
 *     parameters:
 *       - in: path
 *         name: appId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - ApiKeyAuth: []
 *       - ApiSecretAuth: []
 *     responses:
 *       200:
 *         description: Application access revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Application access revoked successfully
 *       404:
 *         description: Application not found
 */
router.post("/:appId/revoke", ApiAppController.revokeAccess);

export default router;
