const https = require('https');
const fs = require('fs');

const tokenFile = 'C:/Users/USER/.mcp-auth/mcp-remote-0.1.37/47ccabe08d07cd744dec6a0ec36ffe48_tokens.json';
const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
const accessToken = tokens.access_token;

function rpc(method, params, cb) {
  const data = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
  const req = https.request({
    hostname: 'www.kaggle.com', path: '/mcp', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'Authorization': 'Bearer ' + accessToken, 'Content-Length': Buffer.byteLength(data) }
  }, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => cb(body));
  });
  req.on('error', e => console.log('ERR', e.message));
  req.write(data); req.end();
}

// initialize first
rpc('initialize', { protocolVersion: '2025-06-18', capabilities: { tools: {} }, clientInfo: { name: 't', version: '1.0' } }, () => {
  // then tools/list
  rpc('tools/list', {}, (body) => {
    fs.writeFileSync('tools_list_raw.json', body);
    // parse SSE
    const lines = body.split('\n');
    for (const l of lines) {
      if (l.startsWith('data: ')) {
        try {
          const j = JSON.parse(l.slice(6));
          if (j.result && j.result.tools) {
            const gpu = j.result.tools.find(t => t.name === 'get_accelerator_quota');
            const prof = j.result.tools.find(t => t.name === 'get_user_profile');
            const cre = j.result.tools.find(t => t.name === 'create_notebook_session');
            console.log('GPU inputSchema:', JSON.stringify(gpu && gpu.inputSchema));
            console.log('PROF inputSchema:', JSON.stringify(prof && prof.inputSchema));
            console.log('CREATE inputSchema:', JSON.stringify(cre && cre.inputSchema));
            console.log('TOTAL TOOLS:', j.result.tools.length);
            return;
          }
        } catch (e) {}
      }
    }
    console.log('Could not parse tools list. Raw length:', body.length);
  });
});
