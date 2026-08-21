const https = require('https');
const crypto = require('crypto');

// Generate PKCE challenge
const codeVerifier = crypto.randomBytes(32).toString('base64url');
const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
const state = crypto.randomUUID();

const params = new URLSearchParams({
  client_id: 'dotvex-kaggle-mcp-client',
  redirect_uri: 'http://localhost:21715/oauth/callback',
  response_type: 'code',
  scope: 'resources.admin:*',
  state: state,
  code_challenge: codeChallenge,
  code_challenge_method: 'S256'
});

const authUrl = `https://www.kaggle.com/api/v1/oauth2/authorize?${params.toString()}`;
console.log('AUTH_URL:', authUrl);
console.log('CODE_VERIFIER:', codeVerifier);
console.log('STATE:', state);

// Save code verifier for later token exchange
const fs = require('fs');
fs.writeFileSync('C:/Users/USER/Downloads/dotvex/oauth_state.json', JSON.stringify({
  codeVerifier,
  state,
  clientId: 'dotvex-kaggle-mcp-client',
  redirectUri: 'http://localhost:21715/oauth/callback'
}, null, 2));

// Open Chrome
const { exec } = require('child_process');
exec(`start chrome "${authUrl}"`, (error) => {
  if (error) {
    console.log('Chrome open error:', error.message);
    console.log('Please open this URL manually:', authUrl);
  } else {
    console.log('Chrome opened with authorization URL');
  }
});
