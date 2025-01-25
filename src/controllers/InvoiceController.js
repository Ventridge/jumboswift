import InvoiceService from "../services/InvoiceService.js";

export default class InvoiceController {
  static async createInvoice(req, res, next) {
    try {
      const { businessId } = req.user;
      const invoiceData = {
        ...req.body,
        businessId,
      };

      const invoice = await InvoiceService.createInvoice(invoiceData);

      return res.status(201).json({
        status: "success",
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  static async sendInvoice(req, res, next) {
    try {
      const { invoiceId } = req.params;
      const invoice = await InvoiceService.sendInvoice(invoiceId);

      return res.status(200).json({
        status: "success",
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getInvoice(req, res, next) {
    try {
      const { invoiceId } = req.params;
      const invoice = await InvoiceService.getInvoiceDetails(invoiceId);

      // Ensure business has access to this invoice
      if (invoice.businessId !== req.user.businessId) {
        return res.status(403).json({
          status: "error",
          message: "Access denied",
        });
      }

      return res.status(200).json({
        status: "success",
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listInvoices(req, res, next) {
    try {
      const { businessId } = req.user;
      const { status, dateRange, customerId, dateField } = req.query;

      const filters = {
        status,
        dateRange: dateRange ? JSON.parse(dateRange) : undefined,
        customerId,
        dateField,
      };

      const invoices = await InvoiceService.listInvoices(businessId, filters);

      return res.status(200).json({
        status: "success",
        data: invoices,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateInvoice(req, res, next) {
    try {
      const { invoiceId } = req.params;

      const invoice = await InvoiceService.updateInvoice(invoiceId, req.body);

      return res.status(200).json({
        status: "success",
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteInvoice(req, res, next) {
    try {
      const { invoiceId } = req.params;
      const { reason } = req.body;

      await InvoiceService.cancelInvoice(invoiceId, reason);

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async processPayment(req, res, next) {
    try {
      const { invoiceId } = req.params;
      const paymentData = req.body;

      const { invoice, payment } = await InvoiceService.handlePayment(invoiceId, paymentData);

      return res.status(200).json({
        status: "success",
        data: {
          invoice,
          payment,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async sendReminder(req, res, next) {
    try {
      const { invoiceId } = req.params;
      const invoice = await InvoiceService.sendReminder(invoiceId);

      return res.status(200).json({
        status: "success",
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  static async downloadInvoice(req, res, next) {
    try {
      const { invoiceId } = req.params;
      const invoice = await InvoiceService.getInvoiceDetails(invoiceId);

      // Ensure business has access to this invoice
      if (invoice.businessId !== req.user.businessId) {
        return res.status(403).json({
          status: "error",
          message: "Access denied",
        });
      }

      // Generate PDF
      const pdf = await generatePDF(invoice);

      // Set response headers for PDF download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);

      return res.send(pdf);
    } catch (error) {
      next(error);
    }
  }
}

// src/utils/pdfGenerator.js
import PDFDocument from "pdfkit";

export const generatePDF = async (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];

      // Collect PDF data chunks
      doc.on("data", (buffer) => buffers.push(buffer));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // Add business header
      doc.fontSize(20).text(invoice.businessName, { align: "right" });
      doc.fontSize(10).text(invoice.businessAddress, { align: "right" });
      doc.moveDown();

      // Add invoice details
      doc.fontSize(16).text("INVOICE", { align: "center" });
      doc.fontSize(10).text(`Invoice Number: ${invoice.invoiceNumber}`);
      doc.text(`Date: ${invoice.createdAt.toLocaleDateString()}`);
      doc.text(`Due Date: ${invoice.dueDate.toLocaleDateString()}`);
      doc.moveDown();

      // Add customer details
      doc.text("Bill To:");
      doc.text(invoice.customerName);
      doc.moveDown();

      // Add items table
      const tableTop = doc.y;
      const itemsPerPage = 30;
      let itemCount = 0;

      // Table headers
      const addTableHeaders = () => {
        doc
          .font("Helvetica-Bold")
          .text("Description", 50, doc.y, { width: 200 })
          .text("Quantity", 250, doc.y, { width: 100 })
          .text("Unit Price", 350, doc.y, { width: 100 })
          .text("Amount", 450, doc.y, { width: 100 })
          .moveDown();
      };

      addTableHeaders();

      // Add items
      invoice.items.forEach((item) => {
        if (itemCount === itemsPerPage) {
          doc.addPage();
          addTableHeaders();
          itemCount = 0;
        }

        doc
          .font("Helvetica")
          .text(item.description, 50, doc.y, { width: 200 })
          .text(item.quantity.toString(), 250, doc.y, { width: 100 })
          .text(item.unitPrice.toFixed(2), 350, doc.y, { width: 100 })
          .text(item.amount.toFixed(2), 450, doc.y, { width: 100 })
          .moveDown();

        itemCount++;
      });

      // Add totals
      doc.moveDown();
      doc
        .font("Helvetica-Bold")
        .text(`Subtotal: ${invoice.currency} ${invoice.subtotal.toFixed(2)}`, { align: "right" })
        .text(`Tax: ${invoice.currency} ${invoice.taxTotal.toFixed(2)}`, { align: "right" })
        .text(`Total: ${invoice.currency} ${invoice.total.toFixed(2)}`, { align: "right" });

      // Add payment terms and notes
      if (invoice.paymentTerms) {
        doc.moveDown().font("Helvetica").text("Payment Terms:", { underline: true }).text(invoice.paymentTerms);
      }

      if (invoice.notes) {
        doc.moveDown().font("Helvetica").text("Notes:", { underline: true }).text(invoice.notes);
      }

      // Add footer
      doc.fontSize(8).text("Thank you for your business!", 50, doc.page.height - 50, {
        align: "center",
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
