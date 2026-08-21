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
    cell(['# Diagnose llama_cpp installation and server entrypoint\n',
      'import subprocess, sys, os, glob\n',
      'print("python:", sys.executable)\n',
      'print("version:", sys.version)\n',
      'r = subprocess.run([sys.executable, "-c", "import llama_cpp; print(llama_cpp.__file__); print(dir(llama_cpp))"], capture_output=True, text=True)\n',
      'print("import check rc:", r.returncode)\n',
      'print(r.stdout)\n',
      'print(r.stderr)\n',
      'r2 = subprocess.run([sys.executable, "-m", "llama_cpp.server", "--help"], capture_output=True, text=True)\n',
      'print("server -m rc:", r2.returncode)\n',
      'print(r2.stdout[:1000])\n',
      'print(r2.stderr[:1000])\n',
      '# check for llama-server binary\n',
      'for p in ["/usr/local/bin/llama-server", "/usr/bin/llama-server", os.path.join(os.path.dirname(sys.executable), "llama-server")]:\n',
      '    print(p, "exists:", os.path.exists(p))\n'
    ]),
    cell(['# Start server with explicit PYTHONPATH and fallback to inline server\n',
      'import subprocess, time, os, json, sys\n',
      'model_path = "/kaggle/working/qwen2.5-1.5b-instruct-q4_k_m.gguf"\n',
      'if not os.path.exists(model_path):\n',
      '    print("ERROR: model not found")\n',
      'else:\n',
      '    env = os.environ.copy()\n',
      '    env["PYTHONPATH"] = "/usr/local/lib/python3.12/dist-packages"\n',
      '    cmd = [sys.executable, "-m", "llama_cpp.server", "--model", model_path, "--port", "8080", "--host", "0.0.0.0", "--n-gpu-layers", "99", "-t", "8"]\n',
      '    print("Starting with PYTHONPATH:", " ".join(cmd))\n',
      '    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1, env=env)\n',
      '    print("PID:", proc.pid)\n',
      '    time.sleep(15)\n',
      '    poll = proc.poll()\n',
      '    print("Running:", poll is None)\n',
      '    if poll is not None:\n',
      '        out, _ = proc.communicate(timeout=10)\n',
      '        print("EXIT OUTPUT:", out[-3000:])\n'
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
