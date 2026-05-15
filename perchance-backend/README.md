# Aether Perchance Backend

Express.js service for generating images through the real Perchance image generator workflow.

The service first tries the direct Perchance image-generation endpoint used by the public page:

- `https://image-generation.perchance.org/api/generate`
- `https://image-generation.perchance.org/api/downloadTemporaryImage`

Perchance requires a temporary `userKey`. You can set `PERCHANCE_USER_KEY` in `.env`, or leave it empty. If the key is missing or invalid, the service opens `https://perchance.org/ai-text-to-image-generator` with Puppeteer, extracts a fresh key from the page network traffic, and retries generation.

Generated images are saved locally in `generated/`. A simple generation history is written to `generated/history.jsonl`.

## Structure

```text
perchance-backend/
  package.json
  .env.example
  README.md
  src/
    app.js
    config.js
    server.js
    routes/
      generateRoutes.js
    services/
      perchanceService.js
    utils/
      files.js
      logger.js
      retry.js
```

## Install

```bash
cd perchance-backend
npm install
copy .env.example .env
```

On the first install Puppeteer downloads a compatible browser. That is expected.

## Run

```bash
npm run dev
```

Production-style run:

```bash
npm start
```

The backend starts at:

```text
http://localhost:3001
```

### If Perchance asks for verification

Perchance may protect its image endpoint with Cloudflare/Turnstile. In that case headless automation cannot receive a `userKey` by itself. Run once with a visible browser:

```text
PERCHANCE_HEADLESS=false
```

Then start the backend again:

```bash
npm run dev
```

When the browser opens, pass the Perchance verification. The service stores the browser session in `.perchance-profile`, so later requests can reuse it.

Health check:

```bash
curl http://localhost:3001/health
```

## Generate

```bash
curl -X POST http://localhost:3001/generate ^
  -H "Content-Type: application/json" ^
  -d "{\"prompt\":\"cyberpunk girl\"}"
```

Response:

```json
{
  "success": true,
  "imageUrl": "http://localhost:3001/generated/cyberpunk-girl-uuid.jpeg",
  "fileName": "cyberpunk-girl-uuid.jpeg",
  "prompt": "cyberpunk girl"
}
```

Optional body fields:

```json
{
  "prompt": "cyberpunk girl",
  "negativePrompt": "low quality, blurry",
  "style": "cinematic lighting",
  "resolution": "512x768"
}
```

## Environment

```text
PORT=3001
NODE_ENV=development
PERCHANCE_USER_KEY=
PERCHANCE_CHANNEL=ai-text-to-image-generator
PERCHANCE_SUB_CHANNEL=public
PERCHANCE_STYLE=
PERCHANCE_NEGATIVE_PROMPT=
PERCHANCE_RESOLUTION=512x768
PERCHANCE_GUIDANCE_SCALE=7
REQUEST_TIMEOUT_MS=90000
RETRY_ATTEMPTS=3
RETRY_DELAY_MS=1200
GENERATED_DIR=generated
PUBLIC_BASE_URL=http://localhost:3001
```

## Notes

Perchance does not provide a stable public API contract. This integration is built against the current public page workflow and keeps a Puppeteer extraction fallback for when the temporary key expires or the direct request fails.
