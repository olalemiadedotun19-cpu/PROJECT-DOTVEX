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
  // Check notebook info for version
  const info = await call('get_notebook_info', { request: { userName: 'olalemiadedotun', kernelSlug: 'dotvex-qwen3-gpu-v2' } });
  console.log('NOTEBOOK INFO:', info && info.content ? info.content[0].text : JSON.stringify(info));
  
  // Check if model download/server notebook ran
  const out = await call('list_notebook_session_output', { request: { userName: 'olalemiadedotun', kernelSlug: 'dotvex-qwen3-gpu-v2' } });
  if (out && out.content) {
    const text = out.content[0].text;
    const parsed = JSON.parse(text);
    const log = parsed.log || text;
    
    // Check for model download indicators
    if (log.includes('Downloading Qwen3') || log.includes('Starting server') || log.includes('STATUS: SUCCESS')) {
      console.log('SERVER NOTEBOOK RAN:', log.substring(log.length - 2000));
    } else {
      console.log('NO SERVER OUTPUT YET - notebook may still be downloading/compiling');
      console.log('Current output length:', log.length);
    }
  }
})();
