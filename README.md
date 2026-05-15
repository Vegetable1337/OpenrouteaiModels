# Ai X and ChatBot

## One-click Windows start

Double-click:

```text
START_AETHER.bat
```

The script checks Node.js and Docker, creates `.env`, asks for the OpenRouter key if needed, installs npm dependencies, starts SearXNG/FastAPI with Docker, starts the Vite frontend, and opens the app.

Choose language: [Русский](#русский) | [English](#english)

## Русский

### Что это за проект

**Ai X and ChatBot** - это локальный AI-чат с веб-поиском. Интерфейс написан на React/Vite, а локальный backend на FastAPI связывает чат с OpenRouter и SearXNG.

Проект умеет:

- вести диалог с AI-моделью через OpenRouter;
- автоматически или вручную подключать веб-поиск;
- искать данные через локальный SearXNG;
- показывать найденные источники отдельно от ответа модели;
- хранить чаты, проекты, настройки и темы в браузере через `localStorage`;
- работать локально через Docker или частично без Docker.

### Стек

- Frontend: React 18, Vite, Tailwind CSS, lucide-react, react-markdown
- Backend: FastAPI, httpx, Pydantic
- Search: SearXNG
- LLM API: OpenRouter
- Runtime: Node.js, Python 3.11+

### Быстрый запуск

1. Установите зависимости frontend:

```bash
npm i
```

2. Создайте `.env`:

```bash
copy .env.example .env
```

3. Укажите ключ OpenRouter в `.env`:

```text
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

4. Запустите SearXNG и FastAPI:

```bash
docker compose up -d --build
```

5. Запустите frontend:

```bash
npm run dev
```

Если PowerShell блокирует `npm.ps1`, используйте:

```bash
npm.cmd run dev
```

6. Откройте приложение:

```text
http://localhost:5173
```

### Проверка сервисов

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:8000/health`
- SearXNG: `http://localhost:8080`

Backend endpoints:

- `POST http://localhost:8000/search`
- `POST http://localhost:8000/chat`
- `GET http://localhost:8000/health`

### Запуск backend без Docker

Если хотите запускать FastAPI локально, оставьте SearXNG в Docker:

```bash
docker compose up -d searxng
```

Затем запустите backend:

```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Тест поиска

```bash
curl -X POST http://localhost:8000/search ^
  -H "Content-Type: application/json" ^
  -d "{\"query\":\"latest OpenAI news\",\"limit\":5}"
```

### Тест чата с веб-поиском

```bash
curl -X POST http://localhost:8000/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"What are the latest updates in OpenAI models?\",\"force_search\":true}"
```

### Настройки `.env`

```text
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=openai/gpt-oss-120b:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_REFERER=http://localhost:8000
OPENROUTER_TITLE=Aether Local Search Agent

SEARXNG_URL=http://localhost:8080
SEARXNG_SECRET_KEY=replace-with-a-long-random-string

SEARCH_TOP_K=5
REQUEST_TIMEOUT_SECONDS=20
REQUEST_RETRIES=2
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Структура backend

```text
app/
  main.py      FastAPI app and endpoints
  config.py    .env settings
  llm.py       OpenRouter client with retries/timeouts
  search.py    SearXNG client and web-search heuristic
  prompts.py   system/context prompt builders
  models.py    Pydantic request/response models
```

## English

### What This Project Is

**Ai X and ChatBot** is a local AI chat app with web search. The UI is built with React/Vite, while a FastAPI backend connects the chat to OpenRouter and local SearXNG search.

The project can:

- chat with an AI model through OpenRouter;
- enable web search automatically or manually;
- search the web through local SearXNG;
- display sources separately from the model answer;
- store chats, projects, settings, and themes in browser `localStorage`;
- run locally with Docker or with a local FastAPI process.

### Stack

- Frontend: React 18, Vite, Tailwind CSS, lucide-react, react-markdown
- Backend: FastAPI, httpx, Pydantic
- Search: SearXNG
- LLM API: OpenRouter
- Runtime: Node.js, Python 3.11+

### Quick Start

1. Install frontend dependencies:

```bash
npm i
```

2. Create `.env`:

```bash
copy .env.example .env
```

3. Set your OpenRouter API key in `.env`:

```text
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

4. Start SearXNG and FastAPI:

```bash
docker compose up -d --build
```

5. Start the frontend:

```bash
npm run dev
```

If PowerShell blocks `npm.ps1`, use:

```bash
npm.cmd run dev
```

6. Open the app:

```text
http://localhost:5173
```

### Service URLs

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:8000/health`
- SearXNG: `http://localhost:8080`

Backend endpoints:

- `POST http://localhost:8000/search`
- `POST http://localhost:8000/chat`
- `GET http://localhost:8000/health`

### Run Backend Without Docker

If you want to run FastAPI locally, keep SearXNG running in Docker:

```bash
docker compose up -d searxng
```

Then start the backend:

```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Test Search

```bash
curl -X POST http://localhost:8000/search ^
  -H "Content-Type: application/json" ^
  -d "{\"query\":\"latest OpenAI news\",\"limit\":5}"
```

### Test Chat With Web Search

```bash
curl -X POST http://localhost:8000/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"What are the latest updates in OpenAI models?\",\"force_search\":true}"
```

### `.env` Settings

```text
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=openai/gpt-oss-120b:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_REFERER=http://localhost:8000
OPENROUTER_TITLE=Aether Local Search Agent

SEARXNG_URL=http://localhost:8080
SEARXNG_SECRET_KEY=replace-with-a-long-random-string

SEARCH_TOP_K=5
REQUEST_TIMEOUT_SECONDS=20
REQUEST_RETRIES=2
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Backend Structure

```text
app/
  main.py      FastAPI app and endpoints
  config.py    .env settings
  llm.py       OpenRouter client with retries/timeouts
  search.py    SearXNG client and web-search heuristic
  prompts.py   system/context prompt builders
  models.py    Pydantic request/response models
```
