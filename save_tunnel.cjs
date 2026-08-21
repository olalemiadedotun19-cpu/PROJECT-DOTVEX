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
    cell(['# Check server status and install cloudflared\n',
      'import subprocess, os, time, urllib.request, json\n',
      'print("=== Server process check ===")\n',
      'r = subprocess.run(["ps", "aux"], capture_output=True, text=True)\n',
      'for line in r.stdout.split("\\n"):\n',
      '    if "llama" in line.lower() or "python" in line.lower():\n',
      '        print(line)\n',
      '\n',
      'print("\\n=== Port check ===")\n',
      'r2 = subprocess.run(["ss", "-tlnp"], capture_output=True, text=True)\n',
      'print(r2.stdout)\n',
      '\n',
      'print("=== Test localhost:8080 ===")\n',
      'try:\n',
      '    req = urllib.request.Request("http://127.0.0.1:8080/v1/chat/completions",\n',
      '        data=json.dumps({"model": "Qwen3-4B-Q4_K_M", "messages": [{"role": "user", "content": "Hi"}], "max_tokens": 10}).encode(),\n',
      '        headers={"Content-Type": "application/json", "Authorization": "Bearer dotvex-qwen3-gpu-key"})\n',
      '    with urllib.request.urlopen(req, timeout=60) as resp:\n',
      '        result = json.loads(resp.read().decode())\n',
      '        print("Local inference: OK")\n',
      '        print("Reply:", result.get("choices", [{}])[0].get("message", {}).get("content", "")[:100])\n',
      'except Exception as e:\n',
      '    print("Local inference failed:", e)\n',
      '\n',
      'print("\\n=== Installing cloudflared ===")\n',
      'r3 = subprocess.run(["curl", "-L", "-o", "/kaggle/working/cloudflared", "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"], capture_output=True, text=True)\n',
      'print("Download rc:", r3.returncode)\n',
      'r4 = subprocess.run(["chmod", "+x", "/kaggle/working/cloudflared"], capture_output=True, text=True)\n',
      'print("chmod rc:", r4.returncode)\n',
      'print("cloudflared exists:", os.path.exists("/kaggle/working/cloudflared"))\n'
    ]),
    cell(['# Start Cloudflare tunnel\n',
      'import subprocess, time, os, json, urllib.request\n',
      'cloudflared = "/kaggle/working/cloudflared"\n',
      'if not os.path.exists(cloudflared):\n',
      '    print("cloudflared not found!")\n',
      'else:\n',
      '    cmd = [\n',
      '        cloudflared,\n',
      '        "tunnel",\n',
      '        "--url", "http://127.0.0.1:8080",\n',
      '        "--no-autoupdate",\n',
      '        "--api-key", "dotvex-qwen3-gpu-key"\n',
      '    ]\n',
      '    log_file = "/kaggle/working/tunnel.log"\n',
      '    with open(log_file, "w") as log:\n',
      '        proc = subprocess.Popen(cmd, stdout=log, stderr=subprocess.STDOUT, text=True)\n',
      '    print("Tunnel PID:", proc.pid)\n',
      '    print("Waiting 15s for tunnel URL...")\n',
      '    time.sleep(15)\n',
      '    poll = proc.poll()\n',
      '    print("Tunnel running:", poll is None)\n',
      '    if os.path.exists(log_file):\n',
      '        with open(log_file) as f:\n',
      '            content = f.read()\n',
      '        print("Log:", content[-2000:])\n',
      '        import re\n',
      '        urls = re.findall(r"https://[a-zA-Z0-9-]+\.trycloudflare\\.com", content)\n',
      '        if urls:\n',
      '            print("TUNNEL URL:", urls[-1])\n',
      '            with open("/kaggle/working/tunnel_url.txt", "w") as f:\n',
      '                f.write(urls[-1])\n'
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
