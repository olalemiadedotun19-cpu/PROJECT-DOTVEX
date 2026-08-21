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
    cell(['# Install llama-cpp-python to /usr/bin/python3 explicitly and verify\n',
      'import subprocess, sys, os\n',
      'print("Kernel python:", sys.executable)\n',
      'print("Kernel version:", sys.version)\n',
      '# Install to system python explicitly\n',
      'r = subprocess.run([sys.executable, "-m", "pip", "install", "--quiet", "--target", "/usr/lib/python3/dist-packages", "--force-reinstall", "--no-cache-dir", "llama-cpp-python", "--extra-index-url", "https://abetlen.github.io/llama-cpp-python/whl/cu128"], capture_output=True, text=True)\n',
      'print("Install rc:", r.returncode)\n',
      'print((r.stdout or "")[-500:])\n',
      'print((r.stderr or "")[-500:])\n',
      '# Verify import from subprocess\n',
      'r2 = subprocess.run(["/usr/bin/python3", "-c", "from llama_cpp.server import server; print(server)"], capture_output=True, text=True)\n',
      'print("Subprocess import rc:", r2.returncode)\n',
      'print(r2.stdout[:500])\n',
      'print(r2.stderr[:500])\n'
    ]),
    cell(['# Start llama.cpp server (subprocess with verified python)\n',
      'import subprocess, time, os, json, sys\n',
      'model_path = "/kaggle/working/qwen2.5-1.5b-instruct-q4_k_m.gguf"\n',
      'if not os.path.exists(model_path):\n',
      '    print("ERROR: model not found")\n',
      'else:\n',
      '    cmd = ["/usr/bin/python3", "-m", "llama_cpp.server", "--model", model_path, "--port", "8080", "--host", "0.0.0.0", "--n-gpu-layers", "99", "-t", "8"]\n',
      '    print("Starting:", " ".join(cmd))\n',
      '    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)\n',
      '    print("PID:", proc.pid)\n',
      '    time.sleep(20)\n',
      '    poll = proc.poll()\n',
      '    print("Running:", poll is None)\n',
      '    if poll is not None:\n',
      '        out, _ = proc.communicate(timeout=10)\n',
      '        print("EXIT OUTPUT:", out[-3000:])\n'
    ]),
    cell(['# Test inference endpoint\n',
      'import urllib.request, json\n',
      'url = "http://127.0.0.1:8080/v1/chat/completions"\n',
      'payload = json.dumps({\n',
      '    "model": "qwen2.5-1.5b-instruct",\n',
      '    "messages": [{"role": "user", "content": "What GPU are you running on? One sentence."}],\n',
      '    "max_tokens": 80\n',
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
