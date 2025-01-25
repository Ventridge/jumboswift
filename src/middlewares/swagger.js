// src/middleware/swagger.js
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { swaggerDefinition } from "../config/swagger.js";

const options = {
  swaggerDefinition,
  apis: ["./src/routes/*.js"], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  // Swagger documentation endpoint
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Endpoint to get swagger.json
  app.get("/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
};

export default setupSwagger;
