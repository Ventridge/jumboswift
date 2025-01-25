// src/config/swagger.js
export const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Payment Gateway API",
    version: "1.0.0",
    description: `
      A comprehensive payment gateway API that supports multiple payment methods,
      invoice generation, refunds, and business management.
    `,
    contact: {
      name: "API Support",
      email: "support@example.com",
      url: "https://example.com/support"
    },
    license: {
      name: "Proprietary",
      url: "https://example.com/license"
    }
  },
  servers: [
    {
      url: "/api/v1",
      description: "Development server"
    },
    {
      url: "https://api.example.com/v1",
      description: "Production server"
    }
  ],
  tags: [
    {
      name: "Payments",
      description: "Payment processing endpoints"
    },
    {
      name: "Invoices",
      description: "Invoice management endpoints"
    },
    {
      name: "Refunds",
      description: "Refund processing endpoints"
    },
    {
      name: "Business",
      description: "Business management endpoints"
    },
    {
      name: "API Apps",
      description: "API application management endpoints"
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description: "API Key for request authentication"
      },
      ApiSecretAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-secret",
        description: "API Secret for request authentication"
      }
    }
  },
  security: [
    {
      ApiKeyAuth: [],
      ApiSecretAuth: []
    }
  ]
};

// Swagger configuration options
export const swaggerOptions = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'], // Path to the API routes
  explorer: true
};