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
    cell(['# Diagnose server port and connectivity\n',
      'import subprocess, os, sys, json\n',
      'print("=== Port check ===")\n',
      'r = subprocess.run(["ss", "-tlnp"], capture_output=True, text=True)\n',
      'print(r.stdout)\n',
      'print(r.stderr)\n',
      'print("=== netstat ===")\n',
      'r2 = subprocess.run(["netstat", "-tlnp"], capture_output=True, text=True)\n',
      'print(r2.stdout[:2000])\n',
      'print("=== curl localhost:8080 ===")\n',
      'r3 = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "http://127.0.0.1:8080/"], capture_output=True, text=True)\n',
      'print("curl status:", r3.stdout, r3.stderr[:200])\n',
      'print("=== ps aux | grep llama ===")\n',
      'r4 = subprocess.run(["ps", "aux"], capture_output=True, text=True)\n',
      'for line in r4.stdout.split("\\n"):\n',
      '    if "llama" in line.lower() or "python" in line.lower():\n',
      '        print(line)\n',
      'print("=== /proc/net/tcp ===")\n',
      'if os.path.exists("/proc/net/tcp"):\n',
      '    with open("/proc/net/tcp") as f:\n',
      '        print(f.read()[:1000])\n'
    ]),
    cell(['# Try starting server with nohup and test again\n',
      'import subprocess, time, os, sys, json\n',
      'model_path = "/kaggle/working/Qwen3-4B-Q4_K_M.gguf"\n',
      'if not os.path.exists(model_path):\n',
      '    print("Model missing!")\n',
      'else:\n',
      '    log_path = "/kaggle/working/server.log"\n',
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
      '    with open(log_path, "w") as log:\n',
      '        proc = subprocess.Popen(\n',
      '            cmd,\n',
      '            stdout=log,\n',
      '            stderr=subprocess.STDOUT,\n',
      '            text=True,\n',
      '            bufsize=1\n',
      '        )\n',
      '    print("Started server PID:", proc.pid)\n',
      '    print("Log file:", log_path)\n',
      '    time.sleep(60)\n',
      '    poll = proc.poll()\n',
      '    print("Server running:", poll is None)\n',
      '    if os.path.exists(log_path):\n',
      '        with open(log_path) as f:\n',
      '            content = f.read()\n',
      '        print("Log tail:", content[-2000:])\n'
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
