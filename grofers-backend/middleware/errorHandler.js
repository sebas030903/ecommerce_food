export function errorHandler(err, _req, res, _next) {
  console.error("💥 Error:", err);
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ error: message });
}
