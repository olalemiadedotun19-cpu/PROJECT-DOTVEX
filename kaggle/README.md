# Kaggle GPU Inference Setup for DOTVEX

This directory contains everything needed to run Qwen3-4B GGUF inference on Kaggle's free GPU notebooks, exposing it as an OpenAI-compatible HTTP API that the local DOTVEX backend can connect to.

## Architecture

```
My PC (DOTVEX backend)
  ↓ HTTP (via Cloudflare Tunnel)
Internet
  ↓
Kaggle Notebook (llama.cpp server + cloudflared tunnel)
  ↓
NVIDIA GPU (P100 / T4 / L4)
  ↓
Qwen3-4B-Q4_K_M.gguf
```

## What This Is NOT

- This is NOT the production deployment. It is a temporary GPU inference path.
- This does NOT move the DOTVEX backend, SQLite, memories, or frontend to Kaggle.
- This is NOT a permanent hosting solution. Kaggle notebooks expire after 30 days of inactivity.

## Prerequisites

1. A Kaggle account
2. A Kaggle Notebook with:
   - **Accelerator:** GPU (T4, P100, or L4 — select the most powerful available)
   - **Internet:** Enabled
   - **Persistance:** Enabled (keeps installed packages and downloaded files across sessions)

## Quick Start

### Step 1: Create a new Kaggle Notebook

1. Go to https://kaggle.com/code
2. Click "New Notebook"
3. Click the "Settings" (gear) tab
4. Set **Accelerator** to GPU
5. Set **Internet** to "On"
6. Set **Persistance** to "Enabled"

### Step 2: Run the setup

In a notebook cell, paste:

```python
!curl -sL https://raw.githubusercontent.com/dotvex/dotvex/main/kaggle/setup.sh | bash
```

Or copy and paste the cells from `kaggle_notebook.py`.

### Step 3: Start the inference server

```python
%run kaggle_notebook.py
start_server()
```

### Step 4: Get the public URL

```python
print(get_tunnel_url())
```

Copy the URL (e.g., `https://abc123xyz.trycloudflare.com`).

### Step 5: Configure DOTVEX

On your PC, update `.env.production`:

```bash
QWEN3_INFERENCE_MODE=remote
QWEN3_REMOTE_URL=https://abc123xyz.trycloudflare.com
QWEN3_REMOTE_API_KEY=<empty-for-now>
```

Then restart the DOTVEX backend:

```bash
npm start
```

### Step 6: Verify

```bash
curl -H "X-API-Key: your-key" http://localhost:3000/api/health
# Should show: "provider": "Qwen3", "modelAvailable": true
```

## Networking Notes

Kaggle notebooks do NOT expose ports publicly by default. This setup uses **cloudflared** (Cloudflare Tunnel) to create an outbound-only tunnel that exposes the llama.cpp server's port as a temporary public URL via `*.trycloudflare.com`.

- The tunnel is managed by the Kaggle notebook process
- The URL changes each time the notebook restarts
- The URL is publicly accessible (no auth by default on the llama.cpp server)
- **Keep the URL private** — do not share it publicly
- For better security, set `INFERENCE_API_KEY` as a Kaggle secret and configure the llama.cpp server to require it

## Security

- The llama.cpp server has NO authentication by default
- The cloudflared tunnel URL is random and not easily guessable
- For additional security, you can set an API key: `!export LLAMA_API_KEY=your-secret-key`
- Never commit actual secrets to this repository
