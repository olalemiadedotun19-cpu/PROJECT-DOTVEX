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
    req.on('error', e => { console.log('ERR', e.message); resolve(null); });
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
    cell(['# Fix 1: Reinstall llama-cpp-python properly and verify server module\n',
      'import subprocess, sys\n',
      'print("Reinstalling llama-cpp-python with CUDA...")\n',
      'r = subprocess.run([sys.executable, "-m", "pip", "install", "--quiet", "--force-reinstall", "--no-cache-dir", "llama-cpp-python", "--extra-index-url", "https://abetlen.github.io/llama-cpp-python/whl/cu128"], capture_output=True, text=True)\n',
      'print("rc:", r.returncode)\n',
      'print((r.stdout or "")[-1000:])\n',
      'print((r.stderr or "")[-1000:])\n',
      'import importlib\n',
      'try:\n',
      '    import llama_cpp\n',
      '    print("llama_cpp version:", llama_cpp.__version__)\n',
      '    from llama_cpp.server import create_server\n',
      '    print("Server module found:", create_server)\n',
      'except Exception as e:\n',
      '    print("Server module error:", e)\n'
    ]),
    cell(['# Fix 2: Download model using huggingface_hub (proper auth/redirect handling)\n',
      'import os, subprocess, sys\n',
      'model_dir = "/kaggle/working"\n',
      'os.makedirs(model_dir, exist_ok=True)\n',
      'print("Installing huggingface_hub...")\n',
      'r = subprocess.run([sys.executable, "-m", "pip", "install", "--quiet", "huggingface_hub", "-U"], capture_output=True, text=True)\n',
      'print("hf install rc:", r.returncode)\n',
      'print("Downloading Qwen3-4B-Q4_K_M.gguf via hf_hub_download...")\n',
      'from huggingface_hub import hf_hub_download\n',
      'try:\n',
      '    path = hf_hub_download(\n',
      '        repo_id="bartowski/Qwen3-4B-GGUF",\n',
      '        filename="qwen3-4b-q4_k_m.gguf",\n',
      '        local_dir=model_dir,\n',
      '        local_dir_use_symlinks=False\n',
      '    )\n',
      '    print("Downloaded to:", path)\n',
      '    print("Size MB:", round(os.path.getsize(path)/1024/1024, 1))\n',
      'except Exception as e:\n',
      '    print("Download error:", e)\n'
    ]),
    cell(['# Start llama.cpp server\n',
      'import subprocess, time, os, json, sys\n',
      'model_path = "/kaggle/working/qwen3-4b-q4_k_m.gguf"\n',
      'if not os.path.exists(model_path):\n',
      '    print("ERROR: model not found")\n',
      'else:\n',
      '    cmd = [sys.executable, "-m", "llama_cpp.server", "--model", model_path, "--port", "8080", "--host", "0.0.0.0", "--n-gpu-layers", "99", "--chat-template", "qwen3", "-t", "8"]\n',
      '    print("Starting server:", " ".join(cmd))\n',
      '    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)\n',
      '    print("PID:", proc.pid)\n',
      '    time.sleep(15)\n',
      '    poll = proc.poll()\n',
      '    print("Running:", poll is None)\n',
      '    if poll is not None:\n',
      '        out, _ = proc.communicate(timeout=10)\n',
      '        print("EXIT OUTPUT:", out[-3000:])\n'
    ]),
    cell(['# Test local inference endpoint\n',
      'import urllib.request, json\n',
      'url = "http://127.0.0.1:8080/v1/chat/completions"\n',
      'payload = json.dumps({\n',
      '    "model": "qwen3-4b-q4_k_m",\n',
      '    "messages": [{"role": "user", "content": "What GPU are you running on? One sentence."}],\n',
      '    "max_tokens": 100\n',
      '}).encode()\n',
      'req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})\n',
      'try:\n',
      '    with urllib.request.urlopen(req, timeout=180) as resp:\n',
      '        result = json.loads(resp.read().decode())\n',
      '        print("INFERENCE OK")\n',
      '        print("MODEL:", result.get("model"))\n',
      '        print("REPLY:", result.get("choices", [{}])[0].get("message", {}).get("content", "")[:400])\n',
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
