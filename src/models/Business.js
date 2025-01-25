import mongoose from "mongoose";

const businessSchema = new mongoose.Schema(
  {
    businessId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended", "pending"],
      default: "active",
    },
    apps: [
      {
        appId: {
          type: String,
          required: true,
          ref: "ApiApp",
        },
        status: {
          type: String,
          enum: ["active", "inactive"],
          default: "active",
        },
        connectedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    paymentMethods: [
      {
        type: {
          type: String,
          enum: ["card", "mpesa", "cash"],
          required: true,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        processingFees: {
          percentage: {
            type: Number,
            default: 0,
          },
          fixed: {
            type: Number,
            default: 0,
          },
        },
      },
    ],
  },
  { timestamps: true }
);

businessSchema.index({ businessId: 1, "apps.appId": 1 });
businessSchema.index({ "apps.appId": 1 });

export default mongoose.model("Business", businessSchema);
