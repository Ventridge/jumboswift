import mongoose from "mongoose";
import { encryptField, decryptField } from "../utils/encryption.js";
import { type } from "os";

const credentialSchema = new mongoose.Schema(
  {
    businessId: {
      type: String,
      required: true,
    },
    app: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApiApp",
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["stripe", "mpesa", "cash"],
      required: true,
    },
    credentials: {
      shortCode: String,
      consumerKey: {
        type: String,
        set: encryptField,
        get: decryptField,
      },
      consumerSecret: {
        type: String,
        set: encryptField,
        get: decryptField,
      },
      type: {
        type: String,
        enum: ["paybill", "till"],
      },
      passKey: {
        type: String,
        set: encryptField,
        get: decryptField,
      },
      callbackUrl: String,
      publishableKey: String,
      secretKey: {
        type: String,
        set: encryptField,
        get: decryptField,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

export default mongoose.model("PaymentCredential", credentialSchema);
