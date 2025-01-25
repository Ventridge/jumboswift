import InvoiceModel from '../models/Invoice.js';
import PaymentService from './PaymentService.js';
import NotificationService from './NotificationService.js';
import { generateInvoiceNumber } from '../utils/helpers.js';

class InvoiceService {
  async createInvoice(invoiceData) {
    const invoiceNumber = await generateInvoiceNumber(invoiceData.businessId);
    
    // Calculate totals
    const subtotal = this.calculateSubtotal(invoiceData.items);
    const taxTotal = this.calculateTaxTotal(invoiceData.items);
    const total = subtotal + taxTotal;

    const invoice = await InvoiceModel.create({
      ...invoiceData,
      invoiceNumber,
      subtotal,
      taxTotal,
      total,
      status: 'draft',
    });

    return invoice;
  }

  calculateSubtotal(items) {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }

  calculateTaxTotal(items) {
    return items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      return sum + (itemTotal * (item.tax / 100));
    }, 0);
  }

  async sendInvoice(invoiceId) {
    const invoice = await InvoiceModel.findById(invoiceId)
      .populate('businessId')
      .populate('customerId');

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Generate PDF
    const pdf = await this.generateInvoicePDF(invoice);

    // Send email notification
    await NotificationService.sendInvoiceEmail(invoice, pdf);

    // Update invoice status
    invoice.status = 'sent';
    invoice.sentAt = new Date();
    await invoice.save();

    return invoice;
  }

  async handlePayment(invoiceId, payment) {
    const invoice = await InvoiceModel.findById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (payment.amount >= invoice.total) {
      invoice.status = 'paid';
      invoice.paidAt = new Date();
    } else {
      invoice.status = 'partially_paid';
      invoice.partialPayments.push(payment);
    }

    await invoice.save();
    return invoice;
  }
}

export default InvoiceService;

