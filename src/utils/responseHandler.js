// src/utils/responseHandler.js

class ResponseHandler {
  static success(data = null, message = "Success", statusCode = 200) {
    return {
      status: "success",
      message,
      data,
      statusCode,
    };
  }

  static error(message = "Error occurred", errors = null, statusCode = 500) {
    return {
      status: "error",
      message,
      errors,
      statusCode,
      ...(process.env.NODE_ENV === "development" && errors && { stack: errors.stack }),
    };
  }

  static validationError(errors) {
    return this.error(
      "Validation failed",
      errors.map((error) => ({
        field: error.path.join("."),
        message: error.message,
      })),
      400
    );
  }

  static notFound(resource = "Resource") {
    return this.error(`${resource} not found`, null, 404);
  }

  static unauthorized(message = "Unauthorized access") {
    return this.error(message, null, 401);
  }

  static forbidden(message = "Access forbidden") {
    return this.error(message, null, 403);
  }
}

export default ResponseHandler;
