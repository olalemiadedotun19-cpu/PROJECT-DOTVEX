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
    cell(['# Cell 1: Install ALL dependencies\n',
      'import subprocess, sys, os, time\n',
      'print("Python:", sys.executable, sys.version.split()[0])\n',
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
      '    pkg = cmd[-1]\n',
      '    print(pkg, "rc:", r.returncode)\n',
      '    if r.returncode != 0:\n',
      '        print("ERR:", r.stderr[-400:])\n',
      'print("All dependencies installed.")\n'
    ]),
    cell(['# Cell 2: Download EXACT Qwen3-4B-Q4_K_M.gguf (2.33 GB) from official Qwen HF repo\n',
      'import os, time\n',
      'from huggingface_hub import hf_hub_download\n',
      'model_path = "/kaggle/working/Qwen3-4B-Q4_K_M.gguf"\n',
      'expected_size = 2497280256  # exact bytes\n',
      'if os.path.exists(model_path):\n',
      '    sz = os.path.getsize(model_path)\n',
      '    print(f"Model already exists: {sz/1024/1024/1024:.2f} GB ({sz} bytes)")\n',
      '    print(f"Size match: {sz == expected_size}")\n',
      'else:\n',
      '    print("Downloading Qwen3-4B-Q4_K_M.gguf from Qwen/Qwen3-4B-GGUF...")\n',
      '    t0 = time.time()\n',
      '    path = hf_hub_download(\n',
      '        repo_id="Qwen/Qwen3-4B-GGUF",\n',
      '        filename="Qwen3-4B-Q4_K_M.gguf",\n',
      '        local_dir="/kaggle/working"\n',
      '    )\n',
      '    sz = os.path.getsize(path)\n',
      '    elapsed = time.time() - t0\n',
      '    print(f"Downloaded: {path}")\n',
      '    print(f"Size: {sz/1024/1024/1024:.2f} GB ({sz} bytes)")\n',
      '    print(f"Time: {elapsed:.0f}s, speed: {sz/elapsed/1024/1024:.1f} MB/s")\n',
      '    print(f"Size match: {sz == expected_size} (expected {expected_size})")\n'
    ]),
    cell(['# Cell 3: Start llama.cpp OpenAI-compatible server with CUDA\n',
      'import subprocess, time, os, sys\n',
      'model_path = "/kaggle/working/Qwen3-4B-Q4_K_M.gguf"\n',
      'if not os.path.exists(model_path):\n',
      '    print("ERROR: model file not found at", model_path)\n',
      '    print(os.listdir("/kaggle/working"))\n',
      'else:\n',
      '    cmd = [\n',
      '        sys.executable, "-m", "llama_cpp.server",\n',
      '        "--model", model_path,\n',
      '        "--port", "8080",\n',
      '        "--host", "0.0.0.0",\n',
      '        "--n_gpu_layers", "99",\n',
      '        "--n_threads", "8",\n',
      '        "--chat_format", "qwen3",\n',
      '        "--api_key", "dotvex-qwen3-gpu-key"\n',
      '    ]\n',
      '    print("Starting llama.cpp server:")\n',
      '    print(" ".join(cmd))\n',
      '    proc = subprocess.Popen(\n',
      '        cmd,\n',
      '        stdout=subprocess.PIPE,\n',
      '        stderr=subprocess.STDOUT,\n',
      '        text=True,\n',
      '        bufsize=1\n',
      '    )\n',
      '    print("Server PID:", proc.pid)\n',
      '    time.sleep(20)\n',
      '    poll = proc.poll()\n',
      '    print("Server running:", poll is None)\n',
      '    if poll is not None:\n',
      '        out, _ = proc.communicate(timeout=10)\n',
      '        print("SERVER EXITED:", out[-3000:])\n'
    ]),
    cell(['# Cell 4: Test local /v1/chat/completions endpoint\n',
      'import urllib.request, json\n',
      'url = "http://127.0.0.1:8080/v1/chat/completions"\n',
      'payload = json.dumps({\n',
      '    "model": "Qwen3-4B-Q4_K_M",\n',
      '    "messages": [\n',
      '        {"role": "user", "content": "What GPU are you running on? Reply in one short sentence."}\n',
      '    ],\n',
      '    "max_tokens": 80\n',
      '}).encode()\n',
      'req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json", "Authorization": "Bearer dotvex-qwen3-gpu-key"})\n',
      'try:\n',
      '    with urllib.request.urlopen(req, timeout=300) as resp:\n',
      '        result = json.loads(resp.read().decode())\n',
      '        print("=== INFERENCE SUCCESS ===")\n',
      '        print("Model:", result.get("model"))\n',
      '        print("Reply:", result.get("choices", [{}])[0].get("message", {}).get("content", "")[:500])\n',
      '        print("Full keys:", list(result.keys()))\n',
      'except Exception as e:\n',
      '    print("INFERENCE FAILED:", e)\n'
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
