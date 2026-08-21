#!/bin/bash
# DOTVEX Kaggle GPU Inference Setup Script
#
# This script installs the CUDA-enabled llama-cpp-python server
# and cloudflared tunnel on a Kaggle notebook.
#
# Usage in Kaggle notebook:
#   !curl -sL https://raw.githubusercontent.com/dotvex/dotvex/main/kaggle/setup.sh | bash
#
# Or manually paste the following commands into a notebook cell.

set -e

echo "=== DOTVEX Kaggle GPU Setup ==="
echo ""

# --- Check GPU ---
echo "[1/6] Checking GPU availability..."
if command -v nvidia-smi &> /dev/null; then
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
    echo "GPU detected ✓"
else
    echo "WARNING: nvidia-smi not found. GPU mode may not be available."
fi
echo ""

# --- Check CUDA ---
echo "[2/6] Checking CUDA..."
if [ -n "$CUDA_HOME" ]; then
    echo "CUDA_HOME: $CUDA_HOME"
else
    echo "CUDA_HOME not set, searching..."
    if [ -d "/usr/local/cuda" ]; then
        export CUDA_HOME=/usr/local/cuda
        echo "Found CUDA at $CUDA_HOME"
    else
        echo "WARNING: CUDA not found. Will attempt pip wheel installation."
    fi
fi

# Check nvcc
if command -v nvcc &> /dev/null; then
    nvcc --version
    echo "nvcc found ✓"
else
    echo "nvcc not found. Will try pre-built CUDA wheel."
fi
echo ""

# --- Install llama-cpp-python with CUDA ---
echo "[3/6] Installing llama-cpp-python with CUDA support..."

# Kaggle typically has CUDA 12.x. Try pre-built wheel first.
# If that fails, compile from source.
PYTHON_VERSION=$(python3 -c "import sys; print(f'py{sys.version_info.major}.{sys.version_info.minor}')")

# Determine CUDA version for wheel selection
CUDA_VERSION=""
if [ -f "$CUDA_HOME/version.txt" ]; then
    CUDA_VERSION=$(cat "$CUDA_HOME/version.txt" | grep -oP '\d+\.\d+' | head -1 | tr -d '.')
    echo "CUDA version: $CUDA_VERSION"
fi

# Try pre-built CUDA wheel first (fastest)
INSTALL_SUCCESS=false

for CUDA_TAG in cu124 cu123 cu122 cu121; do
    if [ "$INSTALL_SUCCESS" = false ]; then
        echo "Trying pre-built wheel for $CUDA_TAG..."
        if pip install --no-cache-dir "llama-cpp-python[server] --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/$CUDA_TAG" 2>/dev/null; then
            INSTALL_SUCCESS=true
            echo "Installed with $CUDA_TAG wheel ✓"
        fi
    fi
done

# If pre-built wheels failed, compile from source
if [ "$INSTALL_SUCCESS" = false ]; then
    echo "Pre-built wheels failed. Compiling from source..."
    CMAKE_ARGS="-DGGML_CUDA=on" \
    pip install --no-cache-dir --force-reinstall "llama-cpp-python[server]"
    echo "Compiled from source ✓"
fi

echo ""

# --- Verify GPU detection ---
echo "[4/6] Verifying GPU detection in llama-cpp..."
python3 -c "
from llama_cpp import Llama
print('llama-cpp-python version:', llama_cpp.__version__)
" 2>&1 || echo "(GPU detection will be verified at server startup)"
echo ""

# --- Install cloudflared ---
echo "[5/6] Installing cloudflared tunnel..."
ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ]; then
    curl -L -o /usr/bin/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
elif [ "$ARCH" = "aarch64" ]; then
    curl -L -o /usr/bin/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64
fi
chmod +x /usr/bin/cloudflared
echo "cloudflared installed ✓"
echo ""

# --- Download model ---
echo "[6/6] Downloading Qwen3-4B-Q4_K_M.gguf..."
python3 -c "
from huggingface_hub import hf_hub_download
import os

model_path = hf_hub_download(
    repo_id='Qwen/Qwen3-4B-GGUF',
    filename='qwen3-4b-q4_k_m.gguf',
    local_dir='/kaggle/working/models',
    local_dir_use_symlinks=False
)
print(f'Model downloaded: {model_path}')
print(f'Size: {os.path.getsize(model_path) / 1024 / 1024:.1f} MB')
"
echo ""

echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Run: start_server()"
echo "2. Copy the tunnel URL"
echo "3. Set QWEN3_INFERENCE_MODE=remote in your DOTVEX .env"
echo "4. Set QWEN3_REMOTE_URL=<tunnel-url>"
echo "5. Restart DOTVEX backend"
