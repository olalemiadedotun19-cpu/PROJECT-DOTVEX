const https = require('https');
const fs = require('fs');

// Load the current valid token
const tokenFile = 'C:/Users/USER/.mcp-auth/mcp-remote-0.1.37/47ccabe08d07cd744dec6a0ec36ffe48_tokens.json';
const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
const accessToken = tokens.access_token;
console.log('Token loaded:', accessToken.substring(0, 50) + '...');
console.log('Token expires_in:', tokens.expires_in);

function callTool(toolName, authHeader) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: toolName, arguments: {} }
    });
    
    const options = {
      hostname: 'www.kaggle.com',
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Content-Length': Buffer.byteLength(data),
        ...authHeader
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`\n[${toolName}] Status: ${res.statusCode}`);
        console.log('Body:', body.substring(0, 600));
        resolve();
      });
    });
    req.on('error', (e) => { console.log(`[${toolName}] Error:`, e.message); resolve(); });
    req.write(data);
    req.end();
  });
}

(async () => {
  console.log('\n=== Test 1: get_accelerator_quota with Bearer token ===');
  await callTool('get_accelerator_quota', { 'Authorization': 'Bearer ' + accessToken });
  
  console.log('\n=== Test 2: get_user_profile with Bearer token ===');
  await callTool('get_user_profile', { 'Authorization': 'Bearer ' + accessToken });
  
  // Also try with cookie
  console.log('\n=== Test 3: get_user_profile with cookie ===');
  await callTool('get_user_profile', { 'Cookie': 'kaggle_access_token=' + accessToken });
  
  console.log('\n=== Done ===');
})();
