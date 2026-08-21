const https = require('https');
const fs = require('fs');

const tokenFile = 'C:/Users/USER/.mcp-auth/mcp-remote-0.1.37/47ccabe08d07cd744dec6a0ec36ffe48_tokens.json';
const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
const accessToken = tokens.access_token;

console.log('Testing Kaggle REST API with OAuth token...');

function apiCall(path, label) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'www.kaggle.com',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Accept': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`\n[${label}] Status: ${res.statusCode}`);
        console.log('Body:', body.substring(0, 400));
        resolve();
      });
    });
    req.on('error', (e) => { console.log(`[${label}] Error:`, e.message); resolve(); });
    req.end();
  });
}

(async () => {
  // Try Kaggle API endpoints
  await apiCall('/api/v1/user', 'GET /api/v1/user');
  await apiCall('/api/v1/accelerator-quota', 'GET /api/v1/accelerator-quota');
  await apiCall('/api/v1/kernels', 'GET /api/v1/kernels');
  
  // Try OAuth userinfo endpoint
  await apiCall('/api/v1/oauth2/userinfo', 'GET /api/v1/oauth2/userinfo');
  
  console.log('\n=== Done ===');
})();
