import express from "express";
import paymentRoutes from "./paymentRoutes.js";
import businessRoutes from "./businessRoutes.js";
import refundRoutes from "./refundRoutes.js";
import invoiceRoutes from "./invoiceRoutes.js";
import apiAppRoutes from "./apiAppRoutes.js";

const router = express.Router();

router.use(`/admin/apps`, apiAppRoutes);

router.use("/payments", paymentRoutes);
router.use("/business", businessRoutes);
router.use("/refunds", refundRoutes);
router.use("/invoices", invoiceRoutes);

export default router;
