import app from "./app.js";

app.start().catch((error) => {
  console.error("Application failed to start:", error);
  process.exit(1);
});
