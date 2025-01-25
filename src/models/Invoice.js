// src/models/Invoice.js
import mongoose from "mongoose";
import { generateInvoiceNumber } from "../utils/helpers.js";

const invoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  amount: {
    type: Number,
    required: true,
  },
  tax: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
});

const invoiceSchema = new mongoose.Schema(
  {
    businessId: {
      type: String,
      required: true,
      index: true,
    },
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    currency: {
      type: String,
      required: true,
      default: "KES",
    },
    items: [invoiceItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    taxTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue", "cancelled"],
      default: "draft",
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paymentTerms: String,
    notes: String,
    metadata: mongoose.Schema.Types.Mixed,
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    sentAt: Date,
    paidAt: Date,
    cancelledAt: Date,
    reminders: [
      {
        sentAt: Date,
        type: String,
      },
    ],
    partialPayments: [
      {
        amount: Number,
        paymentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Payment",
        },
        paidAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
invoiceSchema.index({ businessId: 1, status: 1 });
invoiceSchema.index({ dueDate: 1, status: 1 });
invoiceSchema.index({ "partialPayments.paymentId": 1 });

// Pre-save hook to generate invoice number
invoiceSchema.pre("save", async function (next) {
  if (this.isNew) {
    this.invoiceNumber = await generateInvoiceNumber(this.businessId);
  }
  next();
});

// Methods
invoiceSchema.methods.calculateTotals = function () {
  this.subtotal = this.items.reduce((sum, item) => {
    return sum + item.quantity * item.unitPrice;
  }, 0);

  this.taxTotal = this.items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice;
    return sum + itemTotal * (item.tax / 100);
  }, 0);

  this.total = this.subtotal + this.taxTotal;
};

invoiceSchema.methods.addPayment = function (payment) {
  if (payment.amount >= this.total) {
    this.status = "paid";
    this.paidAt = new Date();
    this.paymentId = payment._id;
  } else {
    this.status = this.status === "draft" ? "sent" : this.status;
    this.partialPayments.push({
      amount: payment.amount,
      paymentId: payment._id,
      paidAt: new Date(),
    });
  }
};

export default mongoose.model("Invoice", invoiceSchema);
