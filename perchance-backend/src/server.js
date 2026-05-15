const { createApp } = require("./app");
const { config } = require("./config");
const { logger } = require("./utils/logger");

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(`Perchance backend listening on http://localhost:${config.port}`);
});

function shutdown(signal) {
  logger.info(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
