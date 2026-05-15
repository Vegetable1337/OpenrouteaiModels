require("dotenv").config();

function numberFromEnv(name, fallback, min, max) {
  const raw = process.env[name];
  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) return fallback;
  if (typeof min === "number" && parsed < min) return fallback;
  if (typeof max === "number" && parsed > max) return fallback;

  return parsed;
}

const config = {
  port: numberFromEnv("PORT", 3001, 1, 65535),
  nodeEnv: process.env.NODE_ENV || "development",
  publicBaseUrl: process.env.PUBLIC_BASE_URL || "http://localhost:3001",
  generatedDir: process.env.GENERATED_DIR || "generated",
  perchance: {
    userKey: process.env.PERCHANCE_USER_KEY || "",
    channel: process.env.PERCHANCE_CHANNEL || "ai-text-to-image-generator",
    subChannel: process.env.PERCHANCE_SUB_CHANNEL || "public",
    style: process.env.PERCHANCE_STYLE || "",
    negativePrompt: process.env.PERCHANCE_NEGATIVE_PROMPT || "",
    resolution: process.env.PERCHANCE_RESOLUTION || "512x768",
    guidanceScale: String(numberFromEnv("PERCHANCE_GUIDANCE_SCALE", 7, 1, 30)),
    generateUrl: "https://image-generation.perchance.org/api/generate",
    downloadUrl: "https://image-generation.perchance.org/api/downloadTemporaryImage",
    verifyUrl: "https://image-generation.perchance.org/api/checkVerificationStatus",
    verifyUserUrl: "https://image-generation.perchance.org/api/verifyUser",
    pageUrl: "https://perchance.org/ai-text-to-image-generator",
    headless: (process.env.PERCHANCE_HEADLESS || "false").toLowerCase() !== "false",
    userDataDir: process.env.PERCHANCE_USER_DATA_DIR || ".perchance-profile",
    verificationTimeoutMs: numberFromEnv("PERCHANCE_VERIFICATION_TIMEOUT_MS", 120000, 15000, 600000)
  },
  requestTimeoutMs: numberFromEnv("REQUEST_TIMEOUT_MS", 90000, 5000, 300000),
  retryAttempts: numberFromEnv("RETRY_ATTEMPTS", 3, 1, 10),
  retryDelayMs: numberFromEnv("RETRY_DELAY_MS", 1200, 100, 30000)
};

module.exports = { config };
