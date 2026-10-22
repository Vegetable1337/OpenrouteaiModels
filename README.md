# Aether Chat — AI X and ChatBot

**Локальное AI-приложение с чатами, веб-поиском, генерацией изображений и настраиваемым интерфейсом.**  
**A local AI workspace with chat, web search, image generation, and a customizable interface.**

[Русский](#русский) · [English](#english) · [MIT License](LICENSE)

> **Статус / Status:** проект для локального использования и экспериментов. Некоторые интеграции зависят от сторонних сервисов. / A local-first experimental project; some integrations depend on third-party services.

## Русский

### Возможности

- **AI-чат:** выбор модели OpenRouter или собственный model ID; ответы в режиме потоковой выдачи при прямых запросах.
- **Веб-поиск:** отдельный FastAPI backend получает результаты из локального SearXNG, передаёт контекст модели через OpenRouter и показывает источники в интерфейсе.
- **Генерация изображений:** отдельный Express/Perchance backend создаёт изображения и сохраняет их локально.
- **Проекты и история:** чаты, проекты, вложения и настройки сохраняются в `localStorage` текущего браузера; доступен импорт/экспорт рабочего пространства в JSON.
- **Персонализация:** темы, цвета, системный промпт, память-контекст, шаблоны промптов и настройки моделей.
- **AI X:** отдельный интерфейс с *вымышленной* социальной лентой и диалогами, сгенерированными AI. Это не интеграция с реальной сетью X/Twitter.

### Как устроено приложение

```text
Браузер (React + Vite, :5173)
├── Обычный чат и AI X ────────> OpenRouter API (напрямую из браузера)
├── Чат с веб-поиском ─────────> FastAPI (:8000)
│                                  ├── SearXNG (:8080)
│                                  └── OpenRouter API
└── Генерация изображений ─────> Express (:3001) ──> Perchance
                                     └── generated/ (локальные файлы)
```

**Важно:** прямой чат, поиск и генерация изображений — разные режимы. Для обычного чата ключ OpenRouter вводится в настройках интерфейса. Для режима веб-поиска ключ **дополнительно** нужен в корневом `.env` для Python backend. В frontend включение веб-поиска выполняется вручную; автоматическая эвристика поиска существует в FastAPI API.

### Требования

- **Node.js:** рекомендуется версия 20 LTS или новее (для frontend и Perchance backend).
- **Python:** 3.11+ для ручного запуска FastAPI.
- **Docker + Docker Compose:** для FastAPI/SearXNG в контейнерах (рекомендуемый способ).
- **OpenRouter API key:** для AI-чата и поиска с моделью; доступность и стоимость моделей зависят от OpenRouter.
- Доступ к интернету для OpenRouter, поисковых движков и Perchance.

### Быстрый запуск на Windows

1. Установите Node.js и Docker Desktop, запустите Docker Desktop.
2. Откройте папку проекта и запустите двойным кликом **`START_AETHER.bat`**.
3. Скрипт проверит зависимости, создаст `.env` (если его нет), запросит ключ OpenRouter, установит npm-зависимости и запустит frontend, FastAPI/SearXNG и Perchance backend.
4. Откройте **http://127.0.0.1:5173** (скрипт также пытается открыть страницу автоматически).
5. Для обычного чата откройте **Settings → OpenRouter API Key** и вставьте ключ в интерфейсе. Корневой `.env` **не заполняет** это поле автоматически.

Автозапуск реализован в [`scripts/start-aether.ps1`](scripts/start-aether.ps1). Он открывает отдельные терминалы для frontend и сервиса изображений. Для работы необходим запущенный Docker Engine.

### Ручной запуск (Windows / macOS / Linux)

**1. Создайте конфигурацию в корне.** Скопируйте `.env.example` в `.env`, затем укажите действительный `OPENROUTER_API_KEY` (не публикуйте его):

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

**2. Запустите поиск и Python backend через Docker:**

```bash
docker compose up -d --build
```

**3. Запустите frontend в отдельном терминале:**

```bash
npm ci
npm run dev
```

Frontend: **http://localhost:5173**. В настройках приложения отдельно задайте OpenRouter API key для прямого чата.

**4. При необходимости включите генерацию изображений** в третьем терминале:

```bash
cd perchance-backend
npm ci
# Скопируйте .env.example в .env (как в шаге 1)
npm run dev
```

На Windows используйте `Copy-Item .env.example .env`, на macOS/Linux — `cp .env.example .env`, находясь внутри `perchance-backend`. Сервис запускается на **http://localhost:3001**. В интерфейсе выберите модификатор промпта **«Генерация картинок»**, затем отправьте запрос. Perchance может потребовать ручную проверку в браузере; подробнее — в [документации сервиса изображений](perchance-backend/README.md). Интеграция зависит от неофициального веб-интерфейса Perchance и может перестать работать при его изменении.

**Без Docker для Python backend:** запустите только SearXNG командой `docker compose up -d searxng`, установите Python-зависимости (`pip install -r requirements.txt`), задайте `SEARXNG_URL=http://localhost:8080` в корневом `.env` и запустите `uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload`. По умолчанию Docker Compose передаёт контейнерному backend адрес `http://searxng:8080`; вне Docker требуется `localhost`.

### Адреса и API

| Компонент | Адрес | Назначение |
| --- | --- | --- |
| Frontend | http://localhost:5173 | Интерфейс чата |
| FastAPI | http://localhost:8000/health | Проверка `{"status":"ok"}` |
| FastAPI docs | http://localhost:8000/docs | Интерактивная схема API |
| SearXNG | http://localhost:8080 | Локальный поисковый движок |
| Perchance backend | http://localhost:3001/health | Проверка сервиса изображений |
| Галерея Perchance | http://localhost:3001/ | Локально сохранённые изображения |

| Метод | Маршрут | Описание |
| --- | --- | --- |
| `POST` | `:8000/chat` | `message`, необязательные `history`, `force_search` и `search_limit`; возвращает `answer`, `used_search`, `sources` и `model` |
| `POST` | `:8000/search` | `query` и необязательный `limit` (1–10) |
| `GET` | `:8000/health` | Проверка FastAPI |
| `POST` | `:3001/generate` | `prompt`; необязательные `negativePrompt`, `style`, `resolution` |
| `GET` | `:3001/verify/status` | Статус проверки Perchance |

Пример запроса к backend (PowerShell — `curl.exe` вместо `curl`, если `curl` является алиасом):

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is new in AI?","force_search":true}'
```

Команда использует Unix-переносы строк `\`; в Windows её можно выполнить одной строкой или воспользоваться FastAPI `/docs`.

### Конфигурация

Корневой [`.env.example`](.env.example) описывает параметры Python backend и Docker Compose.

| Переменная | Назначение |
| --- | --- |
| `OPENROUTER_API_KEY` | Ключ OpenRouter для FastAPI, **не** для браузерного чата |
| `OPENROUTER_MODEL` | Модель FastAPI (по умолчанию `openai/gpt-oss-120b:free`) |
| `OPENROUTER_BASE_URL` | URL API OpenRouter |
| `SEARXNG_URL` | Адрес SearXNG (при запуске в Docker переопределяется) |
| `SEARXNG_SECRET_KEY` | Секрет SearXNG в Compose |
| `SEARCH_TOP_K` | Число результатов поиска (по умолчанию 5) |
| `REQUEST_TIMEOUT_SECONDS` / `REQUEST_RETRIES` | Тайм-аут и повторные запросы |
| `CORS_ORIGINS` / `LOG_LEVEL` | Разрешённые origins и логирование |

Для сервиса изображений используются *отдельные* [`perchance-backend/.env.example`](perchance-backend/.env.example) и [инструкции](perchance-backend/README.md).

### Структура проекта

```text
src/app/pages/ChatPage.tsx        Основной интерфейс чата, проектов и AI X
src/app/routes.tsx               Маршруты интерфейса
src/styles/                     Оформление и темы
app/main.py                     FastAPI: /chat, /search, /health
app/llm.py                      Запросы к OpenRouter
app/search.py                   SearXNG и эвристика веб-поиска
app/models.py                   Схемы запросов и ответов
perchance-backend/              Express + Puppeteer + локальная генерация
scripts/start-aether.ps1        Автоматический запуск на Windows
docker-compose.yml              FastAPI + SearXNG
searxng/settings.yml            Настройки поиска
.env.example                    Шаблон переменных окружения
LICENSE                         MIT License
ATTRIBUTIONS.md                 Указание сторонних материалов
```

### Приватность и ограничения

- **Ключ в браузере:** frontend сохраняет `openrouter_api_key` в `localStorage` и отправляет его непосредственно на OpenRouter. `localStorage` не является защищённым хранилищем секретов; не запускайте такой вариант на общедоступном/чужом устройстве и не публикуйте ключи.
- **Резервная копия:** функция **Export workspace** включает API-ключ в JSON наряду с чатами, проектами и настройками. **Не делитесь этим файлом**, пока не удалите из него ключ и личные данные.
- **Локальное хранение:** чаты и проекты находятся в браузере, без синхронизации между устройствами; очистка данных сайта может их удалить. Изображения сервиса Perchance записываются на диск отдельно.
- **Не для открытого интернета:** API и сервис изображений рассчитаны на локальный запуск; до публичного развёртывания требуются дополнительные меры безопасности (аутентификация, управление ключами, ограничения доступа, проверки и тесты).
- **Поиск:** результаты зависят от сторонних поисковиков; ответы AI могут быть неточными. Источники выводятся отдельно, только при использовании поиска.
- **AI X:** публикации и персонажи вымышлены, реального подключения к соцсети нет.
- **Тестирование:** в корневом `package.json` есть команды `npm run dev` и `npm run build`; отдельной команды автоматических тестов пока нет. Для сервиса изображений доступна `npm run check` (проверка синтаксиса JS).

### Устранение проблем

| Симптом | Что проверить |
| --- | --- |
| «No API Key» | Задайте ключ в настройках frontend; одного корневого `.env` недостаточно |
| Ошибка веб-поиска | `docker compose ps`, `docker compose logs backend searxng`, наличие `OPENROUTER_API_KEY` в корневом `.env` |
| Изображение не создаётся | `http://localhost:3001/health`, логи Perchance backend и его [README](perchance-backend/README.md) |
| Порт занят | Освободите порты 5173, 8000, 8080 или 3001; URL backend в frontend сейчас зафиксированы как `localhost` |
| Изменения чатов исчезли | Проверьте браузер/профиль и `localStorage`; используйте Export workspace для резервной копии |

### Лицензия

Код проекта предоставляется по [MIT License](LICENSE). **Copyright (c) 2026 Vegetable1337.** Лицензии сторонних компонентов и материалов см. в [ATTRIBUTIONS.md](ATTRIBUTIONS.md).

---

## English

### Features

- **AI chat:** OpenRouter model picker, custom model IDs, and streaming responses for direct chat.
- **Web-assisted chat:** FastAPI queries local SearXNG and sends retrieved context to OpenRouter; sources appear separately from the response.
- **Image generation:** a separate Express/Perchance service generates images and saves them locally.
- **Projects and history:** chats, projects, attachments, settings, and JSON workspace import/export using browser `localStorage`.
- **Customization:** themes, appearance controls, system prompts, prompt templates, and reusable memory context.
- **AI X:** an AI-generated **fictional** social feed and fictional DMs, not a connection to the real X/Twitter platform.

### Architecture

```text
React / Vite frontend (:5173)
├── Direct chat and AI X ──────> OpenRouter API (browser requests)
├── Web-enabled chat ──────────> FastAPI (:8000) ─> SearXNG (:8080)
│                                    └───────────> OpenRouter API
└── Image generation ──────────> Express (:3001) ─> Perchance
                                    └────────────> local generated/
```

**Two API-key locations:** for direct chat, enter the OpenRouter key under **Settings** in the frontend; for web-assisted chat, configure `OPENROUTER_API_KEY` in the root `.env` as well. These settings are separate. The frontend uses a manual web-search toggle, whereas FastAPI also supports a keyword-based automatic search heuristic when called directly.

### Requirements and installation

Use **Node.js 20 LTS or newer** (recommended), **Python 3.11+** for manual FastAPI execution, and **Docker Desktop / Docker Compose** for the default SearXNG/FastAPI setup. You need an OpenRouter API key for chat, plus internet connectivity for external services.

**Windows one-click setup:** run [`START_AETHER.bat`](START_AETHER.bat). It checks Node/Docker, creates the root `.env` if needed, prompts for your backend OpenRouter key, installs frontend and Perchance dependencies, starts the Docker services and both Node servers, and opens **http://127.0.0.1:5173**. To use direct chat, also enter the key in the frontend Settings.

**Manual setup:**

1. Copy `.env.example` to `.env` in the root directory and set `OPENROUTER_API_KEY`. Use `cp .env.example .env` on macOS/Linux or `Copy-Item .env.example .env` in PowerShell.
2. Start FastAPI and SearXNG: `docker compose up -d --build`.
3. In a separate terminal, run `npm ci` followed by `npm run dev`. Visit **http://localhost:5173**.
4. To enable image generation, open `perchance-backend/`, copy its own `.env.example` to `.env`, then run `npm ci` and `npm run dev`. Visit **http://localhost:3001/health** to confirm it is running.
5. In the chat, select the **«Генерация картинок»** prompt modifier for image requests. The Perchance workflow may require manual browser verification; see [the dedicated image backend guide](perchance-backend/README.md).

**FastAPI without Docker:** keep SearXNG running via `docker compose up -d searxng`, set `SEARXNG_URL=http://localhost:8080` in the root `.env`, install packages with `pip install -r requirements.txt`, and run `uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload`.

### Services and endpoints

| Service | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| FastAPI health / OpenAPI docs | http://localhost:8000/health / http://localhost:8000/docs |
| SearXNG | http://localhost:8080 |
| Image backend health / gallery | http://localhost:3001/health / http://localhost:3001/ |

- **`POST /chat`** on port 8000: `message`, optional `history`, `force_search`, `search_limit`; returns answer, search metadata, sources, and model.
- **`POST /search`** on port 8000: `query` and optional `limit` (1–10).
- **`POST /generate`** on port 3001: `prompt`, optional `negativePrompt`, `style`, and `resolution`.
- **`GET /verify/status`** on port 3001: Perchance verification state.

See [`.env.example`](.env.example) for FastAPI settings, [image service configuration](perchance-backend/.env.example) for image options, and [`docker-compose.yml`](docker-compose.yml) for container networking. The frontend currently uses hard-coded localhost API URLs.

### Security and limitations

- The frontend stores the OpenRouter key in browser `localStorage` and makes direct API calls; this is **not a secure place for shared or production secrets**.
- **Export workspace includes the API key** as well as chats and settings. Treat exported JSON as sensitive and remove secrets before sharing.
- Chats and projects are browser-local, not synchronized. Generated image files are stored locally by the Perchance server.
- This is a local-development project, **not a production-hardened public service**. Add authentication, proper secret handling, access controls and tests before public deployment.
- Perchance integration relies on an unofficial page workflow and may break when Perchance changes. The AI X feed is fictional.
- The root project exposes `npm run dev` and `npm run build`; there is currently no configured root test script. The image backend has `npm run check` for JavaScript syntax validation.

### Troubleshooting

- **Missing API key:** enter it in frontend Settings for direct chat; the root `.env` configures the FastAPI backend only.
- **Search fails:** check `docker compose ps`, `docker compose logs backend searxng` and the backend key.
- **Image generation fails:** check port 3001 and the [Perchance backend README](perchance-backend/README.md).
- **Ports conflict:** ports 5173, 8000, 8080 and 3001 must be available; frontend backend URLs are currently fixed to localhost.
- **Lost browser state:** use Export workspace for backups and avoid clearing browser data without a backup.

### License and credits

Distributed under the [MIT License](LICENSE). **Copyright (c) 2026 Vegetable1337.** See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for third-party attributions.
