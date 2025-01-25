// src/middlewares/auth.js
import ApiApp from "../models/ApiApp.js";
import { verifyApiCredentials, isValidApiKey, isValidApiSecret } from "../utils/helpers.js";

export const authenticateRequest = async (req, res, next) => {
  try {
    // Get API credentials from headers
    const apiKey = req.headers["x-api-key"];
    const apiSecret = req.headers["x-api-secret"];

    // Validate presence of credentials
    if (!apiKey || !apiSecret) {
      return res.status(401).json({
        status: "error",
        message: "API credentials are required",
      });
    }

    // Validate credential format
    if (!isValidApiKey(apiKey) || !isValidApiSecret(apiSecret)) {
      return res.status(401).json({
        status: "error",
        message: "Invalid API credential format",
      });
    }

    // Find app by API key
    const app = await ApiApp.findOne({ apiKey, status: "active" }).lean();

    if (!app) {
      return res.status(401).json({
        status: "error",
        message: "Invalid API key",
      });
    }

    // Verify API secret
    const isValidSecret = verifyApiCredentials(apiSecret, app.apiSecret);
    if (!isValidSecret) {
      return res.status(401).json({
        status: "error",
        message: "Invalid API secret",
      });
    }

    // Check IP whitelist if configured
    if (app.ipWhitelist?.length > 0 && !app.ipWhitelist.includes("*") && !app.ipWhitelist.includes("0.0.0.0")) {
      const clientIp = req.ip;

      const isIpAllowed = app.ipWhitelist.some((allowedIp) => {
        if (allowedIp.includes("/")) {
          return isIpInCidrRange(clientIp, allowedIp);
        }
        return clientIp === allowedIp;
      });

      if (!isIpAllowed) {
        return res.status(403).json({
          status: "error",
          message: "IP address not allowed",
        });
      }
    }

    // Check access scopes
    const requestedScope = getRequestScope(req.path);
    if (requestedScope && !app.accessScopes.includes("all") && !app.accessScopes.includes(requestedScope)) {
      return res.status(403).json({
        status: "error",
        message: "Insufficient permissions for this operation",
      });
    }

    // Update last accessed timestamp
    app.lastAccessedAt = new Date();
    await ApiApp.updateOne({ appId: app.appId }, { lastAccessedAt: app.lastAccessedAt });

    // Attach app to request object
    req.app = app;

    next();
  } catch (error) {
    next(error);
  }
};

// Helper function to determine scope from request path
const getRequestScope = (path) => {
  if (path.includes("/payments")) return "payments";
  if (path.includes("/refunds")) return "refunds";
  if (path.includes("/invoices")) return "invoices";
  return null;
};

// Special middleware for admin-only endpoints (like managing API apps)
export const adminAuth = async (req, res, next) => {
  try {
    const adminKey = req.headers["x-admin-key"];
    const adminSecret = req.headers["x-admin-secret"];

    if (!adminKey || !adminSecret) {
      return res.status(401).json({
        status: "error",
        message: "Admin credentials required",
      });
    }

    // Verify against environment variables or secure storage
    if (adminKey !== process.env.ADMIN_API_KEY || adminSecret !== process.env.ADMIN_API_SECRET) {
      return res.status(401).json({
        status: "error",
        message: "Invalid admin credentials",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
