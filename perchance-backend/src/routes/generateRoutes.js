const express = require("express");

const { generateImage } = require("../services/perchanceService");

const router = express.Router();

router.post("/generate", async (req, res, next) => {
  try {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "prompt is required"
      });
    }

    if (prompt.length > 2000) {
      return res.status(413).json({
        success: false,
        error: "prompt is too long"
      });
    }

    const result = await generateImage({
      prompt,
      negativePrompt:
        typeof req.body?.negativePrompt === "string" ? req.body.negativePrompt.trim() : undefined,
      style: typeof req.body?.style === "string" ? req.body.style.trim() : undefined,
      resolution: typeof req.body?.resolution === "string" ? req.body.resolution.trim() : undefined
    });

    res.json({
      success: true,
      imageUrl: result.imageUrl,
      fileName: result.fileName,
      prompt: result.prompt
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
