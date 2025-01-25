import PaymentCredential from "../models/PaymentCredential.js";

export const getMpesaCredentials = async (businessId) => {
  const credentials = await PaymentCredential.findOne({
    businessId,
    paymentMethod: "mpesa",
    isActive: true,
  });

  if (!credentials) {
    throw new Error("MPesa credentials not found for this business");
  }

  // Validate required fields
  const requiredFields = ["shortCode", "consumerKey", "consumerSecret", "passKey"];
  const missingFields = requiredFields.filter((field) => !credentials.credentials[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required MPesa credentials: ${missingFields.join(", ")}`);
  }

  return {
    shortCode: credentials.credentials.shortCode,
    consumerKey: credentials.credentials.consumerKey,
    consumerSecret: credentials.credentials.consumerSecret,
    passKey: credentials.credentials.passKey,
    type: credentials.type,
    callbackUrl: credentials.credentials.callbackUrl,
  };
};
