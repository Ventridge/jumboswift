import mongoose from "mongoose";

const refundSchema = new mongoose.Schema(
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
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    customerId: {
      type: String,
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
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    refundMethod: {
      type: String,
      enum: ["same_as_payment", "manual"],
      default: "same_as_payment",
    },
    processorResponse: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed,
    refundedAt: Date,
    failureReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
refundSchema.index({ businessId: 1, createdAt: -1 });
refundSchema.index({ paymentId: 1 });
refundSchema.index({ status: 1 });

export default mongoose.model("Refund", refundSchema);
