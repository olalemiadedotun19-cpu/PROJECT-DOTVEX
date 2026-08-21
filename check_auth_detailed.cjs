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
  // Try different tools to understand the auth state
  const r1 = await call('get_user_profile', { request: { hasUserName: true, userName: 'olalemiadedotun' } });
  console.log('USER_PROFILE:', r1 && r1.content ? 'OK' : JSON.stringify(r1).substring(0, 200));
  
  const r2 = await call('list_notebook_session_output', { request: { userName: 'olalemiadedotun', kernelSlug: 'dotvex-qwen3-gpu-v2' } });
  console.log('NOTEBOOK_OUTPUT:', r2 && r2.content ? 'OK' : JSON.stringify(r2).substring(0, 200));
  
  const r3 = await call('get_notebook_info', { request: { userName: 'olalemiadedotun', kernelSlug: 'dotvex-qwen3-gpu-v2' } });
  console.log('NOTEBOOK_INFO:', r3 && r3.content ? 'OK' : JSON.stringify(r3).substring(0, 200));
})();
