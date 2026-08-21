const https = require('https');
const crypto = require('crypto');

// Generate PKCE
const codeVerifier = crypto.randomBytes(32).toString('base64url');
const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

// Use existing client_id from registration (kilo-test-client)
// Build authorization URL
const authUrl = new URL('https://www.kaggle.com/api/v1/oauth2/authorize');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', 'kilo-test-client');
authUrl.searchParams.set('redirect_uri', 'http://127.0.0.1:4097/callback');
authUrl.searchParams.set('scope', 'resources.admin:*');
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');
authUrl.searchParams.set('state', crypto.randomBytes(16).toString('hex'));

console.log('Authorization URL:', authUrl.toString());
console.log('Code verifier:', codeVerifier);
console.log('Code challenge:', codeChallenge);

// Try to fetch the authorization URL to see what Kaggle returns
const url = authUrl.toString();
https.get(url, {
  headers: { 'Accept': 'text/html,application/xhtml+xml' }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('\n=== Authorization URL response ===');
    console.log('Status:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    
    // Check for redirects
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log('Redirect to:', res.headers.location);
    }
    
    // Check for login form
    if (data.includes('login') || data.includes('password') || data.includes('signin') || data.includes('form')) {
      console.log('\nContains login form');
    }
    
    // Check for OAuth consent screen
    if (data.includes('authorize') || data.includes('consent') || data.includes('grant')) {
      console.log('\nContains OAuth consent screen');
    }
    
    console.log('Body preview:', data.substring(0, 1000));
  });
}).on('error', (e) => {
  console.log('Error:', e.message);
});
