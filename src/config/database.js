import mongoose from "mongoose";
import config from "./envConfig.js";

class Database {
  constructor() {
    this.mongoUri = config.mongoUri;
  }

  async connect() {
    try {
      await mongoose.connect(this.mongoUri);

      // Add event listeners
      mongoose.connection.on("connected", () => {
        console.log("Connected to MongoDB");
      });

      mongoose.connection.on("error", (err) => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
      });

      mongoose.connection.on("disconnected", () => {
        console.log("MongoDB disconnected");
      });

      // Handle process termination
      process.on("SIGINT", async () => {
        try {
          await mongoose.connection.close();
          console.log("MongoDB connection closed through app termination");
          process.exit(0);
        } catch (err) {
          console.error("Error closing MongoDB connection:", err);
          process.exit(1);
        }
      });
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      process.exit(1);
    }
  }
}

export default new Database();
