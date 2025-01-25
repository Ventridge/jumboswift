import nodemailer from 'nodemailer';
import config from '../config/envConfig.js';

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      // Configure email transport
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }

  async sendPaymentNotification(payment, business, customer) {
    const emailData = {
      to: customer.email,
      subject: `Payment Confirmation - ${business.name}`,
      template: 'payment-confirmation',
      context: {
        businessName: business.name,
        amount: payment.amount,
        currency: payment.currency,
        date: payment.createdAt,
        transactionId: payment._id,
      },
    };

    await this.sendEmail(emailData);
  }

  async sendInvoiceEmail(invoice, pdf) {
    const emailData = {
      to: invoice.customer.email,
      subject: `Invoice ${invoice.invoiceNumber} from ${invoice.business.name}`,
      template: 'invoice',
      context: {
        businessName: invoice.business.name,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.total,
        dueDate: invoice.dueDate,
      },
      attachments: [{
        filename: `Invoice-${invoice.invoiceNumber}.pdf`,
        content: pdf,
      }],
    };

    await this.sendEmail(emailData);
  }

  async sendRefundNotification(refund, payment, customer) {
    const emailData = {
      to: customer.email,
      subject: 'Refund Processed',
      template: 'refund-notification',
      context: {
        amount: refund.amount,
        currency: payment.currency,
        date: refund.createdAt,
        refundId: refund._id,
      },
    };

    await this.sendEmail(emailData);
  }

  async sendEmail(emailData) {
    const { to, subject, template, context, attachments } = emailData;

    // Render email template
    const html = await this.renderTemplate(template, context);

    try {
      await this.transporter.sendMail({
        from: config.email.from,
        to,
        subject,
        html,
        attachments,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email notification');
    }
  }

  async renderTemplate(template, context) {
    // Implementation of template rendering logic
    // Could use a template engine like handlebars or ejs
  }
}

export default NotificationService;