const https = require('https');
const crypto = require('crypto');
const http = require('http');
const url = require('url');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
    if (postData) req.write(postData);
    req.end();
  });
}

async function main() {
  // Step 1: Generate PKCE code verifier and challenge
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  
  console.log('Code verifier:', codeVerifier);
  console.log('Code challenge:', codeChallenge);
  
  // Step 2: Register an OAuth client
  console.log('\n=== Registering OAuth client ===');
  const registrationData = JSON.stringify({
    redirect_uris: ['http://127.0.0.1:4097/callback'],
    token_endpoint_auth_method: 'none',
    client_name: 'Kilo Test Client',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    code_challenge_methods_supported: ['S256'],
    scope: 'resources.admin:*'
  });
  
  try {
    const regResult = await makeRequest({
      hostname: 'www.kaggle.com',
      path: '/api/v1/oauth2/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(registrationData)
      }
    }, registrationData);
    
    console.log('Registration status:', regResult.status);
    console.log('Registration response:', regResult.body.substring(0, 1000));
    
    if (regResult.status === 200 || regResult.status === 201) {
      const reg = JSON.parse(regResult.body);
      console.log('Client ID:', reg.client_id);
      console.log('Client secret:', reg.client_secret || '(none - public client)');
      console.log('Redirect URIs:', reg.redirect_uris);
      
      const clientId = reg.client_id;
      
      // Step 3: Build authorization URL
      const authUrl = new URL('https://www.kaggle.com/api/v1/oauth2/authorize');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', 'http://127.0.0.1:4097/callback');
      authUrl.searchParams.set('scope', 'resources.admin:*');
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
      authUrl.searchParams.set('state', crypto.randomBytes(16).toString('hex'));
      
      console.log('\n=== Authorization URL ===');
      console.log(authUrl.toString());
      
      // Step 4: Start callback server
      console.log('\n=== Starting callback server on port 4097 ===');
      const callbackServer = http.createServer((req, res) => {
        const parsed = url.parse(req.url, true);
        console.log('\n=== Received callback ===');
        console.log('Path:', parsed.pathname);
        console.log('Query:', JSON.stringify(parsed.query));
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('Authentication complete. You can close this window.');
        
        const code = parsed.query.code;
        const state = parsed.query.state;
        
        if (code) {
          console.log('\nAuthorization code received:', code);
          console.log('State:', state);
          
          // Step 5: Exchange code for token
          const tokenData = new URLSearchParams();
          tokenData.append('grant_type', 'authorization_code');
          tokenData.append('client_id', clientId);
          tokenData.append('code', code);
          tokenData.append('redirect_uri', 'http://127.0.0.1:4097/callback');
          tokenData.append('code_verifier', codeVerifier);
          
          makeRequest({
            hostname: 'www.kaggle.com',
            path: '/api/v1/oauth2/token',
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': Buffer.byteLength(tokenData.toString())
            }
          }, tokenData.toString()).then(result => {
            console.log('\n=== Token exchange result ===');
            console.log('Status:', result.status);
            console.log('Body:', result.body.substring(0, 1000));
            
            callbackServer.close();
            process.exit(0);
          }).catch(e => {
            console.error('Token exchange error:', e.message);
            callbackServer.close();
            process.exit(1);
          });
        } else {
          console.log('No code in callback');
          callbackServer.close();
          process.exit(1);
        }
      });
      
      callbackServer.listen(4097, '127.0.0.1', () => {
        console.log('Callback server listening on http://127.0.0.1:4097/callback');
        console.log('\n=== OPEN THIS URL IN YOUR BROWSER ===');
        console.log(authUrl.toString());
        console.log('\nWaiting for callback...');
      });
      
      // Timeout after 60 seconds
      setTimeout(() => {
        console.log('Timeout waiting for auth callback');
        callbackServer.close();
        process.exit(1);
      }, 60000);
      
    } else {
      console.log('Registration failed, trying with existing client...');
    }
  } catch(e) {
    console.error('Registration error:', e.message);
  }
}

main();
