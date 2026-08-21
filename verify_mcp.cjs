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

(async () => {
  const r1 = await call('get_user_profile', { request: { hasUserName: true, userName: 'olalemiadedotun' } });
  console.log('profile:', r1 && r1.content ? 'OK' : JSON.stringify(r1).substring(0, 200));
  
  const r2 = await call('get_accelerator_quota', { request: {} });
  console.log('quota:', r2 && r2.content ? 'OK' : JSON.stringify(r2).substring(0, 300));
  
  const r3 = await call('get_notebook_info', { request: { userName: 'olalemiadedotun', kernelSlug: 'dotvex-qwen3-gpu-v2' } });
  console.log('notebookInfo:', r3 && r3.content ? 'OK' : JSON.stringify(r3).substring(0, 300));
  
  const r4 = await call('save_notebook', { request: {
    slugNullable: 'olalemiadedotun/dotvex-qwen3-gpu-v2',
    textNullable: '{}',
    languageNullable: 'python',
    kernelTypeNullable: 'notebook',
    enableGpuNullable: true,
    machineShapeNullable: 'GPU_T4',
    enableInternetNullable: true,
    isPrivateNullable: true
  }});
  console.log('saveNotebook:', r4 && r4.content ? 'OK' : JSON.stringify(r4).substring(0, 300));
  
  const r5 = await call('get_notebook_session_status', { request: { userName: 'olalemiadedotun', kernelSlug: 'dotvex-qwen3-gpu-v2' } });
  console.log('sessionStatus:', r5 && r5.content ? 'OK' : JSON.stringify(r5).substring(0, 300));
})();
