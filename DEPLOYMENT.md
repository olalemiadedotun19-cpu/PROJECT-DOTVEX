# DOTVEX Deployment Guide

## 1. Architecture Overview

### Development Architecture
```
Browser (localhost:5173)
  → Vite Dev Server (HMR + proxy)
  → Express Server (tsx server.ts, port 3000)
  → Qwen3 (node-llama-cpp, local CPU)
  → SQLite (data/dotvex.db, local file)
```

### Production Architecture
```
Browser / Android App
  → HTTPS
  → DOTVEX API Server (Node.js + Express, port PORT)
  → Qwen3 (node-llama-cpp, local or remote GPU)
  → SQLite (persistent data/dotvex.db)
```

### Target Architecture (Future GPU Server)
```
Android App
  → HTTPS
  → DOTVEX API (public HTTPS endpoint)
  → Qwen3 GPU Server (remote GPU with model on persistent storage)
  → SQLite (persistent storage on API server)
```

## 2. Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server listen port | `3000` | No |
| `HOST` | Server bind address | `0.0.0.0` | No |
| `NODE_ENV` | Node environment | `development` | No |
| `APP_URL` | Application URL | `http://localhost:3000` | No |
| `QWEN3_MODEL_PATH` | Path to GGUF model | `./Qwen3-4B-Q4_K_M.gguf` | Yes* |
| `QWEN3_CONTEXT_SIZE` | Model context size (tokens) | `2048` | No |
| `QWEN3_MAX_TOKENS` | Max generation tokens | `4096` | No |
| `GENERATION_TIMEOUT_MS` | Model timeout (ms) | `900000` | No |
| `DATABASE_PATH` | SQLite database file path | `./data/dotvex.db` | No |
| `DOTVEX_DATA_DIR` | Data directory (fallback) | `./data` | No |
| `MEMORY_RETRIEVAL_LIMIT` | Max memories per chat | `5` | No |
| `CORS_ORIGIN` | Allowed CORS origins (comma-sep) | `*` | Yes for prod |
| `LOG_LEVEL` | Logging level | `info` | No |
| `QWEN3_GPU_ENABLED` | Enable GPU acceleration | `false` | No |
| `QWEN3_GPU_TYPE` | GPU backend type (`cuda`/`metal`/`vulkan`) | auto | No |
| `QWEN3_GPU_LAYERS` | Layers to offload to GPU | max | No |
| `API_KEY` | API key for authentication | none | Yes for prod |

*QWEN3_MODEL_PATH is required for production. The model file must exist at the specified path.

*QWEN3_MODEL_PATH is required for production. The model file must exist at the specified path.

**Note:** `QWEN_MODEL_PATH` is also accepted as a fallback alias for `QWEN3_MODEL_PATH`.

## 3. Building the Frontend

```bash
npm install
npm run build
```

This produces:
- `dist/index.html` — SPA entry point
- `dist/assets/` — CSS and JS bundles

## 4. Building the Backend

```bash
npm run build
```

This produces:
- `dist/server.cjs` — Bundled Express server (esbuild)

## 5. Starting the Backend

### Development
```bash
npm run dev
# Server starts on http://localhost:3000
# Vite HMR is enabled for frontend development
```

### Production
```bash
npm run build
npm start
# OR:
npm run start:prod
# Server starts on http://0.0.0.0:<PORT>
```

### With Environment Variables
```bash
export NODE_ENV=production
export PORT=8080
export QWEN3_MODEL_PATH=/models/Qwen3-4B-Q4_K_M.gguf
export DATABASE_PATH=/data/dotvex.db
export CORS_ORIGIN=https://your-domain.com
npm start
```

## 6. Qwen3 Model Placement

**DO NOT commit the GGUF model file to Git.**

The model file should be placed on the server's persistent storage:

```
/models/Qwen3-4B-Q4_K_M.gguf
```

Set the path in your environment:
```bash
export QWEN3_MODEL_PATH=/models/Qwen3-4B-Q4_K_M.gguf
```

### GPU Server Deployment

When deploying Qwen3 on a remote GPU server:
1. Copy the GGUF model to `/models/Qwen3-4B-Q4_K_M.gguf` on the GPU server
2. The `Qwen3Provider` loads the model from the configured path
3. Install the CUDA-enabled node-llama-cpp build **on the GPU server**:

   ```bash
   # For NVIDIA CUDA (v3.20.0):
   export GGML_CUDA=1
   npx node-llama-cpp install --gpu cuda
   ```

   This compiles llama.cpp with CUDA backend support, enabling GPU inference.

   - `GGML_CUDA=1` — NVIDIA CUDA
   - (Apple Metal does not use GGML_METAL env; use `QWEN3_GPU_TYPE=cuda` or platform default)
   - `GGML_ROCM=1` — AMD ROCm (use `QWEN3_GPU_TYPE=vulkan` with Mesa LavaPipe or ROCm backend)

4. Start the server with GPU enabled:
   ```bash
   export QWEN3_GPU_ENABLED=true
   export QWEN3_GPU_TYPE=cuda
   export QWEN3_GPU_LAYERS=999   # all layers on GPU
   npm start
   ```

**node-llama-cpp v3.20.0 build notes:**
- Use `npx node-llama-cpp install --gpu cuda` to build with CUDA support
- Verify with `npx node-llama-cpp inspect gpu`
- The `getLlama({ gpu: 'cuda' })` call selects the CUDA backend at runtime
- When `QWEN3_GPU_ENABLED=false` (default), `getLlama({ gpu: false })` uses CPU-only inference
- Local development defaults to CPU; no GPU required for development

## 7. Persistent Storage

The following data must be on persistent storage:

| Data | Default Path | Purpose |
|------|-------------|---------|
| SQLite database | `data/dotvex.db` | Conversations, messages, memories |
| GGUF model | `Qwen3-4B-Q4_K_M.gguf` | AI model weights |
| Logs | `logs/` | Application logs |

**DO NOT** place persistent data in `/tmp` or ephemeral filesystems.

### Database Persistence

The database is initialized at startup via `initializeDatabase()`. Tables are created with `IF NOT EXISTS` clauses, so existing data is preserved across restarts. No data reset or migration is performed that would delete user data.

## 8. CORS Configuration

CORS is configured via the `CORS_ORIGIN` environment variable:

- **Development (permissive):**
  ```
  CORS_ORIGIN=http://localhost:3000,http://localhost:5173
  ```

- **Production (restrictive):**
  ```
  CORS_ORIGIN=https://your-domain.com,https://app.your-domain.com
  ```

- **Development only (all origins):**
  ```
  CORS_ORIGIN=*
  ```

The backend also sets `credentials: true` on CORS, allowing cookies/auth headers if added in the future.

## 9. Android App Integration

The future Android app communicates via HTTPS to the DOTVEX API:

```
Android App → HTTPS → https://api.your-domain.com/api/chat
                            /api/conversations
                            /api/memories
                            /api/user-understanding
                            /api/health
```

The Android app does **NOT** need:
- The Qwen3 GGUF model (runs server-side)
- node-llama-cpp (runs server-side)
- Direct SQLite access (uses REST API)
- VS Code or any PC software

## 10. GPU Server Requirements

- **Hardware:** GPU with 8GB+ VRAM (CUDA/ROCm/Metal)
- **OS:** Linux (recommended), macOS, or Windows
- **Model:** Qwen3-4B-Q4_K_M.gguf (~2.5 GB)
- **node-llama-cpp:** Built with GPU support enabled
- **Persistent storage:** For model files and database

## 11. Files That Must NOT Be Uploaded to Git

- `.env` (contains secrets, environment-specific config)
- `*.gguf` (multi-GB model files)
- `data/*.db` (user data)
- `node_modules/`
- `dist/`
- `logs/`
- `tmp_test.js`

## 12. Updating Without Deleting the Database

The database is stored at `DATABASE_PATH` (default: `data/dotvex.db`). It is safe to:

1. Stop the server: `SIGTERM` or `kill <pid>`
2. Update the code: `git pull` + `npm install`
3. Rebuild: `npm run build`
4. Restart: `npm start`

The database is preserved across restarts and updates. Schema changes use `CREATE TABLE IF NOT EXISTS` and migration functions that preserve existing data.

## 13. Restarting Safely

```bash
# Graceful shutdown (SIGTERM)
kill <pid>

# The server will:
# 1. Stop accepting new connections
# 2. Close the SQLite database
# 3. Dispose of the Qwen3 provider
# 4. Exit cleanly
```

If the server doesn't stop within 10 seconds, it force-exits.

## 14. Health Check

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "DOTVEX",
  "provider": "Qwen3",
  "modelAvailable": true,
  "database": "connected"
}
```

- `status: "degraded"` if database is disconnected or model is not loaded
- HTTP 503 if the model is not available
- HTTP 200 if everything is healthy

### Health Check with API Key

When `API_KEY` is set, the health endpoint is exempt from authentication (so load balancers can probe it). All other `/api/*` endpoints require `X-API-Key`.

## 16. Authentication

### API Key Authentication

All `/api/*` endpoints are protected by an API key when `API_KEY` is set in the environment.

**Request:**
```bash
curl -H "X-API-Key: YOUR_SECRET_API_KEY_HERE" https://api.your-domain.com/api/health
```

**Unauthenticated response:**
```
HTTP/1.1 401 Unauthorized
{"error":{"code":"UNAUTHORIZED","message":"API key is required."}}
```

### Generating a Secure API Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Store the generated key in your `.env` file:
```bash
API_KEY=<generated-key>
```

### Frontend API Key Configuration

The frontend reads the API key at build time via `VITE_API_KEY`:

```env
# .env (development)
VITE_API_BASE_URL=/api
VITE_API_KEY=local-dev-key-123

# .env.production (production build)
VITE_API_BASE_URL=https://api.your-domain.com
VITE_API_KEY=prod-key-here
```

The key is injected into the build by Vite (env prefix `VITE_`).

### Android API Key Considerations

**IMPORTANT SECURITY LIMITATION:** When the API key is embedded in the Android APK, it is NOT a secret. A determined attacker can extract it. This is acceptable as a **rate-limiting/identification** layer, not a security boundary.

For true user-level security, plan to upgrade to **per-user JWT tokens** in the future. The current `X-API-Key` middleware is designed to be replaceable — it wraps auth in a single function (`conditionalApiKeyAuth`) that can be swapped for JWT verification without changing route handlers.

### Future: JWT Upgrade Path

1. Add `/api/auth/login` endpoint to issue JWTs
2. Replace `conditionalApiKeyAuth` with `jwtAuth` in `backend/index.ts`
3. Update frontend to store and send JWT bearer tokens
4. No changes to existing API route handlers

## 17. HTTPS and Reverse Proxy

### Recommended Production Architecture

```
Internet
   ↓ HTTPS (TLS)
Nginx / Caddy / Cloud Load Balancer
   ↓ HTTP (localhost)
DOTVEX Express backend (port 3000)
```

The Node.js Express server does **not** terminate TLS itself. Use a reverse proxy for TLS termination.

### Nginx Configuration Example

```nginx
server {
    listen 443 ssl http2;
    server_name api.dotvex.ai;

    ssl_certificate /etc/ssl/certs/dotvex.crt;
    ssl_certificate_key /etc/ssl/private/dotvex.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Security headers (also set by Express, but Nginx adds TLS-layer headers)
    add_header Strict-Transport-Security "max-age=31536000" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
    }
}
```

### Caddy Configuration Example

```caddy
api.dotvex.ai {
    reverse_proxy localhost:3000
    encode gzip
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
    }
}
```

### Cloud Load Balancer (AWS ALB / Cloudflare)

For managed HTTPS, point your domain's A record (or CNAME) to your cloud provider's load balancer and terminate TLS there:

```
api.dotvex.ai → Cloud Load Balancer (TLS) → DOTVEX server :3000
```

## 18. Docker Deployment

### CPU Deployment

```bash
# Build CPU image
docker build --target runtime-cpu -t dotvex:cpu .

# Run
docker run -d \
  --name dotvex \
  -p 3000:3000 \
  -v /models:/models:ro \
  -v /data:/data \
  --env-file .env.production \
  dotvex:cpu
```

### GPU Deployment

```bash
# Build GPU image (requires nvidia-docker)
docker build --target runtime-gpu -t dotvex:gpu .

# Run with NVIDIA runtime
docker run -d \
  --name dotvex-gpu \
  --gpus all \
  -p 3000:3000 \
  -v /models:/models:ro \
  -v /data:/data \
  --env-file .env.production \
  dotvex:gpu
```

### Docker Compose (GPU server)

```bash
# Create .env.production with all production env vars
docker-compose --env-file .env.production up -d dotvex-api-gpu
```

## 19. Database Backup Strategy

### Automated Backup

```bash
# Manual backup
npx tsx backend/scripts/backupDatabase.ts

# Scheduled via cron (daily at 2 AM)
0 2 * * * /usr/bin/node /app/dotvex/backend/scripts/backupDatabase.ts

# Or with systemd timer (recommended for production)
```

Backups are stored in `data/backups/` with timestamped filenames:
```
data/backups/
  dotvex-2026-01-15T02-00-00-000Z.db
  dotvex-2026-01-16T02-00-00-000Z.db
  ...
```

### Backup Retention

- Default: 7 days
- Configurable via `BACKUP_RETENTION_DAYS` env var
- Old backups are automatically deleted

### Recovery

```bash
# Stop the server
kill $(lsof -t -i:3000)

# Copy backup to active database
cp data/backups/dotvex-<timestamp>.db data/dotvex.db

# Restart
npm start
```
