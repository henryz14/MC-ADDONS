// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Asegurar carpetas de subida
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// WRAPPER PARA ASYNC/AWAIT (reemplaza express-async-errors)
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Hacer asyncHandler global para fácil uso
global.asyncHandler = asyncHandler;

// 1. SEGURIDAD - Helmet (primero)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

// 2. LOGGING - Morgan
const logStream = fs.createWriteStream(
  path.join(__dirname, "access.log"), 
  { flags: "a" }
);
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev", { 
  stream: logStream 
}));

// 3. RATE LIMITING - Protección contra DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 peticiones por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Demasiadas peticiones desde esta IP, intenta en 15 minutos"
  }
});
app.use(limiter);

// 4. MIDDLEWARES DE PARSEO
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 5. ARCHIVOS ESTÁTICOS
app.use(express.static(__dirname));
app.use("/uploads", express.static(UPLOADS_DIR));

// 6. IMPORTAR RUTAS
const uploadRoutes = require("./routes/uploadRoutes");
const addonRoutes = require("./routes/addonRoutes");
const statsRoutes = require("./routes/statsRoutes");

// 7. USAR RUTAS
app.use("/", uploadRoutes);
app.use("/addons", addonRoutes);
app.use("/stats", statsRoutes);

// 8. RUTA DE HEALTH CHECK
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "online",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 9. MANEJO DE RUTAS NO ENCONTRADAS
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Ruta no encontrada",
    path: req.path
  });
});

// 10. MIDDLEWARE DE ERRORES GLOBAL (siempre al final)
const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

// INICIAR SERVIDOR
const server = app.listen(PORT, () => {
  console.log("┌──────────────────────────────┐");
  console.log("🚀 SERVIDOR MC ADDONS INICIADO");
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`📦 Entorno: ${NODE_ENV}`);
  console.log(`📁 Uploads: ${UPLOADS_DIR}`);
  console.log("└──────────────────────────────┘");
});

// MANEJO GRACEFUL SHUTDOWN
process.on("SIGTERM", () => {
  console.log("⚠️  SIGTERM recibido, cerrando servidor...");
  server.close(() => {
    console.log("✅ Servidor cerrado correctamente");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\n⚠️  SIGINT recibido, cerrando servidor...");
  server.close(() => {
    console.log("✅ Servidor cerrado correctamente");
    process.exit(0);
  });
});
