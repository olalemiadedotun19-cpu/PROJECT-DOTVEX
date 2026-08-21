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
  // 1. User profile
  console.log('=== get_user_profile ===');
  const profile = await call('get_user_profile', { request: { userName: 'olalemiadedotun', hasUserName: true, userIdentifierCase: 'UserName' } });
  console.log(profile && profile.content ? profile.content[0].text : JSON.stringify(profile));

  // 2. Accelerator quota
  console.log('\n=== get_accelerator_quota ===');
  const quota = await call('get_accelerator_quota', { request: {} });
  console.log(quota && quota.content ? quota.content[0].text : JSON.stringify(quota));

  // 3. Notebook info for session 131472326
  console.log('\n=== get_notebook_info ===');
  const info = await call('get_notebook_info', { request: { userName: 'olalemiadedotun', kernelSlug: 'dotvex-qwen3-gpu-test' } });
  console.log(info && info.content ? info.content[0].text : JSON.stringify(info));

  // 4. Session status
  console.log('\n=== get_notebook_session_status ===');
  const status = await call('get_notebook_session_status', { request: { userName: 'olalemiadedotun', kernelSlug: 'dotvex-qwen3-gpu-test' } });
  console.log(status && status.content ? status.content[0].text : JSON.stringify(status));

  // 5. List all tool names to find anything accelerator/machine related
  console.log('\n=== Searching for accelerator/machine tools ===');
  // We need to get tools/list first
  const initData = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: { tools: {} }, clientInfo: { name: 't', version: '1.0' } } });
  const initReq = https.request({ hostname: 'www.kaggle.com', path: '/mcp', method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'Authorization': 'Bearer ' + accessToken, 'Content-Length': Buffer.byteLength(initData) } }, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      // now tools/list
      const listData = JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
      const listReq = https.request({ hostname: 'www.kaggle.com', path: '/mcp', method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'Authorization': 'Bearer ' + accessToken, 'Content-Length': Buffer.byteLength(listData) } }, (res2) => {
        let body2 = '';
        res2.on('data', c => body2 += c);
        res2.on('end', () => {
          const lines = body2.split('\n');
          for (const l of lines) {
            if (l.startsWith('data: ')) {
              try {
                const j = JSON.parse(l.slice(6));
                if (j.result && j.result.tools) {
                  const names = j.result.tools.map(t => t.name);
                  const matches = names.filter(n => /accelerator|machine|shape|gpu|eligib|quota|session|kernel|resource/i.test(n));
                  console.log('Matching tools:', matches);
                  return;
                }
              } catch (e) {}
            }
          }
        });
      });
      listReq.write(listData);
      listReq.end();
    });
  });
  initReq.write(initData);
  initReq.end();
})();
