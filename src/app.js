// src/app
import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";
import routes from "./routes/index";
import { errorHandler } from "./middlewares/errorHandler";
import database from "./config/database";
import config from "./config/envConfig";
import setupSwagger from "./middlewares/swagger";

class App {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupSwagger();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(mongoSanitize());

    // Body parsing
    this.app.use(
      express.json({
        verify: (req, res, buf) => {
          if (req.originalUrl.includes("/webhook")) {
            req.rawBody = buf.toString();
          }
        },
      })
    );
    this.app.use(express.urlencoded({ extended: true }));

    // Compression
    this.app.use(compression());

    // Logging
    if (config.env !== "test") {
      this.app.use(morgan("dev"));
    }
  }

  setupSwagger() {
    // Only enable Swagger in development and staging environments
    if (config.env !== "production") {
      setupSwagger(this.app);
    }
  }

  setupRoutes() {
    // Health check
    this.app.get("/health", (req, res) => {
      res.status(200).json({
        status: "success",
        message: "Payment gateway service is running",
      });
    });

    // API routes
    this.app.use("/api/v1", routes);

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        status: "error",
        message: "Route not found",
      });
    });
  }

  setupErrorHandling() {
    this.app.use(errorHandler);
  }

  async start() {
    try {
      // Connect to database
      await database.connect();

      // Start server
      const port = config.port;
      this.app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  }
}

export default new App();
