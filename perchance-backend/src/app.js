const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const generateRoutes = require("./routes/generateRoutes");
const { config } = require("./config");
const { ensureGeneratedDir, listGeneratedImages } = require("./utils/files");

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

  app.get("/", async (_req, res, next) => {
    try {
      const images = await listGeneratedImages();
      const cards = images.length
        ? images.map((fileName) => {
          const url = `/generated/${encodeURIComponent(fileName)}`;
          return `<a class="card" href="${url}" target="_blank" rel="noreferrer"><img src="${url}" alt="${fileName}"><span>${fileName}</span></a>`;
        }).join("")
        : `<div class="empty">Generated images will appear here after POST /generate.</div>`;

      res.type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Aether Perchance Images</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #090909; color: #f5f5f5; }
    body { margin: 0; min-height: 100vh; background: #090909; }
    main { width: min(1120px, calc(100vw - 32px)); margin: 0 auto; padding: 32px 0 48px; }
    h1 { margin: 0; font-size: 28px; }
    p { color: #a1a1aa; }
    code { border: 1px solid #2a2a2a; border-radius: 8px; background: #151515; padding: 2px 6px; color: #e5e7eb; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-top: 24px; }
    .card { overflow: hidden; border: 1px solid #262626; border-radius: 18px; background: #121212; color: inherit; text-decoration: none; }
    .card img { display: block; width: 100%; aspect-ratio: 1 / 1; object-fit: cover; background: #050505; }
    .card span { display: block; padding: 10px 12px; overflow: hidden; color: #d4d4d8; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
    .empty { margin-top: 24px; border: 1px dashed #333; border-radius: 18px; padding: 24px; color: #a1a1aa; }
  </style>
</head>
<body>
  <main>
    <h1>Aether Perchance Images</h1>
    <p>Generate with <code>POST /generate</code>. Saved files are served from <code>/generated</code>.</p>
    <section class="grid">${cards}</section>
  </main>
</body>
</html>`);
    } catch (error) {
      next(error);
    }
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
