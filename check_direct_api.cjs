const https = require('https');
const fs = require('fs');

const tokens = JSON.parse(fs.readFileSync('C:/Users/USER/.mcp-auth/mcp-remote-0.1.37/47ccabe08d07cd744dec6a0ec36ffe48_tokens.json', 'utf8'));
const accessToken = tokens.access_token;

function apiCall(path) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'www.kaggle.com', path: path, method: 'GET',
      headers: { 'Authorization': 'Bearer ' + accessToken, 'Accept': 'application/json' }
    }, (response) => {
      let body = '';
      response.on('data', c => body += c);
      response.on('end', () => resolve({ status: response.statusCode, body }));
    });
    req.on('error', e => resolve({ error: e.message }));
    req.end();
  });
}

(async () => {
  // Try to get notebook info via direct API
  const r1 = await apiCall('/api/v1/kernels/olalemiadedotun/dotvex-qwen3-gpu-v2');
  console.log('Kernel info:', r1.status, r1.body.substring(0, 500));

  // Try to get session output
  const r2 = await apiCall('/api/v1/kernels/olalemiadedotun/dotvex-qwen3-gpu-v2/output');
  console.log('Session output:', r2.status, r2.body.substring(0, 500));
})();
