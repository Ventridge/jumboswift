import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";
import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import database from "./config/database.js";
import config from "./config/envConfig.js";
import setupSwagger from "./middlewares/swagger.js";

class App {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupSwagger();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(mongoSanitize());
    this.app.use(express.json({
      verify: (req, res, buf) => {
        if (req.originalUrl.includes("/webhook")) {
          req.rawBody = buf.toString();
        }
      },
    }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(compression());
    
    if (config.env !== "test") {
      this.app.use(morgan("dev"));
    }
  }

  setupSwagger() {
    if (config.env !== "production") {
      setupSwagger(this.app);
    }
  }

  setupRoutes() {
    this.app.get("/health", (req, res) => {
      res.status(200).json({
        status: "success",
        message: "Payment gateway service is running",
      });
    });

    this.app.use("/api/v1", routes);

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
      await database.connect();
      console.log("\x1b[36m%s\x1b[0m", "[App] Database connection established");
      
      const port = config.port;
      this.app.listen(port, () => {
        console.log("\x1b[32m%s\x1b[0m", `[App] Server running on port ${port}`);
      });
    } catch (error) {
      console.error("\x1b[31m%s\x1b[0m", "[App] Failed to start server:", error);
      process.exit(1);
    }
  }
}

export default new App();