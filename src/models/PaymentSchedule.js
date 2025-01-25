import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    businessId: {
      type: String,
      required: true,
      index: true,
    },
    app: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApiApp",
      required: true,
    },
    customerId: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "mpesa"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "KES",
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
    },
    nextPaymentDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "paused", "cancelled"],
      default: "active",
    },
    metadata: mongoose.Schema.Types.Mixed,
    lastPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    failedAttempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes
scheduleSchema.index({ nextPaymentDate: 1, status: 1 });
scheduleSchema.index({ businessId: 1, status: 1 });

export default mongoose.model("PaymentSchedule", scheduleSchema);
