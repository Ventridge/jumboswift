import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "KES",
    },
    phoneNumber: {
      type: String,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "mpesa", "cash"],
      required: true,
    },
    type: {
      type: String,
      enum: ["one-time", "recurring"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    app: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApiApp",
    },
    processorResponse: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed,
    refunded: {
      type: Boolean,
      default: false,
    },
    refundedAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes
paymentSchema.index({ businessId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Payment", paymentSchema);
