const https = require('https');
const fs = require('fs');

const tokenFile = 'C:/Users/USER/.mcp-auth/mcp-remote-0.1.37/47ccabe08d07cd744dec6a0ec36ffe48_tokens.json';
const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
const accessToken = tokens.access_token;
const refreshToken = tokens.refresh_token;

console.log('Refreshing token to capture session cookie...');

// Step 1: Refresh token, capture ka_sessionid cookie
const refreshData = new URLSearchParams();
refreshData.append('grant_type', 'refresh_token');
refreshData.append('client_id', 'kilo-mcp-client');
refreshData.append('refresh_token', refreshToken);

const req = https.request({
  hostname: 'www.kaggle.com',
  path: '/api/v1/oauth2/token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(refreshData.toString())
  }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    // Capture ka_sessionid cookie
    let kaSessionId = '';
    if (res.headers['set-cookie']) {
      for (const cookie of res.headers['set-cookie']) {
        const match = cookie.match(/ka_sessionid=([^;]+)/);
        if (match) {
          kaSessionId = match[1];
          console.log('Captured ka_sessionid:', kaSessionId);
        }
      }
    }
    
    if (!kaSessionId) {
      console.log('No ka_sessionid cookie found');
      return;
    }
    
    // Step 2: Call MCP with the session cookie
    console.log('\n=== Testing get_accelerator_quota with ka_sessionid cookie ===');
    const mcpData = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'get_accelerator_quota', arguments: {} }
    });
    
    const mcpReq = https.request({
      hostname: 'www.kaggle.com',
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Cookie': 'ka_sessionid=' + kaSessionId,
        'Content-Length': Buffer.byteLength(mcpData)
      }
    }, (mcpRes) => {
      let mcpBody = '';
      mcpRes.on('data', (chunk) => mcpBody += chunk);
      mcpRes.on('end', () => {
        console.log('Status:', mcpRes.statusCode);
        console.log('Body:', mcpBody.substring(0, 800));
        
        // Also test get_user_profile
        console.log('\n=== Testing get_user_profile with ka_sessionid cookie ===');
        const mcpData2 = JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: { name: 'get_user_profile', arguments: {} }
        });
        
        const mcpReq2 = https.request({
          hostname: 'www.kaggle.com',
          path: '/mcp',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'Cookie': 'ka_sessionid=' + kaSessionId,
            'Content-Length': Buffer.byteLength(mcpData2)
          }
        }, (mcpRes2) => {
          let mcpBody2 = '';
          mcpRes2.on('data', (chunk) => mcpBody2 += chunk);
          mcpRes2.on('end', () => {
            console.log('Status:', mcpRes2.statusCode);
            console.log('Body:', mcpBody2.substring(0, 800));
            console.log('\n=== Done ===');
          });
        });
        mcpReq2.on('error', (e) => console.log('Error:', e.message));
        mcpReq2.write(mcpData2);
        mcpReq2.end();
      });
    });
    mcpReq.on('error', (e) => console.log('Error:', e.message));
    mcpReq.write(mcpData);
    mcpReq.end();
  });
});
req.on('error', (e) => console.log('Error:', e.message));
req.write(refreshData.toString());
req.end();
