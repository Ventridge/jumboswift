const Redis = require("ioredis");
const logger = require("../utils/logger.js");

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

redisClient.on("error", (error) => {
  logger.error("Redis connection error:", error);
});

redisClient.on("connect", () => {
  logger.info("Redis connected successfully");
});

module.exports = redisClient;
