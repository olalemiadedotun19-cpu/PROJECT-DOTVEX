const https = require('https');
const fs = require('fs');

const tokens = JSON.parse(fs.readFileSync('C:/Users/USER/.mcp-auth/mcp-remote-0.1.37/47ccabe08d07cd744dec6a0ec36ffe48_tokens.json', 'utf8'));
const accessToken = tokens.access_token;

function call(toolName, args) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: toolName, arguments: args } });
    const req = https.request({
      hostname: 'www.kaggle.com', path: '/mcp', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'Authorization': 'Bearer ' + accessToken, 'Content-Length': Buffer.byteLength(data) }
    }, (response) => {
      let body = '';
      response.on('data', c => body += c);
      response.on('end', () => {
        const lines = body.split('\n');
        for (const l of lines) {
          if (l.startsWith('data: ')) {
            try {
              const j = JSON.parse(l.slice(6));
              if (j.result) { resolve(j.result); return; }
            } catch (e) {}
          }
        }
        resolve({ raw: body });
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    req.write(data); req.end();
  });
}

function cell(src) {
  const source = typeof src === 'string' ? [src] : src;
  return {
    cell_type: 'code',
    execution_count: null,
    metadata: {},
    outputs: [],
    id: Math.random().toString(36).slice(2, 10),
    source: source
  };
}

const notebook = {
  cells: [
    cell(['# SINGLE CELL: Install, download, start server, test, start tunnel\n',
      'import subprocess, sys, os, time, urllib.request, json, signal, re\n',
      'print("=" * 60)\n',
      'print("DOTVEX Qwen3 GPU Deployment - Single Shot")\n',
      'print("=" * 60)\n',
      '\n',
      '# Step 1: Install dependencies\n',
      'print("\\n[1/5] Installing dependencies...")\n',
      'cmds = [\n',
      '    [sys.executable, "-m", "pip", "install", "--quiet", "-U", "huggingface_hub"],\n',
      '    [sys.executable, "-m", "pip", "install", "--quiet", "--no-cache-dir",\n',
      '     "llama-cpp-python",\n',
      '     "--extra-index-url", "https://abetlen.github.io/llama-cpp-python/whl/cu128"],\n',
      '    [sys.executable, "-m", "pip", "install", "--quiet",\n',
      '     "starlette-context", "fastapi", "uvicorn", "pydantic-settings"]\n',
      ']\n',
      'for cmd in cmds:\n',
      '    r = subprocess.run(cmd, capture_output=True, text=True)\n',
      '    print(f"  {cmd[-1]}: rc={r.returncode}")\n',
      '\n',
      '# Step 2: Download model\n',
      'print("\\n[2/5] Downloading Qwen3-4B-Q4_K_M.gguf...")\n',
      'from huggingface_hub import hf_hub_download\n',
      'model_path = "/kaggle/working/Qwen3-4B-Q4_K_M.gguf"\n',
      'if os.path.exists(model_path) and os.path.getsize(model_path) == 2497280256:\n',
      '    print(f"  Model already exists: 2.33 GB")\n',
      'else:\n',
      '    path = hf_hub_download(\n',
      '        repo_id="Qwen/Qwen3-4B-GGUF",\n',
      '        filename="Qwen3-4B-Q4_K_M.gguf",\n',
      '        local_dir="/kaggle/working"\n',
      '    )\n',
      '    print(f"  Downloaded: {os.path.getsize(path)/1024/1024/1024:.2f} GB")\n',
      '\n',
      '# Step 3: Start llama.cpp server\n',
      'print("\\n[3/5] Starting llama.cpp server...")\n',
      'cmd = [\n',
      '    sys.executable, "-m", "llama_cpp.server",\n',
      '    "--model", model_path,\n',
      '    "--port", "8080",\n',
      '    "--host", "0.0.0.0",\n',
      '    "--n_gpu_layers", "99",\n',
      '    "--n_threads", "8",\n',
      '    "--chat_format", "chatml",\n',
      '    "--api_key", "dotvex-qwen3-gpu-key"\n',
      ']\n',
      'log_file = "/kaggle/working/llama_server.log"\n',
      'with open(log_file, "w") as log:\n',
      '    server_proc = subprocess.Popen(cmd, stdout=log, stderr=subprocess.STDOUT, text=True)\n',
      'print(f"  Server PID: {server_proc.pid}")\n',
      'print("  Waiting 90s for model to load into GPU VRAM...")\n',
      'time.sleep(90)\n',
      'poll = server_proc.poll()\n',
      'print(f"  Server running: {poll is None}")\n',
      'if poll is not None:\n',
      '    with open(log_file) as f:\n',
      '        print("  SERVER ERROR:", f.read()[-2000:])\n',
      '    sys.exit(1)\n',
      '\n',
      '# Step 4: Test inference locally\n',
      'print("\\n[4/5] Testing local inference...")\n',
      'url = "http://127.0.0.1:8080/v1/chat/completions"\n',
      'headers = {"Content-Type": "application/json", "Authorization": "Bearer dotvex-qwen3-gpu-key"}\n',
      'payload = json.dumps({\n',
      '    "model": "Qwen3-4B-Q4_K_M",\n',
      '    "messages": [{"role": "user", "content": "What GPU are you running on? One short sentence."}],\n',
      '    "max_tokens": 80\n',
      '}).encode()\n',
      'inference_ok = False\n',
      'for attempt in range(10):\n',
      '    try:\n',
      '        req = urllib.request.Request(url, data=payload, headers=headers)\n',
      '        with urllib.request.urlopen(req, timeout=300) as resp:\n',
      '            result = json.loads(resp.read().decode())\n',
      '            print(f"  Attempt {attempt+1}: SUCCESS")\n',
      '            print(f"  Model: {result.get(\'model\')}")\n',
      '            print(f"  Reply: {result.get(\"choices\", [{}])[0].get(\"message\", {}).get(\"content\", \"\")[:300]}")\n',
      '            inference_ok = True\n',
      '            break\n',
      '    except Exception as e:\n',
      '        print(f"  Attempt {attempt+1}: {e}")\n',
      '        time.sleep(20)\n',
      '\n',
      'if not inference_ok:\n',
      '    print("  INFERENCE FAILED")\n',
      '    with open(log_file) as f:\n',
      '        print("  SERVER LOG:", f.read()[-2000:])\n',
      '    sys.exit(1)\n',
      '\n',
      '# Step 5: Start Cloudflare tunnel\n',
      'print("\\n[5/5] Starting Cloudflare tunnel...")\n',
      'cloudflared = "/kaggle/working/cloudflared"\n',
      'if not os.path.exists(cloudflared):\n',
      '    r = subprocess.run(["curl", "-L", "-o", cloudflared,\n',
      '        "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"],\n',
      '        capture_output=True, text=True)\n',
      '    subprocess.run(["chmod", "+x", cloudflared], capture_output=True)\n',
      '\n',
      'tunnel_log = "/kaggle/working/tunnel.log"\n',
      'with open(tunnel_log, "w") as log:\n',
      '    tunnel_proc = subprocess.Popen(\n',
      '        [cloudflared, "tunnel", "--url", "http://127.0.0.1:8080", "--no-autoupdate"],\n',
      '        stdout=log, stderr=subprocess.STDOUT, text=True\n',
      '    )\n',
      'print(f"  Tunnel PID: {tunnel_proc.pid}")\n',
      'print("  Waiting 20s for tunnel URL...")\n',
      'time.sleep(20)\n',
      '\n',
      'tunnel_url = None\n',
      'if os.path.exists(tunnel_log):\n',
      '    with open(tunnel_log) as f:\n',
      '        content = f.read()\n',
      '    urls = re.findall(r"https://[a-zA-Z0-9-]+\.trycloudflare\\.com", content)\n',
      '    if urls:\n',
      '        tunnel_url = urls[-1]\n',
      '        print(f"  TUNNEL URL: {tunnel_url}")\n',
      '        with open("/kaggle/working/tunnel_url.txt", "w") as f:\n',
      '            f.write(tunnel_url)\n',
      '\n',
      'print("\\n" + "=" * 60)\n',
      'print("DEPLOYMENT COMPLETE")\n',
      'print("=" * 60)\n',
      'print(f"Server: http://127.0.0.1:8080")\n',
      'print(f"Tunnel: {tunnel_url or \'checking...\'}")\n',
      'print(f"Model: Qwen3-4B-Q4_K_M (2.33 GB)")\n',
      'print(f"API Key: dotvex-qwen3-gpu-key")\n',
      'print("=" * 60)\n',
      '\n',
      '# Keep processes alive\n',
      'print("\\nKeeping server and tunnel alive...")\n',
      'try:\n',
      '    while True:\n',
      '        time.sleep(30)\n',
      '        srv = server_proc.poll()\n',
      '        tun = tunnel_proc.poll()\n',
      '        if srv is not None or tun is not None:\n',
      '            print(f"Process died: server={srv}, tunnel={tun}")\n',
      '            break\n',
      'except KeyboardInterrupt:\n',
      '    print("\\nShutting down...")\n',
      '    server_proc.terminate()\n',
      '    tunnel_proc.terminate()\n'
    ])
  ],
  metadata: {
    kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' },
    language_info: { name: 'python', version: '3.12' }
  },
  nbformat: 4,
  nbformat_minor: 5
};

(async () => {
  const r = await call('save_notebook', {
    request: {
      slugNullable: 'olalemiadedotun/dotvex-qwen3-gpu-v2',
      textNullable: JSON.stringify(notebook),
      languageNullable: 'python',
      kernelTypeNullable: 'notebook',
      enableGpuNullable: true,
      machineShapeNullable: 'GPU_T4',
      enableInternetNullable: true,
      isPrivateNullable: true
    }
  });
  console.log('Save:', r && r.content ? r.content[0].text : JSON.stringify(r), 'isError=', r && r.isError);
})();
