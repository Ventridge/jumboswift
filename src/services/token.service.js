const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");
const { v4: uuidv4 } = require("uuid");
const Business = require("../models/Business");

class TokenService {
  async generateAuthTokens(business) {
    const accessToken = jwt.sign(
      { businessId: business._id },
      process.env.JWT_SECRET || "payment-secret-gateway",
      { expiresIn: "24h" }
    );

    const refreshToken = uuidv4();
    await redisClient.setex(
      `refresh_token:${refreshToken}`,
      30 * 24 * 60 * 60, // 30 days
      business._id.toString()
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshAuthTokens(refreshToken) {
    const businessId = await redisClient.get(`refresh_token:${refreshToken}`);
    if (!businessId) {
      throw new Error("Invalid refresh token");
    }

    const business = await Business.findById(businessId);
    if (!business) {
      throw new Error("Business not found");
    }

    return this.generateAuthTokens(business);
  }

  async revokeToken(refreshToken) {
    await redisClient.del(`refresh_token:${refreshToken}`);
  }
}

module.exports = TokenService;
