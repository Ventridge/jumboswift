// src/models/ApiApp.js
import mongoose from "mongoose";
import crypto from "crypto";

const apiAppSchema = new mongoose.Schema(
  {
    appId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: String,
    apiKey: {
      type: String,
      required: true,
      unique: true,
    },
    apiSecret: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    ipWhitelist: [
      {
        type: String,
      },
    ],
    accessScopes: [
      {
        type: String,
        enum: ["payments", "refunds", "invoices", "all"],
        default: ["all"],
      },
    ],
    rateLimit: {
      windowMs: {
        type: Number,
        default: 900000, // 15 minutes
      },
      maxRequests: {
        type: Number,
        default: 100,
      },
    },
    lastAccessedAt: Date,
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Generate API key and secret
apiAppSchema.statics.generateCredentials = function () {
  return {
    apiKey: "pk_" + crypto.randomBytes(24).toString("hex"),
    apiSecret: "sk_" + crypto.randomBytes(32).toString("hex"),
  };
};

// Verify API credentials
apiAppSchema.statics.verifyCredentials = function (apiKey, apiSecret) {
  return this.findOne({
    apiKey,
    apiSecret,
    status: "active",
  });
};

export default mongoose.model("ApiApp", apiAppSchema);
