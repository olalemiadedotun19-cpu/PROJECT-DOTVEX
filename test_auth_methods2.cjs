const https = require('https');
const fs = require('fs');

// Load the token
const tokenData = JSON.parse(fs.readFileSync('C:/Users/USER/.mcp-auth/mcp-remote-0.1.37/47ccabe08d07cd744dec6a0ec36ffe48_tokens.json', 'utf8'));
const accessToken = tokenData.access_token;
const refreshToken = tokenData.refresh_token;

console.log('Loaded token:', accessToken.substring(0, 60) + '...');
console.log('Refresh token:', refreshToken ? 'present' : 'absent');

// Try different auth methods
async function testAuth(authMethod, headerName, headerValue, label) {
  const data = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name: 'get_accelerator_quota', arguments: {} }
  });
  
  const options = {
    hostname: 'www.kaggle.com',
    path: '/mcp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Content-Length': Buffer.byteLength(data),
      [headerName]: headerValue
    }
  };
  
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`\n[${label}]`);
        console.log('Status:', res.statusCode);
        console.log('Headers:', JSON.stringify(res.headers).substring(0, 300));
        console.log('Body:', body.substring(0, 500));
        resolve();
      });
    });
    req.on('error', (e) => { console.log(`[${label}] Error:`, e.message); resolve(); });
    req.write(data);
    req.end();
  });
}

(async () => {
  // Method 1: Bearer token in Authorization header
  await testAuth('bearer', 'Authorization', 'Bearer ' + accessToken, 'Bearer token');
  
  // Method 2: Token as kaggle_access_token cookie
  await testAuth('cookie', 'Cookie', 'kaggle_access_token=' + accessToken, 'Cookie: kaggle_access_token');
  
  // Method 3: Token as ka_sessionid cookie (maybe the token IS the session id)
  await testAuth('cookie2', 'Cookie', 'ka_sessionid=' + accessToken, 'Cookie: ka_sessionid');
  
  // Method 4: X-Kaggle-OAuth-Token header
  await testAuth('custom', 'X-Kaggle-OAuth-Token', accessToken, 'X-Kaggle-OAuth-Token');
  
  // Method 5: Check what the Kaggle API user endpoint returns with the token
  console.log('\n=== Checking Kaggle user info with token ===');
  const req = https.request({
    hostname: 'www.kaggle.com',
    path: '/api/v1/user',
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + accessToken }
  }, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Body:', body.substring(0, 500));
    });
  });
  req.on('error', (e) => console.log('Error:', e.message));
  req.end();
  
  // Method 6: Try with cookie-based auth using the access_token as a cookie value
  console.log('\n=== Trying MCP with cookies ===');
  await testAuth('cookie3', 'Cookie', 'ka_sessionid=' + accessToken + '; kaggle_access_token=' + accessToken, 'Cookie: combined');
  
  console.log('\n=== Done ===');
})();
