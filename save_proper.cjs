const https = require('https');
const fs = require('fs');

const tokenFile = 'C:/Users/USER/.mcp-auth/mcp-remote-0.1.37/47ccabe08d07cd744dec6a0ec36ffe48_tokens.json';
const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
const accessToken = tokens.access_token;

function call(toolName, args) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: toolName, arguments: args } });
    const req = https.request({
      hostname: 'www.kaggle.com', path: '/mcp', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'Authorization': 'Bearer ' + accessToken, 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
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

// Build a valid Jupyter .ipynb JSON notebook
function cell(src) {
  return { cell_type: 'code', execution_count: null, metadata: {}, outputs: [], source: Array.isArray(src) ? src : [src] };
}
const notebook = {
  cells: [
    cell(['import sys, os, subprocess\n', 'print("PYTHON:", sys.version)\n', 'print("EXECUTABLE:", sys.executable)']),
    cell(['# NVIDIA GPU detection (nvidia-smi)\n', 'import subprocess\n', 'r = subprocess.run(["nvidia-smi"], capture_output=True, text=True)\n', 'print(r.stdout if r.returncode==0 else "nvidia-smi failed: "+r.stderr)']),
    cell(['# GPU count, model, VRAM via nvidia-smi query\n', 'r = subprocess.run(["nvidia-smi","--query-gpu=index,name,memory.total,memory.used,utilization.gpu","--format=csv"], capture_output=True, text=True)\n', 'print(r.stdout if r.returncode==0 else r.stderr)']),
    cell(['# CUDA version via nvcc\n', 'r = subprocess.run(["nvcc","--version"], capture_output=True, text=True)\n', 'print(r.stdout if r.returncode==0 else "nvcc not found: "+r.stderr)']),
    cell(['# CUDA version via nvidia-smi driver\n', 'r = subprocess.run(["nvidia-smi"], capture_output=True, text=True)\n', 'import re\n', 'm = re.search(r"CUDA Version: ([\\d.]+)", r.stdout or "")\n', 'print("CUDA Version (driver):", m.group(1) if m else "unknown")']),
    cell(['# pip version\n', 'r = subprocess.run([sys.executable,"-m","pip","--version"], capture_output=True, text=True)\n', 'print(r.stdout.strip() if r.returncode==0 else r.stderr)']),
    cell(['# Check CUDA toolkit / llama.cpp prerequisites\n', 'for lib in ["libcuda.so","libcudnn.so","libcublas.so"]:\n', '    r = subprocess.run(["ldconfig","-p"], capture_output=True, text=True)\n', '    found = lib in (r.stdout or "")\n', '    print(lib, "->", "PRESENT" if found else "absent")']),
    cell(['# Check if torch/llama.cpp tooling present (do NOT install)\n', 'for mod in ["torch","llama_cpp"]:\n', '    try:\n', '        __import__(mod); print(mod, "PRESENT")\n', '    except Exception as e:\n', '        print(mod, "absent")'])
  ],
  metadata: {
    kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' },
    language_info: { name: 'python', version: '3.12' }
  },
  nbformat: 4,
  nbformat_minor: 5
};
const nbText = JSON.stringify(notebook);

(async () => {
  console.log('=== save_notebook (proper .ipynb) ===');
  const r = await call('save_notebook', {
    request: {
      slugNullable: 'olalemiadedotun/dotvex-qwen3-gpu-test',
      textNullable: nbText,
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
