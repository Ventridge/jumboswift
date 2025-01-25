export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Handle different types of errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      status: "error",
      message: "Validation error",
      details: err.message,
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      status: "error",
      message: "Invalid token",
    });
  }

  // Default error response
  return res.status(500).json({
    status: "error",
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  });
};
