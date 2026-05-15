const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const generateRoutes = require("./routes/generateRoutes");
const { config } = require("./config");
const { ensureGeneratedDir } = require("./utils/files");

function createApp() {
  ensureGeneratedDir();

  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));

  app.use(
    "/generated",
    express.static(path.resolve(config.generatedDir), {
      immutable: true,
      maxAge: "30d"
    })
  );

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "aether-perchance-backend" });
  });

  app.use("/", generateRoutes);

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: `Route ${req.method} ${req.path} not found`
    });
  });

  app.use((err, _req, res, _next) => {
    const status = err.statusCode || 500;
    res.status(status).json({
      success: false,
      error: status >= 500 && config.nodeEnv === "production" ? "Internal server error" : err.message
    });
  });

  return app;
}

module.exports = { createApp };
