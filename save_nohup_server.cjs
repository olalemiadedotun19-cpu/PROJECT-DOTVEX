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
    cell(['# ALL-IN-ONE: Install, download, start server with nohup/screen, test inference\n',
      'import subprocess, sys, os, time, urllib.request, json, signal\n',
      'print("Step 1: Installing dependencies...")\n',
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
      '    print(cmd[-1], "rc:", r.returncode)\n',
      '    if r.returncode != 0:\n',
      '        print("ERR:", r.stderr[-400:])\n',
      '\n',
      'print("Step 2: Downloading model...")\n',
      'from huggingface_hub import hf_hub_download\n',
      'model_path = "/kaggle/working/Qwen3-4B-Q4_K_M.gguf"\n',
      'path = hf_hub_download(\n',
      '    repo_id="Qwen/Qwen3-4B-GGUF",\n',
      '    filename="Qwen3-4B-Q4_K_M.gguf",\n',
      '    local_dir="/kaggle/working"\n',
      ')\n',
      'sz = os.path.getsize(path)\n',
      'print(f"Model: {sz/1024/1024/1024:.2f} GB ({sz} bytes), match: {sz == 2497280256}")\n',
      '\n',
      'print("Step 3: Starting llama.cpp server with nohup...")\n',
      'cmd = [\n',
      '    sys.executable, "-m", "llama_cpp.server",\n',
      '    "--model", model_path,\n',
      '    "--port", "8080",\n',
      '    "--host", "0.0.0.0",\n',
      '    "--n_gpu_layers", "99",\n',
      '    "--n_threads", "8",\n',
      '        "--chat_format", "chatml",\n',
      '        "--api_key", "dotvex-qwen3-gpu-key"\n',
      ']\n',
      'log_file = "/kaggle/working/llama_server.log"\n',
      'with open(log_file, "w") as log:\n',
      '    proc = subprocess.Popen(\n',
      '        cmd,\n',
      '        stdout=log,\n',
      '        stderr=subprocess.STDOUT,\n',
      '        text=True\n',
      '    )\n',
      'print("Server PID:", proc.pid)\n',
      'print("Waiting 90s for model load...")\n',
      'time.sleep(90)\n',
      'poll = proc.poll()\n',
      'print("Server running:", poll is None)\n',
      'if poll is not None:\n',
      '    with open(log_file) as f:\n',
      '        print("SERVER LOG:", f.read()[-3000:])\n',
      'else:\n',
      '    print("Server appears to be running")\n',
      '\n',
      'print("Step 4: Testing inference with retries...")\n',
      'url = "http://127.0.0.1:8080/v1/chat/completions"\n',
      'headers = {"Content-Type": "application/json", "Authorization": "Bearer dotvex-qwen3-gpu-key"}\n',
      'payload = json.dumps({\n',
      '    "model": "Qwen3-4B-Q4_K_M",\n',
      '    "messages": [\n',
      '        {"role": "user", "content": "What GPU are you running on? One short sentence."}\n',
      '    ],\n',
      '    "max_tokens": 80\n',
      '}).encode()\n',
      'for attempt in range(8):\n',
      '    try:\n',
      '        req = urllib.request.Request(url, data=payload, headers=headers)\n',
      '        with urllib.request.urlopen(req, timeout=300) as resp:\n',
      '            result = json.loads(resp.read().decode())\n',
      '            print("=== INFERENCE SUCCESS ===")\n',
      '            print("Model:", result.get("model"))\n',
      '            print("Reply:", result.get("choices", [{}])[0].get("message", {}).get("content", "")[:500])\n',
      '            break\n',
      '    except Exception as e:\n',
      '        print(f"Attempt {attempt+1} failed: {e}")\n',
      '        time.sleep(20)\n',
      'else:\n',
      '    print("All inference attempts failed")\n',
      '    if os.path.exists(log_file):\n',
      '        with open(log_file) as f:\n',
      '            print("SERVER LOG:", f.read()[-3000:])\n'
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
