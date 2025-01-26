import mongoose from "mongoose";
import config from "./envConfig.js";

class Database {
  constructor() {
    this.mongoUri = config.mongoUri;
    this.options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
  }

  async connect() {
    try {
      console.log("\x1b[36m%s\x1b[0m", "[MongoDB] Attempting connection...");

      mongoose.connection.on("connecting", () => {
        console.log("\x1b[36m%s\x1b[0m", "[MongoDB] Connecting...");
      });

      mongoose.connection.on("connected", () => {
        console.log("\x1b[32m%s\x1b[0m", `[MongoDB] Connected successfully!`);
      });

      mongoose.connection.on("error", (err) => {
        console.error("\x1b[31m%s\x1b[0m", `[MongoDB] Connection error: ${err}`);
      });

      mongoose.connection.on("disconnected", () => {
        console.log("\x1b[33m%s\x1b[0m", "[MongoDB] Disconnected");
      });

      await mongoose.connect(this.mongoUri, this.options);
      return mongoose.connection;
    } catch (error) {
      console.error("\x1b[31m%s\x1b[0m", `[MongoDB] Initial connection error: ${error}`);
      throw error;
    }
  }
}

export default new Database();
