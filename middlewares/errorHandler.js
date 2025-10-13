function errorHandler(err, req, res, next) {
  console.error("❌ Error:", err.message);
  res.status(500).json({
    success: false,
    error: err.message || "Error interno del servidor"
  });
}
module.exports = errorHandler;
