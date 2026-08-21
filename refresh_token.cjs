const https = require('https');
const fs = require('fs');

const tokenPath = 'C:/Users/USER/.mcp-auth/mcp-remote-0.1.37/47ccabe08d07cd744dec6a0ec36ffe48_tokens.json';
const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

const postData = JSON.stringify({
  grant_type: 'refresh_token',
  refresh_token: tokens.refresh_token,
  client_id: tokens.client_id
});

const req = https.request({
  hostname: 'www.kaggle.com',
  path: '/api/v1/oauth2/token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (response) => {
  let body = '';
  response.on('data', c => body += c);
  response.on('end', () => {
    console.log('Status:', response.statusCode);
    try {
      const parsed = JSON.parse(body);
      console.log('Has access_token:', !!parsed.access_token);
      console.log('Has refresh_token:', !!parsed.refresh_token);
      console.log('Expires in:', parsed.expires_in);
      console.log('Scope:', parsed.scope);
      
      if (parsed.access_token) {
        const updated = {
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token || tokens.refresh_token,
          expires_in: parsed.expires_in || 10800,
          scope: parsed.scope || tokens.scope,
          token_type: parsed.token_type || 'Bearer',
          client_id: tokens.client_id,
          code_verifier: tokens.code_verifier
        };
        fs.writeFileSync(tokenPath, JSON.stringify(updated, null, 2));
        console.log('\n✓ Token refreshed successfully');
        console.log('New access_token:', parsed.access_token.substring(0, 60) + '...');
      } else {
        console.log('Error response:', body);
      }
    } catch (e) {
      console.log('Body:', body.substring(0, 500));
    }
  });
});

req.on('error', e => console.log('Error:', e.message));
req.write(postData);
req.end();
