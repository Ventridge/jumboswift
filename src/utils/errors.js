// src/utils/errors.js
class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(errors) {
    super("Validation failed", 400, errors);
  }
}

class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = "Access forbidden") {
    super(message, 403);
  }
}

class ResourceNotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404);
  }
}

export { AppError, ValidationError, AuthenticationError, AuthorizationError, ResourceNotFoundError };
