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
        // parse SSE
        const lines = body.split('\n');
        for (const l of lines) {
          if (l.startsWith('data: ')) {
            try {
              const j = JSON.parse(l.slice(6));
              if (j.result) {
                const text = j.result.content && j.result.content[0] ? j.result.content[0].text : JSON.stringify(j.result);
                console.log(`\n[${toolName}] isError=${j.result.isError}`);
                console.log(text.substring(0, 1200));
                return resolve();
              }
            } catch (e) {}
          }
        }
        console.log(`[${toolName}] raw:`, body.substring(0, 500));
        resolve();
      });
    });
    req.on('error', e => { console.log('ERR', e.message); resolve(); });
    req.write(data); req.end();
  });
}

(async () => {
  console.log('=== get_accelerator_quota ===');
  await call('get_accelerator_quota', { request: {} });
  console.log('\n=== get_user_profile ===');
  await call('get_user_profile', { request: { userName: 'olalemiadedotun', hasUserName: true, userIdentifierCase: 'UserName' } });
  console.log('\n=== create_notebook_session (dry schema check only - NOT creating) ===');
  console.log('Tool available. Would accept request.machineShape e.g. "GPU_T4", "GPU_P100", "GPU_V100", "GPU_A100"');
})();
