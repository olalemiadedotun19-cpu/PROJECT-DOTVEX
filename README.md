# DOTVEX 2.0

Production-grade conversational AI assistant created by **Dotman** (Olalemi Michael Adedotun).

## Overview

DOTVEX is built with a clean separation between the frontend (approved ChatGPT-style UI) and the backend API. The backend uses a provider abstraction layer so that Qwen3 can be connected either locally or via a remote GPU server without changing the rest of the application.

## Current State

- **Frontend**: Fully functional ChatGPT-style interface built with React, TypeScript, Tailwind CSS, and Framer Motion.
- **Backend**: Express server with modular structure (`backend/` directory).
- **API**: `GET /api/health` and `POST /api/chat` endpoints are available.
- **AI Provider**: Qwen3-4B-Q4_K_M is integrated locally via `node-llama-cpp` and is active.
- **Identity**: DOTVEX identity (created by Dotman / Olalemi Michael Adedotun) is enforced server-side via system prompt injection. The model never identifies as Qwen.

## Run Locally

**Prerequisites**: Node.js v20+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment template:
   ```bash
   cp .env.example .env
   ```

3. Place the Qwen3 GGUF model in the project root (or set `QWEN3_MODEL_PATH` in `.env`):
   ```
   Qwen3-4B-Q4_K_M.gguf
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

The server starts on port 3000 by default. The frontend is served automatically via Vite middleware.

## Build for Production

```bash
npm run build
npm start
```

## Deploy with Docker

```bash
docker build -t dotvex .
docker run -d \
  -p 3000:3000 \
  -v /host/models:/models:ro \
  -v /host/data:/data \
  --env-file .env.production \
  dotvex
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment instructions.

## Project Structure

```
dotvex/
├── server.ts              # Entry point (thin server bootstrap)
├── backend/
│   ├── index.ts           # Express app factory
│   ├── config/            # Environment configuration
│   ├── ai/                # AI provider interface + implementations
│   ├── services/          # AI service layer
│   ├── controllers/       # Request handlers
│   ├── routes/            # API router
│   ├── middleware/        # Error handling
│   └── types/             # API type definitions
├── src/                   # React frontend
│   ├── components/        # UI components (approved design)
│   ├── services/          # Frontend API client + persistence
│   └── types/             # Frontend type definitions
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Environment Variables

| Variable                 | Description                                      | Default                        |
|--------------------------|--------------------------------------------------|--------------------------------|
| `PORT`                   | Server listen port                               | `3000`                         |
| `HOST`                   | Server listen host                               | `0.0.0.0`                      |
| `APP_URL`                | Application URL                                  | `http://localhost:3000`        |
| `NODE_ENV`               | Node environment (`development`/`production`)    | `development`                  |
| `QWEN3_MODEL_PATH`       | Path to the Qwen3 GGUF model file                | `./Qwen3-4B-Q4_K_M.gguf`       |
| `QWEN_MODEL_PATH`        | Alias for `QWEN3_MODEL_PATH`                     | *(fallback)*                   |
| `QWEN3_CONTEXT_SIZE`     | Model context size (tokens)                      | `2048`                         |
| `QWEN3_MAX_TOKENS`       | Max generation tokens                            | `4096`                         |
| `GENERATION_TIMEOUT_MS`  | Max time (ms) to wait for model generation       | `900000`                       |
| `DOTVEX_DATA_DIR`        | Directory for server-side data                   | `./data`                       |
| `DATABASE_PATH`          | SQLite database file path                        | `./data/dotvex.db`             |
| `MEMORY_RETRIEVAL_LIMIT` | Max memories retrieved per chat                  | `5`                            |
| `CORS_ORIGIN`            | Allowed CORS origins (comma-separated)           | `*` (dev only)                 |
| `LOG_LEVEL`              | Logging level (`debug`/`info`/`warn`/`error`)    | `info`                         |
| `QWEN3_GPU_ENABLED`      | Enable GPU acceleration                          | `false`                        |
| `QWEN3_GPU_TYPE`         | GPU backend (`cuda`/`metal`/`vulkan`)            | auto                           |
| `QWEN3_GPU_LAYERS`       | GPU layers to offload                            | max                            |
| `API_KEY`                | API key for authentication                       | *(none — dev only)*            |
| `VITE_API_BASE_URL`      | Frontend API base URL                            | `/api`                         |
| `VITE_API_KEY`           | Frontend API key (build-time)                    | *(none)*                       |

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment instructions.

## Type Check & Lint

```bash
npm run lint
```

## Tests

```bash
npm test
```

## API Endpoints

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full API reference.

- `GET /api/health` — Health check
- `POST /api/chat` — Chat with DOTVEX
- `GET /api/conversations` — List conversations
- `POST /api/conversations` — Create conversation
- `GET /api/conversations/:id/messages` — Get messages
- `GET /api/memories` — List memories
- `POST /api/memories` — Create memory
- `GET /api/user-understanding` — User profile
- `GET /api/communication-style` — Communication style
- `GET /api/preferences` — User preferences
- `GET /api/learning-events` — Learning event log
