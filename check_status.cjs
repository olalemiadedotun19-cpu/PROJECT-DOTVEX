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

(async () => {
  console.log('=== get_notebook_session_status ===');
  const status = await call('get_notebook_session_status', {
    request: { userName: 'olalemiadedotun', kernelSlug: 'dotvex-qwen3-gpu-test' }
  });
  console.log('Status result:', JSON.stringify(status, null, 2));

  console.log('\n=== list_notebook_session_output ===');
  const out = await call('list_notebook_session_output', {
    request: { userName: 'olalemiadedotun', kernelSlug: 'dotvex-qwen3-gpu-test' }
  });
  console.log('Output result:', JSON.stringify(out, null, 2));
})();
