import chalk from "chalk";

const requiredEnvVars = ["NODE_ENV", "PORT", "MONGODB_URI", "JWT_SECRET", "ENCRYPTION_KEY", "ADMIN_USERNAME", "ADMIN_PASSWORD"];

// Validate required environment variables
const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingVars.length > 0) {
  console.error(chalk.red(`Missing required environment variables: ${missingVars.join(", ")}`));
  process.exit(1);
}

const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,

  encryption: {
    key: process.env.ENCRYPTION_KEY,
  },

  admin: {
    apiKey: process.env.ADMIN_USERNAME,
    apiSecret: process.env.ADMIN_PASSWORD,
  },

  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") || ["*"],
    credentials: process.env.CORS_CREDENTIALS === "true",
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || "900000", 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
  },

  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    secure: process.env.EMAIL_SECURE === "true",
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM,
  },

  webhooks: {
    baseUrl: process.env.WEBHOOK_BASE_URL,
  },
};

export default config;
