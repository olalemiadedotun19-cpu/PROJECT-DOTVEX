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
    cell(['# Install llama-cpp-python with CUDA support for sm_60\n', 'import subprocess, sys\n', 'print(\"Installing llama-cpp-python with CUDA...\")\n', 'r = subprocess.run([sys.executable, "-m", "pip", "install", "--quiet", "--no-cache-dir", "llama-cpp-python", "--extra-index-url", "https://abetlen.github.io/llama-cpp-python/whl/cu128"], capture_output=True, text=True)\n', 'print(r.stdout[-2000:] if r.stdout else "")\n', 'print(r.stderr[-2000:] if r.stderr else "")\n', 'print(\"Return code:\", r.returncode)']),
    cell(['# Verify installation and GPU support\n', 'try:\n', '    from llama_cpp import Llama\n', '    print(\"llama_cpp imported successfully\")\n', '    print(\"Llama module location:\", Llama.__module__)\n', 'except Exception as e:\n', '    print(\"llama_cpp import error:\", e)']),
    cell(['# Check if we can instantiate a minimal llama with GPU layers\n', 'import os, glob\n', 'model_candidates = glob.glob(\"/kaggle/working/*.gguf\") + glob.glob(\"/kaggle/input/*/*.gguf\") + []\n', 'print(\"GGUF files found:\", model_candidates)\n', 'print(\"Working dir contents:\", os.listdir(\"/kaggle/working\") if os.path.isdir(\"/kaggle/working\") else \"N/A\")'])
  ],
  metadata: {
    kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' },
    language_info: { name: 'python', version: '3.12' }
  },
  nbformat: 4,
  nbformat_minor: 5
};

(async () => {
  console.log('=== save_notebook (install llama.cpp) ===');
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
