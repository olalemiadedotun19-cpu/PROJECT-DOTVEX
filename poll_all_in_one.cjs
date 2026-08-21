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

(async () => {
  for (let i = 0; i < 50; i++) {
    await new Promise(r => setTimeout(r, 20000));
    const status = await call('get_notebook_session_status', { request: { userName: 'olalemiadedotun', kernelSlug: 'dotvex-qwen3-gpu-v2' } });
    const st = status && status.content ? status.content[0].text : JSON.stringify(status);
    console.log(`[${new Date().toISOString()}] ${st}`);
    
    if (st.includes('COMPLETE') || st.includes('ERROR') || st.includes('CANCELED')) {
      const out = await call('list_notebook_session_output', { request: { userName: 'olalemiadedotun', kernelSlug: 'dotvex-qwen3-gpu-v2' } });
      if (out && out.content) {
        const parsed = JSON.parse(out.content[0].text);
        const log = parsed.log || '';
        console.log('OUTPUT:', log.slice(-10000));
      }
      break;
    }
  }
})();
