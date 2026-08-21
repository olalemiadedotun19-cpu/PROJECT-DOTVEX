const https = require('https');
const fs = require('fs');

const state = JSON.parse(fs.readFileSync('C:/Users/USER/Downloads/dotvex/oauth_state.json', 'utf8'));
const codeData = JSON.parse(fs.readFileSync('C:/Users/USER/Downloads/dotvex/oauth_code.json', 'utf8'));

const tokenData = {
  grant_type: 'authorization_code',
  code: codeData.code,
  redirect_uri: state.redirectUri,
  client_id: state.clientId,
  code_verifier: state.codeVerifier
};

const postData = JSON.stringify(tokenData);

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
      console.log('Token response keys:', Object.keys(parsed));
      console.log('Has access_token:', !!parsed.access_token);
      console.log('Has refresh_token:', !!parsed.refresh_token);
      console.log('Expires in:', parsed.expires_in);
      console.log('Scope:', parsed.scope);
      
      if (parsed.access_token) {
        // Save tokens in mcp-remote format
        const tokenCache = {
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token || '',
          expires_in: parsed.expires_in || 3600,
          scope: parsed.scope || 'resources.admin:*',
          token_type: parsed.token_type || 'Bearer',
          client_id: state.clientId,
          code_verifier: state.codeVerifier
        };
        
        const hash = require('crypto').createHash('md5').update('https://www.kaggle.com/mcp').digest('hex');
        const tokenDir = 'C:/Users/USER/.mcp-auth/mcp-remote-0.1.37';
        
        if (!fs.existsSync(tokenDir)) {
          fs.mkdirSync(tokenDir, { recursive: true });
        }
        
        fs.writeFileSync(`${tokenDir}/${hash}_tokens.json`, JSON.stringify(tokenCache, null, 2));
        fs.writeFileSync(`${tokenDir}/${hash}_client_info.json`, JSON.stringify({
          client_id: state.clientId,
          redirect_uri: state.redirectUri,
          code_verifier: state.codeVerifier
        }, null, 2));
        
        console.log('\n✓ Tokens saved to mcp-remote cache');
        console.log('Token hash:', hash);
        console.log('Token file:', `${tokenDir}/${hash}_tokens.json`);
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
