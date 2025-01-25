// src/routes/invoiceRoutes.js
import express from "express";
import InvoiceController from "../controllers/InvoiceController.js";
import { validatePayload } from "../middlewares/validator.js";
import { authenticateRequest } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticateRequest);

/**
 * @swagger
 * /invoices/create:
 *   post:
 *     tags: [Invoices]
 *     summary: Create a new invoice
 *     description: Create a new invoice for a customer
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
 *               - items
 *               - dueDate
 *             properties:
 *               businessId:
 *                 type: string
 *               customerId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - description
 *                     - quantity
 *                     - unitPrice
 *                   properties:
 *                     description:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                     unitPrice:
 *                       type: number
 *                       minimum: 0
 *                     tax:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *               currency:
 *                 type: string
 *                 default: KES
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               paymentTerms:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *       400:
 *         description: Invalid request data
 */
router.post("/create", validatePayload("invoice"), InvoiceController.createInvoice);

/**
 * @swagger
 * /invoices/{invoiceId}/send:
 *   post:
 *     tags: [Invoices]
 *     summary: Send invoice to customer
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice sent successfully
 *       404:
 *         description: Invoice not found
 */
router.post("/:invoiceId/send", InvoiceController.sendInvoice);

/**
 * @swagger
 * /invoices/{invoiceId}:
 *   get:
 *     tags: [Invoices]
 *     summary: Get invoice details
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice details retrieved successfully
 *       404:
 *         description: Invoice not found
 */
router.get("/:invoiceId", InvoiceController.getInvoice);

/**
 * @swagger
 * /invoices:
 *   get:
 *     tags: [Invoices]
 *     summary: List invoices
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, sent, paid, overdue, cancelled]
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *         description: Format YYYY-MM-DD,YYYY-MM-DD
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of invoices retrieved successfully
 */
router.get("/", InvoiceController.listInvoices);

/**
 * @swagger
 * /invoices/{invoiceId}:
 *   put:
 *     tags: [Invoices]
 *     summary: Update invoice
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Invoice'
 *     responses:
 *       200:
 *         description: Invoice updated successfully
 *       404:
 *         description: Invoice not found
 */
router.put("/:invoiceId", validatePayload("invoice"), InvoiceController.updateInvoice);

/**
 * @swagger
 * /invoices/{invoiceId}:
 *   delete:
 *     tags: [Invoices]
 *     summary: Delete/cancel invoice
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Invoice deleted successfully
 *       404:
 *         description: Invoice not found
 */
router.delete("/:invoiceId", InvoiceController.deleteInvoice);

/**
 * @swagger
 * /invoices/{invoiceId}/payment:
 *   post:
 *     tags: [Invoices]
 *     summary: Process payment for invoice
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Payment'
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       404:
 *         description: Invoice not found
 */
router.post("/:invoiceId/payment", validatePayload("payment"), InvoiceController.processPayment);

// Send reminder
router.post(
  "/:invoiceId/reminder",
  InvoiceController.sendReminder
);

// Download invoice PDF
router.get("/:invoiceId/pdf", InvoiceController.downloadInvoice);

export default router;
