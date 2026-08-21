const https = require('https');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data.substring(0, 500)
        });
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
    if (postData) req.write(postData);
    req.end();
  });
}

async function testAuth(headerValue, headerName = 'Authorization', label) {
  const data = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-03-26',
      capabilities: { tools: {} },
      clientInfo: { name: 'test', version: '1.0.0' }
    }
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
  
  try {
    const result = await makeRequest(options, data);
    console.log(`\n[${label}]`);
    console.log('Status:', result.status);
    console.log('WWW-Authenticate:', result.headers['www-authenticate'] || '(none)');
    console.log('Body:', result.body);
  } catch(e) {
    console.log(`[${label}] Error:`, e.message);
  }
}

(async () => {
  // Test with Bearer token (empty/placeholder)
  await testAuth('Bearer test', 'Authorization', 'Bearer test');
  
  // Test with Kaggle API key format
  await testAuth('kaggle-api-key', 'X-Kaggle-Api-Key', 'X-Kaggle-Api-Key');
  
  // Test with the session cookie from earlier
  await testAuth('ka_sessionid=test', 'Cookie', 'Cookie test');
  
  // Test with no auth but check if server returns 401 on protected resource access
  console.log('\n=== Checking if server returns 401 for unauthorized resource access ===');
  
  // Try listing resources (which might require auth)
  const data = JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'resources/list'
  });
  
  const result = await makeRequest({
    hostname: 'www.kaggle.com',
    path: '/mcp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Content-Length': Buffer.byteLength(data)
    }
  }, data);
  
  console.log('Resources/list status:', result.status);
  console.log('Headers:', JSON.stringify(result.headers, null, 2));
  console.log('Body:', result.body);
  
  // Check if there's a specific auth endpoint
  console.log('\n=== Checking Kaggle auth endpoints ===');
  
  const authEndpoints = [
    '/api/v1/oauth2/userinfo',
    '/oauth/userinfo',
    '/account/api/oauth',
    '/api/mcp/auth',
    '/mcp/auth',
  ];
  
  for (const endpoint of authEndpoints) {
    const result = await makeRequest({
      hostname: 'www.kaggle.com',
      path: endpoint,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    console.log(`GET ${endpoint}: Status ${result.status}`);
    if (result.status === 200) {
      console.log('  Body:', result.body);
    }
  }
})();
