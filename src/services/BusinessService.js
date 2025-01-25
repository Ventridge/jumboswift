// src/services/BusinessService.js
import Business from "../models/Business.js";
import PaymentCredential from "../models/PaymentCredential.js";
import StripeService from "./StripeService.js";
import MpesaService from "./MpesaService.js";
import ApiApp from "../models/ApiApp.js";
import mongoose from "mongoose";

class BusinessService {
  constructor() {
    this.processors = {
      stripe: new StripeService(),
      mpesa: new MpesaService(),
    };
  }

  async registerBusiness(businessData, appId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Verify app exists
      const app = await ApiApp.findOne({ appId });
      if (!app) {
        throw new Error("Invalid app ID");
      }

      // Check if business already exists
      let business = await Business.findOne({ businessId: businessData.businessId });

      if (business) {
        // Check if business is already connected to this app
        const existingApp = business.apps.find((a) => a.appId === app._id.toString());
        if (!existingApp) {
          // Connect business to new app
          business.apps.push({
            appId: app._id,
            status: "active",
          });
        }

        // Update business details
        business.name = businessData.name;
        business.status = businessData.status || "active";
        await business.save();
      } else {
        // Create new business with app connection
        business = await Business.create({
          ...businessData,
          status: businessData.status || "active",
          apps: [
            {
              appId: app._id,
              status: "active",
            },
          ],
        });
      }

      await session.commitTransaction();
      return business;
    } catch (error) {
      console.log(error);
      await session.abortTransaction();
      throw error;
    }
  }

  async setupPaymentMethods(businessData, req) {
    const { app } = req;
    const { businessId } = req.params;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Verify app exists
      if (!app) {
        throw new Error("Invalid app ID");
      }

      // Check if business already exists
      let business = await Business.findOne({ businessId, "apps.appId": app._id?.toString() });

      if (!business) {
        throw new Error("Business not found or not connected to this app");
      }

      if (business) {
        // Update payment methods
        if (businessData.paymentMethods.length === 0) {
          business.paymentMethods = businessData.paymentMethods;
        } else {
          const newPaymentMethods = businessData.paymentMethods.filter((method) => {
            const existingMethod = business.paymentMethods.find((m) => m.type === method.type);
            return !existingMethod;
          });

          business.paymentMethods = [...business.paymentMethods, ...newPaymentMethods];
        }
        await business.save();
      }
      await session.commitTransaction();
      return business;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async connectBusinessToApp(businessId, appId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const business = await Business.findOne({ businessId });
      if (!business) {
        throw new Error("Business not found");
      }

      const app = await ApiApp.findOne({ appId });
      if (!app) {
        throw new Error("App not found");
      }

      // Check if already connected
      const existingConnection = business.apps.find((a) => a.appId === appId);
      if (existingConnection) {
        if (existingConnection.status === "inactive") {
          existingConnection.status = "active";
          existingConnection.connectedAt = new Date();
          await business.save();
        }
        return business;
      }

      // Add new connection
      business.apps.push({
        appId,
        status: "active",
      });

      await business.save();
      await session.commitTransaction();

      return business;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async disconnectBusinessFromApp(businessId, appId) {
    const business = await Business.findOne({ businessId });
    if (!business) {
      throw new Error("Business not found");
    }

    const appConnection = business.apps.find((a) => a.appId === appId);
    if (!appConnection) {
      throw new Error("Business not connected to this app");
    }

    appConnection.status = "inactive";
    await business.save();

    return business;
  }

  async listBusinessesForApp(appId, filters = {}) {
    const query = {
      "apps.appId": appId,
      "apps.status": "active",
    };

    if (filters.status) {
      query.status = filters.status;
    }

    return Business.find(query);
  }

  async updateCredentials(businessId, req) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate business exists and is active
      const business = await Business.findOne({
        businessId,
        status: "active",
      });

      if (!business) {
        throw new Error("Business not found or inactive");
      }

      // Check if payment method is enabled for business
      const paymentMethodEnabled = business.paymentMethods.some((method) => method.type === req.body.paymentMethod && method.isActive);

      if (!paymentMethodEnabled) {
        throw new Error("Payment method not enabled for this business");
      }

      // Handle existing credentials
      const existingCredentials = await PaymentCredential.findOne({
        businessId,
        paymentMethod: req.body.paymentMethod,
        type: req.body?.credentials?.type,
      });

      let credentials;
      if (existingCredentials) {
        // Update existing credentials
        existingCredentials.credentials = req.body.credentials;
        credentials = await existingCredentials.save();
      } else {
        // Create new credentials
        credentials = await PaymentCredential.create(req.body);
      }

      // Verify credentials with payment processor
      await this.verifyCredentials(businessId, req.body.paymentMethod);

      await session.commitTransaction();
      return credentials;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getPaymentMethods(businessId) {
    const business = await Business.findOne({ businessId });
    if (!business) {
      throw new Error("Business not found");
    }

    const credentials = await PaymentCredential.find({
      businessId,
      isActive: true,
    });

    // Combine payment methods with their credentials
    const paymentMethods = business.paymentMethods.map((method) => {
      const methodCredentials = credentials.find((cred) => cred.paymentMethod === method.type);

      return {
        ...method.toObject(),
        hasCredentials: !!methodCredentials,
        credentialType: methodCredentials?.type,
      };
    });

    return paymentMethods;
  }

  async verifyCredentials(businessId, paymentMethod) {
    const credentials = await PaymentCredential.findOne({
      businessId,
      isActive: true,
    });

    if (!credentials) {
      throw new Error("Credentials not found");
    }

    // Verify with appropriate payment processor
    const processor = this.processors[paymentMethod];
    if (!processor) {
      throw new Error("Invalid payment method");
    }

    const result = await processor.verifyCredentials(credentials);
    if (!result.success) {
      throw new Error("Invalid credentials");
    }

    return result;
  }

  async getBusinessDetails(businessId) {
    const business = await Business.findOne({ businessId }).select("-paymentMethods.processingFees");

    if (!business) {
      throw new Error("Business not found");
    }

    return business;
  }

  async updateBusinessStatus(businessId, status) {
    const validStatuses = ["active", "suspended", "pending"];
    if (!validStatuses.includes(status)) {
      throw new Error("Invalid status");
    }

    const business = await Business.findOneAndUpdate({ businessId }, { status }, { new: true });

    if (!business) {
      throw new Error("Business not found");
    }

    return business;
  }

  async deletePaymentMethod(businessId, paymentMethod) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update business payment methods
      const business = await Business.findOne({ businessId });
      if (!business) {
        throw new Error("Business not found");
      }

      business.paymentMethods = business.paymentMethods.filter((method) => method.type !== paymentMethod);
      await business.save();

      // Deactivate credentials
      await PaymentCredential.findOneAndUpdate({ businessId, paymentMethod }, { isActive: false });

      await session.commitTransaction();
      return business;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export default BusinessService;
