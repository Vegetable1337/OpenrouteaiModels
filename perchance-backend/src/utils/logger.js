function format(level, message, meta) {
  const time = new Date().toISOString();
  const extra = meta ? ` ${JSON.stringify(meta)}` : "";
  return `[${time}] ${level.toUpperCase()} ${message}${extra}`;
}

const logger = {
  info(message, meta) {
    console.log(format("info", message, meta));
  },
  warn(message, meta) {
    console.warn(format("warn", message, meta));
  },
  error(message, meta) {
    console.error(format("error", message, meta));
  }
};

module.exports = { logger };
