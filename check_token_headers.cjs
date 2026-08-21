const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

const tokenFile = 'C:/Users/USER/.mcp-auth/mcp-remote-0.1.37/47ccabe08d07cd744dec6a0ec36ffe48_tokens.json';
const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
const accessToken = tokens.access_token;
const refreshToken = tokens.refresh_token;

console.log('Checking OAuth token endpoint for session cookies...');

// Re-exchange the code to see if the response headers include a session cookie
// Actually, let me check if there's a token refresh endpoint that might set cookies

// Try to refresh the token
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
  console.log('Refresh token response status:', res.statusCode);
  console.log('Response headers:', JSON.stringify(res.headers, null, 2).substring(0, 800));
  
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Body:', body.substring(0, 500));
    
    // Check for Set-Cookie
    if (res.headers['set-cookie']) {
      console.log('\nSet-Cookie headers:');
      res.headers['set-cookie'].forEach(c => console.log('  ', c));
    } else {
      console.log('\nNo Set-Cookie headers in response');
    }
  });
});
req.on('error', (e) => console.log('Error:', e.message));
req.write(refreshData.toString());
req.end();
