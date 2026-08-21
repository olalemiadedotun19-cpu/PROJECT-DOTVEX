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
    cell(['import sys, os, subprocess, json, shutil, re\n', 'print("PYTHON:", sys.version)\n', 'print("EXECUTABLE:", sys.executable)']),
    cell(['# Hardware verification\n', 'nsmi = shutil.which("nvidia-smi") or "/usr/bin/nvidia-smi"\n', 'print("nvidia-smi path:", nsmi)\n', 'r = subprocess.run([nsmi], capture_output=True, text=True) if os.path.exists(nsmi) else None\n', 'print(r.stdout if r and r.returncode==0 else "nvidia-smi unavailable: " + (r.stderr if r else "not found"))']),
    cell(['# GPU inventory via nvidia-smi query\n', 'r = subprocess.run([nsmi,"--query-gpu=index,name,memory.total,memory.used,utilization.gpu","--format=csv"], capture_output=True, text=True) if os.path.exists(nsmi) else None\n', 'print(r.stdout if r and r.returncode==0 else "query failed")']),
    cell(['# CUDA via nvcc if present\n', 'nvcc = shutil.which("nvcc") or "/usr/local/cuda/bin/nvcc"\n', 'r = subprocess.run([nvcc,"--version"], capture_output=True, text=True) if os.path.exists(nvcc) else None\n', 'print(r.stdout if r and r.returncode==0 else "nvcc not found")']),
    cell(['# CUDA driver version from nvidia-smi\n', 'r = subprocess.run([nsmi], capture_output=True, text=True) if os.path.exists(nsmi) else None\n', 'm = re.search(r"CUDA Version: ([\\d.]+)", r.stdout or "") if r else None\n', 'print("CUDA Version (driver):", m.group(1) if m else "unknown")']),
    cell(['# pip version\n', 'r = subprocess.run([sys.executable,"-m","pip","--version"], capture_output=True, text=True)\n', 'print(r.stdout.strip() if r.returncode==0 else r.stderr)']),
    cell(['# /dev/nvidia* devices\n', 'devs = sorted([d for d in os.listdir("/dev") if d.startswith("nvidia")]) if os.path.isdir("/dev") else []\n', 'print("/dev/nvidia entries:", devs if devs else "none")']),
    cell(['# torch CUDA check (no install)\n', 'try:\n', '    import torch\n', '    print("torch:", torch.__version__)\n', '    print("cuda available:", torch.cuda.is_available())\n', '    print("device count:", torch.cuda.device_count())\n', '    if torch.cuda.is_available():\n', '        print("device name:", torch.cuda.get_device_name(0))\n', '        print("device memory GB:", round(torch.cuda.get_device_properties(0).total_memory/1e9, 2))\n', 'except Exception as e:\n', '    print("torch import error:", e)'])
  ],
  metadata: {
    kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' },
    language_info: { name: 'python', version: '3.12' }
  },
  nbformat: 4,
  nbformat_minor: 5
};

(async () => {
  console.log('=== save_notebook (GPU_T4 verification) ===');
  const r = await call('save_notebook', {
    request: {
      slugNullable: 'olalemiadedotun/dotvex-qwen3-gpu-v2',
      newTitleNullable: 'DOTVEX Qwen3 GPU V2',
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
