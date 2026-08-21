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
  return { cell_type: 'code', execution_count: null, metadata: {}, outputs: [], source: Array.isArray(src) ? src : [src] };
}

const notebook = {
  cells: [
    cell(['# Download Qwen3-4B-Q4_K_M.gguf\n', 'import subprocess, os, sys\n', 'model_dir = "/kaggle/working"\n', 'model_path = os.path.join(model_dir, "qwen3-4b-q4_k_m.gguf")\n', 'url = "https://huggingface.co/bartowski/Qwen3-4B-GGUF/resolve/main/qwen3-4b-q4_k_m.gguf"\n', 'if not os.path.exists(model_path):\n', '    print("Downloading Qwen3-4B-Q4_K_M.gguf...")\n', '    r = subprocess.run(["curl", "-L", "-o", model_path, url, "-C", "-"], capture_output=True, text=True)\n', '    print("Download return code:", r.returncode)\n', '    print(r.stderr[-1000:] if r.stderr else "")\n', 'else:\n', '    print("Model already exists:", model_path)\n', 'print("File size:", os.path.getsize(model_path) if os.path.exists(model_path) else "N/A")']),
    cell(['# Start llama.cpp server in background\n', 'import subprocess, time, json, sys\n', 'model_path = "/kaggle/working/qwen3-4b-q4_k_m.gguf"\n', 'if not os.path.exists(model_path):\n', '    print("ERROR: Model not found")\n', 'else:\n', '    cmd = ["python", "-m", "llama_cpp.server", "--model", model_path, "--port", "8080", "--host", "0.0.0.0", "--n-gpu-layers", "99", "--chat-template", "qwen3", "-t", "8"]\n', '    print("Starting server:", " ".join(cmd))\n', '    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1)\n', '    print("Server PID:", proc.pid)\n', '    time.sleep(10)\n', '    # Check if server is running\n', '    poll = proc.poll()\n', '    print("Server running:", poll is None)\n', '    if poll is not None:\n', '        stdout, stderr = proc.communicate(timeout=5)\n', '        print("STDOUT:", stdout[-2000:])\n', '        print("STDERR:", stderr[-2000:])']),
    cell(['# Test the local inference endpoint\n', 'import urllib.request, json\n', 'url = "http://127.0.0.1:8080/v1/chat/completions"\n', 'payload = {\n', '    "model": "qwen3-4b-q4_k_m",\n', '    "messages": [{"role": "user", "content": "Hello, can you tell me what GPU you are running on?"}],\n', '    "max_tokens": 100\n', '}\n', 'req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"})\n', 'try:\n', '    with urllib.request.urlopen(req, timeout=120) as resp:\n', '        result = json.loads(resp.read().decode())\n', '        print("STATUS: SUCCESS")\n', '        print("MODEL:", result.get("model"))\n', '        print("CHOICE:", result.get("choices", [{}])[0].get("message", {}).get("content", "")[:500])\n', '        print("FULL:", json.dumps(result, indent=2)[:1000])\n', 'except Exception as e:\n', '    print("ERROR:", e)'])
  ],
  metadata: {
    kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' },
    language_info: { name: 'python', version: '3.12' }
  },
  nbformat: 4,
  nbformat_minor: 5
};

(async () => {
  console.log('=== save_notebook (download model + start server + test) ===');
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
  console.log('Save result:', r && r.content ? r.content[0].text : JSON.stringify(r), 'isError=', r && r.isError);
})();
