const axios = require("axios");
const { randomUUID } = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const puppeteer = require("puppeteer");

const { config } = require("../config");
const { appendHistory, ensureGeneratedDir, safeImageName } = require("../utils/files");
const { logger } = require("../utils/logger");
const { retry } = require("../utils/retry");

let cachedUserKey = "";

const http = axios.create({
  timeout: config.requestTimeoutMs,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari"
  }
});

function buildPrompt(prompt, style) {
  return [prompt, style].filter(Boolean).join(", ");
}

function makeError(message, statusCode = 502, cause) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.cause = cause;
  return error;
}

async function verifyUserKey(userKey) {
  if (!userKey) return false;
  if (config.perchance.userKey && userKey === config.perchance.userKey) return true;

  try {
    const response = await http.get(config.perchance.verifyUrl, {
      params: {
        userKey,
        __cacheBust: Math.random()
      }
    });

    return response.data?.status !== "not_verified";
  } catch (error) {
    logger.warn(`Could not verify Perchance userKey: ${error.message}`);
    return false;
  }
}

async function launchBrowser() {
  return puppeteer.launch({
    headless: config.perchance.headless ? "new" : false,
    userDataDir: path.resolve(config.perchance.userDataDir),
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
}

async function readUserKeyFromVerifyPage(page) {
  const url = `${config.perchance.verifyUserUrl}?thread=0&__cacheBust=${Math.random()}`;

  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: config.requestTimeoutMs
  });

  const content = await page.content();
  const userKey = content.match(/"userKey":"([^"]+)"/)?.[1];
  if (userKey) return userKey;

  if (content.includes("too_many_requests")) {
    throw makeError("Perchance rate limit exceeded", 429);
  }

  if (content.includes("token_required") || content.includes("Just a moment") || content.includes("challenge-platform")) {
    return "";
  }

  return "";
}

async function extractUserKeyWithPuppeteer() {
  logger.info("Extracting Perchance userKey through Puppeteer");

  let browser;

  try {
    browser = await launchBrowser();

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    );

    const startedAt = Date.now();
    let userKey = await readUserKeyFromVerifyPage(page);

    while (!userKey && Date.now() - startedAt < config.perchance.verificationTimeoutMs) {
      if (!config.perchance.headless) {
        logger.info("Waiting for visible browser verification to complete");
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
      userKey = await readUserKeyFromVerifyPage(page);
    }

    if (!userKey) {
      const hint = config.perchance.headless
        ? "Set PERCHANCE_HEADLESS=false and run again so you can pass Perchance/Cloudflare verification once."
        : "Complete the visible Perchance verification window and retry.";
      throw makeError(`Failed to retrieve Perchance userKey. ${hint}`, 502);
    }

    cachedUserKey = userKey;
    return userKey;
  } catch (error) {
    throw makeError(`Puppeteer fallback failed: ${error.message}`, 502, error);
  } finally {
    if (browser) {
      await browser.close().catch((error) => logger.warn(`Browser close failed: ${error.message}`));
    }
  }
}

async function getUserKey({ forceRefresh = false } = {}) {
  if (!forceRefresh) {
    if (cachedUserKey && (await verifyUserKey(cachedUserKey))) {
      return cachedUserKey;
    }

    if (config.perchance.userKey) {
      cachedUserKey = config.perchance.userKey;
      return cachedUserKey;
    }
  }

  return extractUserKeyWithPuppeteer();
}

async function createImageId({ prompt, negativePrompt, style, resolution, userKey }) {
  const response = await http.get(config.perchance.generateUrl, {
    params: {
      prompt: buildPrompt(prompt, style),
      negativePrompt,
      userKey,
      __cache_bust: Math.random(),
      seed: "-1",
      resolution,
      guidanceScale: config.perchance.guidanceScale,
      channel: config.perchance.channel,
      subChannel: config.perchance.subChannel,
      requestId: Math.random()
    }
  });

  if (response.data?.status === "waiting_for_prev_request_to_finish") {
    throw makeError("Perchance is still processing a previous request", 429);
  }

  if (response.data?.status !== "success" || !response.data?.imageId) {
    throw makeError(`Perchance generation failed: ${JSON.stringify(response.data)}`);
  }

  return response.data.imageId;
}

async function downloadImage(imageId) {
  const response = await http.get(config.perchance.downloadUrl, {
    params: { imageId },
    responseType: "arraybuffer"
  });

  return Buffer.from(response.data);
}

async function generateWithPuppeteer({ prompt, negativePrompt, style, resolution }) {
  logger.info("Generating image through Puppeteer browser workflow");

  let browser;

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    );

    const userKey = cachedUserKey || config.perchance.userKey || (await readUserKeyFromVerifyPage(page));
    if (!userKey) {
      throw makeError(
        "Perchance requires browser verification before generation. Set PERCHANCE_HEADLESS=false, start the backend, pass verification in the opened browser, then retry.",
        502
      );
    }

    const generateUrl =
      `${config.perchance.generateUrl}?userKey=${encodeURIComponent(userKey)}` +
      `&requestId=aiImageCompletion${Math.floor(Math.random() * 2 ** 30)}` +
      `&__cacheBust=${Math.random()}`;

    const body = {
      generatorName: "ai-image-generator",
      channel: config.perchance.channel,
      subChannel: config.perchance.subChannel,
      prompt: buildPrompt(prompt, style),
      negativePrompt,
      seed: -1,
      resolution,
      guidanceScale: Number(config.perchance.guidanceScale)
    };

    const generation = await page.evaluate(
      async ({ url, body }) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 90000);

        try {
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: controller.signal
          });

          return {
            ok: response.ok,
            status: response.status,
            data: await response.json().catch(() => null)
          };
        } finally {
          clearTimeout(timer);
        }
      },
      { url: generateUrl, body }
    );

    if (!generation.ok || generation.data?.status === "failed") {
      throw makeError(`Perchance browser generation failed: ${JSON.stringify(generation.data)}`, 502);
    }

    const imageId = generation.data?.imageId;
    if (!imageId) {
      throw makeError(`Perchance browser generation did not return imageId: ${JSON.stringify(generation.data)}`, 502);
    }

    const downloadUrl = `${config.perchance.downloadUrl}?imageId=${encodeURIComponent(imageId)}`;
    const imageBase64 = await page.evaluate(async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`download failed with ${response.status}`);
      }

      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("could not read generated image"));
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(blob);
      });
    }, downloadUrl);

    return Buffer.from(imageBase64, "base64");
  } finally {
    if (browser) {
      await browser.close().catch((error) => logger.warn(`Browser close failed: ${error.message}`));
    }
  }
}

async function saveImage(buffer, prompt) {
  ensureGeneratedDir();

  const fileName = `${safeImageName(prompt)}-${randomUUID()}.jpeg`;
  const filePath = path.resolve(config.generatedDir, fileName);

  await fs.writeFile(filePath, buffer);

  return { fileName, filePath };
}

async function persistResult({ imageBuffer, prompt, negativePrompt, style, resolution, usedFallback }) {
  const saved = await saveImage(imageBuffer, prompt);
  const imageUrl = `${config.publicBaseUrl.replace(/\/$/, "")}/generated/${saved.fileName}`;

  await appendHistory({
    id: randomUUID(),
    prompt,
    negativePrompt,
    style,
    resolution,
    fileName: saved.fileName,
    imageUrl,
    createdAt: new Date().toISOString(),
    usedFallback
  });

  return { prompt, ...saved, imageUrl };
}

async function generateImage(options) {
  const prompt = options.prompt;
  const negativePrompt = options.negativePrompt ?? config.perchance.negativePrompt;
  const style = options.style ?? config.perchance.style;
  const resolution = options.resolution ?? config.perchance.resolution;

  logger.info(`Generating Perchance image: "${prompt.slice(0, 90)}"`);

  let userKey = "";

  try {
    userKey = await getUserKey();
  } catch (error) {
    logger.warn(`Could not prepare direct Perchance userKey, will use Puppeteer workflow: ${error.message}`);
  }

  try {
    if (userKey) {
      try {
        return await retry(
          async (attempt) => {
            if (attempt > 1) logger.info(`Retrying direct Perchance generation, attempt ${attempt}`);

            const imageId = await createImageId({ prompt, negativePrompt, style, resolution, userKey });
            const imageBuffer = await downloadImage(imageId);
            return persistResult({
              imageBuffer,
              prompt,
              negativePrompt,
              style,
              resolution,
              usedFallback: false
            });
          },
          {
            attempts: config.retryAttempts,
            delayMs: config.retryDelayMs
          }
        );
      } catch (error) {
        logger.warn(`Direct Perchance workflow failed, switching to Puppeteer workflow: ${error.message}`);
      }
    }

    return await retry(
      async (attempt) => {
        if (attempt > 1) logger.info(`Retrying Puppeteer Perchance generation, attempt ${attempt}`);

        const imageBuffer = await generateWithPuppeteer({ prompt, negativePrompt, style, resolution });
        return persistResult({
          imageBuffer,
          prompt,
          negativePrompt,
          style,
          resolution,
          usedFallback: true
        });
      },
      {
        attempts: config.retryAttempts,
        delayMs: config.retryDelayMs
      }
    );
  } catch (error) {
    throw makeError(`Image generation failed: ${error.message}`, error.statusCode || 502, error);
  }
}

module.exports = { generateImage };
