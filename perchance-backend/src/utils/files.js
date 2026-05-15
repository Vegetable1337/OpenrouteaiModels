const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const { config } = require("../config");

function ensureGeneratedDir() {
  fs.mkdirSync(path.resolve(config.generatedDir), { recursive: true });
}

function safeImageName(prompt) {
  const cleaned = prompt
    .toLowerCase()
    .replace(/[^a-z0-9а-яё_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);

  return cleaned || "perchance-image";
}

async function appendHistory(entry) {
  ensureGeneratedDir();

  const historyPath = path.resolve(config.generatedDir, "history.jsonl");
  await fsp.appendFile(historyPath, `${JSON.stringify(entry)}\n`, "utf8");
}

async function listGeneratedImages() {
  ensureGeneratedDir();

  const entries = await fsp.readdir(path.resolve(config.generatedDir), { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /\.(png|jpe?g|webp|gif)$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort()
    .reverse();
}

module.exports = { appendHistory, ensureGeneratedDir, listGeneratedImages, safeImageName };
