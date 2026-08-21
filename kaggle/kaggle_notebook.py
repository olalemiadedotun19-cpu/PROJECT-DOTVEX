"""
Kaggle Notebook for DOTVEX GPU Inference
==========================================

This notebook sets up Qwen3-4B GGUF inference on a Kaggle GPU notebook
and exposes it as an OpenAI-compatible HTTP API via a Cloudflare Tunnel.

Instructions:
1. Create a new Kaggle Notebook
2. Enable GPU (T4/P100/L4), Internet, and Persistence
3. Run each cell below in order
4. After the server starts, copy the tunnel URL
5. Configure your local DOTVEX backend with:
   QWEN3_INFERENCE_MODE=remote
   QWEN3_REMOTE_URL=<tunnel-url>
"""

import subprocess
import os
import time
import threading
import json
import re
import signal
import socket

# --- Configuration ---
# You can override these in a cell before running:
MODEL_REPO_ID = os.environ.get("MODEL_REPO_ID", "Qwen/Qwen3-4B-GGUF")
MODEL_FILENAME = os.environ.get("MODEL_FILENAME", "qwen3-4b-q4_k_m.gguf")
MODEL_LOCAL_PATH = f"/kaggle/working/models/{MODEL_FILENAME}"
SERVER_PORT = 8000
NGPU_LAYERS = 99
CONTEXT_SIZE = 2048
N_PREDICT = 2048

def run(cmd, check=True, capture=False):
    """Run a shell command."""
    print(f"$ {cmd}")
    result = subprocess.run(
        cmd, shell=True, capture_output=capture, text=True
    )
    if check and result.returncode != 0:
        if capture:
            print(f"STDERR: {result.stderr}")
        raise RuntimeError(f"Command failed: {cmd}")
    return result


def install_llamacpp_cuda():
    """Install llama-cpp-python with CUDA support."""
    print("=" * 60)
    print("[1/5] Installing llama-cpp-python with CUDA support")
    print("=" * 60)

    # Try pre-built CUDA wheels first (fast), fall back to source compilation
    cuda_tags = ["cu124", "cu123", "cu122", "cu121"]

    for tag in cuda_tags:
        print(f"  Trying pre-built wheel: {tag}...")
        result = run(
            f"pip install --no-cache-dir llama-cpp-python[server] "
            f"--extra-index-url https://abetlen.github.io/llama-cpp-python/whl/{tag}",
            check=False, capture=True
        )
        if result.returncode == 0:
            print(f"  ✓ Installed with {tag} wheel")
            return True

    # Fall back to source compilation with CUDA
    print("  Pre-built wheels failed. Compiling from source with CUDA...")
    env = os.environ.copy()
    env["CMAKE_ARGS"] = "-DGGML_CUDA=on"
    env["FORCE_CMAKE"] = "1"
    result = run(
        "pip install --no-cache-dir --force-reinstall llama-cpp-python[server]",
        check=False, capture=True, env=env
    )
    if result.returncode == 0:
        print("  ✓ Compiled from source with CUDA")
        return True

    # Final fallback: CPU-only (still works, just slower)
    print("  CUDA build failed. Installing CPU-only version as fallback...")
    result = run(
        "pip install --no-cache-dir llama-cpp-python[server]",
        check=False, capture=True
    )
    return result.returncode == 0


def verify_gpu():
    """Verify CUDA and GPU are available."""
    print("\n" + "=" * 60)
    print("[2/5] Verifying GPU and CUDA")
    print("=" * 60)

    # Check nvidia-smi
    result = run("nvidia-smi --query-gpu=name,memory.total,memory.used,driver_version --format=csv,noheader", check=False, capture=True)
    if result.returncode == 0:
        print(f"  GPU: {result.stdout.strip()}")
    else:
        print("  WARNING: nvidia-smi not available. Running on CPU only.")

    # Check llama-cpp-python GPU detection
    result = run(
        "python3 -c \""
        "from llama_cpp import Llama, __version__;"
        "print(f'llama-cpp-python: {__version__}');"
        "import ctypes;"
        "try:;"
        "    lib = ctypes.CDLL('libllama.so');"
        "    print('libllama loaded');"
        "except Exception as e:;"
        "    print(f'libllama load: {e}')"
        "\"",
        check=False, capture=True
    )
    print(f"  {result.stdout.strip()}")

    return result.returncode == 0


def download_model():
    """Download Qwen3-4B GGUF model from HuggingFace."""
    print("\n" + "=" * 60)
    print("[3/5] Downloading Qwen3-4B-Q4_K_M.gguf")
    print("=" * 60)

    if os.path.exists(MODEL_LOCAL_PATH):
        size_mb = os.path.getsize(MODEL_LOCAL_PATH) / 1024 / 1024
        print(f"  ✓ Model already exists: {MODEL_LOCAL_PATH} ({size_mb:.1f} MB)")
        return True

    os.makedirs(os.path.dirname(MODEL_LOCAL_PATH), exist_ok=True)

    result = run(
        f"python3 -c \""
        "from huggingface_hub import hf_hub_download;"
        f"path = hf_hub_download(repo_id='{MODEL_REPO_ID}', filename='{MODEL_FILENAME}', "
        f"local_dir='/kaggle/working/models', local_dir_use_symlinks=False);"
        f"import os; print(f'Model downloaded: {{path}}'); print(f'Size: {{os.path.getsize(path) / 1024 / 1024:.1f}} MB')"
        "\"",
        check=False, capture=True
    )
    print(f"  {result.stdout.strip()}")
    return os.path.exists(MODEL_LOCAL_PATH)


def install_cloudflared():
    """Install cloudflared for tunneling."""
    print("\n" + "=" * 60)
    print("[4/5] Installing cloudflared tunnel")
    print("=" * 60)

    result = run("which cloudflared", check=False, capture=True)
    if result.returncode == 0:
        print("  ✓ cloudflared already installed")
        return True

    run("curl -L -o /usr/bin/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64")
    run("chmod +x /usr/bin/cloudflared")
    print("  ✓ cloudflared installed")
    return True


class LlamaCppServer:
    """Manages the llama.cpp server process."""

    def __init__(self):
        self.server_process = None
        self.tunnel_process = None
        self.tunnel_url = None

    def start_server(self):
        """Start the llama.cpp server with GPU acceleration."""
        print("\n" + "=" * 60)
        print("[5/5] Starting llama.cpp server")
        print("=" * 60)

        cmd = [
            "python3", "-m", "llama_cpp.server",
            "--model", MODEL_LOCAL_PATH,
            "--host", "127.0.0.1",
            "--port", str(SERVER_PORT),
            "--n-gpu-layers", str(NGPU_LAYERS),
            "--context-size", str(CONTEXT_SIZE),
            "--n-predict", str(N_PREDICT),
            "--cache", "/kaggle/working/llama_cache",
            "--threads", "4",
        ]

        print(f"  Command: {' '.join(cmd)}")
        print(f"  Model: {MODEL_LOCAL_PATH}")
        print(f"  GPU layers: {NGPU_LAYERS}")
        print(f"  Context: {CONTEXT_SIZE}")
        print(f"  Port: {SERVER_PORT}")
        print(f"  Waiting for server to start...")

        self.server_process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )

        # Wait for server to be ready
        import time
        for _ in range(60):
            time.sleep(2)
            try:
                import urllib.request
                resp = urllib.request.urlopen(f"http://127.0.0.1:{SERVER_PORT}/health", timeout=2)
                if resp.status == 200:
                    print("  ✓ llama.cpp server is ready!")
                    break
            except Exception:
                continue
        else:
            print("  WARNING: Server may not be ready. Check logs.")

        # Print server output (non-blocking)
        def read_output():
            if self.server_process and self.server_process.stdout:
                for line in self.server_process.stdout:
                    print(f"  [server] {line.rstrip()}")

        threading.Thread(target=read_output, daemon=True).start()

    def start_tunnel(self):
        """Start a cloudflared tunnel to expose the server."""
        print("\n" + "=" * 60)
        print("Starting Cloudflare Tunnel")
        print("=" * 60)

        cmd = [
            "/usr/bin/cloudflared",
            "tunnel",
            "--url", f"http://127.0.0.1:{SERVER_PORT}",
            "--hostname", "",  # random subdomain
        ]

        print(f"  Starting tunnel to http://127.0.0.1:{SERVER_PORT}...")

        self.tunnel_process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        # Wait for tunnel URL
        import time
        for _ in range(15):
            time.sleep(2)
            try:
                resp = self.tunnel_process.stderr.readline()
                if "trycloudflare.com" in resp:
                    match = re.search(r'https://[^\s]+\.trycloudflare\.com', resp)
                    if match:
                        self.tunnel_url = match.group(0)
                        print(f"  ✓ Tunnel URL: {self.tunnel_url}")
                        break
            except Exception:
                pass

        def read_tunnel_output():
            if self.tunnel_process and self.tunnel_process.stderr:
                for line in self.tunnel_process.stderr:
                    print(f"  [tunnel] {line.rstrip()}")

        threading.Thread(target=read_tunnel_output, daemon=True).start()

    def get_tunnel_url(self):
        """Return the public tunnel URL."""
        if self.tunnel_url:
            return self.tunnel_url
        raise RuntimeError("Tunnel not started. Call start_tunnel() first.")

    def stop(self):
        """Stop server and tunnel."""
        if self.server_process:
            self.server_process.terminate()
            print("  Server stopped")
        if self.tunnel_process:
            self.tunnel_process.terminate()
            print("  Tunnel stopped")


# Global server instance
_server = None


def setup():
    """Run the full setup: install, verify GPU, download model, install tunnel."""
    install_llamacpp_cuda()
    verify_gpu()
    download_model()
    install_cloudflared()


def start_server():
    """Start the llama.cpp server and cloudflared tunnel."""
    global _server
    if _server is None:
        _server = LlamaCppServer()
        _server.start_server()
        _server.start_tunnel()
    return _server.get_tunnel_url()


def get_tunnel_url():
    """Get the public tunnel URL."""
    global _server
    if _server:
        return _server.get_tunnel_url()
    return "Server not started. Call start_server() first."


def test_api():
    """Test the inference API with a simple request."""
    import urllib.request

    try:
        data = json.dumps({
            "model": "Qwen3-4B",
            "messages": [{"role": "user", "content": "Hello DOTVEX! What is 2+2?"}],
            "max_tokens": 64,
            "temperature": 0.7,
        }).encode()

        resp = urllib.request.urlopen(
            f"http://127.0.0.1:{SERVER_PORT}/v1/chat/completions",
            data=data,
            timeout=30,
            headers={"Content-Type": "application/json"},
        )
        result = json.loads(resp.read())
        print(json.dumps(result, indent=2))
        return result
    except Exception as e:
        print(f"Test failed: {e}")
        return None


def stop_server():
    """Stop the server and tunnel."""
    global _server
    if _server:
        _server.stop()
        _server = None


if __name__ == "__main__":
    print(__doc__)
    setup()
    url = start_server()
    print(f"\nTunnel URL: {url}")
    print("Configure your DOTVEX backend with:")
    print(f"  QWEN3_INFERENCE_MODE=remote")
    print(f"  QWEN3_REMOTE_URL={url}")
