const https = require('https');
const http = require('http');
const crypto = require('crypto');
const url = require('url');

// Step 1: Generate PKCE
const codeVerifier = crypto.randomBytes(32).toString('base64url');
const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

// Step 2: Register OAuth client (may already exist)
const registrationData = JSON.stringify({
  redirect_uris: ['http://127.0.0.1:4098/callback'],
  token_endpoint_auth_method: 'none',
  client_name: 'Kilo MCP Client',
  grant_types: ['authorization_code', 'refresh_token'],
  response_types: ['code'],
  code_challenge_methods_supported: ['S256'],
  scope: 'resources.admin:*'
});

// Step 3: Start callback server
const callbackServer = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  console.log('\n=== CALLBACK RECEIVED ===');
  console.log('Path:', parsed.pathname);
  console.log('Query:', JSON.stringify(parsed.query));
  
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('Auth complete');
  
  const code = parsed.query.code;
  if (code) {
    console.log('\n=== Authorization code:', code, '===');
    console.log('State:', parsed.query.state);
    
    // Exchange code for token
    exchangeToken(code);
  } else {
    console.log('No code received');
    callbackServer.close();
    process.exit(1);
  }
});

async function exchangeToken(authCode) {
  const tokenData = new URLSearchParams();
  tokenData.append('grant_type', 'authorization_code');
  tokenData.append('client_id', 'kilo-test-client');
  tokenData.append('code', authCode);
  tokenData.append('redirect_uri', 'http://127.0.0.1:4098/callback');
  tokenData.append('code_verifier', codeVerifier);
  
  const postData = tokenData.toString();
  
  const options = {
    hostname: 'www.kaggle.com',
    path: '/api/v1/oauth2/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('\n=== Token Exchange Result ===');
      console.log('Status:', res.statusCode);
      console.log('Body:', data);
      callbackServer.close();
      process.exit(0);
    });
  });
  req.on('error', (e) => {
    console.log('Token exchange error:', e.message);
    callbackServer.close();
    process.exit(1);
  });
  req.setTimeout(15000, () => {
    console.log('Token exchange timeout');
    callbackServer.close();
    process.exit(1);
  });
  req.write(postData);
  req.end();
}

// Start callback server
callbackServer.listen(4098, '127.0.0.1', () => {
  console.log('Callback server listening on http://127.0.0.1:4098/callback');
  
  // Step 4: Build authorization URL
  const authUrl = new URL('https://www.kaggle.com/api/v1/oauth2/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', 'kilo-test-client');
  authUrl.searchParams.set('redirect_uri', 'http://127.0.0.1:4098/callback');
  authUrl.searchParams.set('scope', 'resources.admin:*');
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('state', crypto.randomBytes(32).toString('hex'));
  
  console.log('\n=== Authorization URL ===');
  console.log(authUrl.toString());
  
  // Step 5: Make GET request to the authorization URL (follow redirects)
  console.log('\n=== Fetching authorization URL (following redirects) ===');
  
  let cookies = '';
  let currentUrl = authUrl.toString();
  
  function followRedirect(nextUrl, cookieHeader) {
    const parsed = new URL(nextUrl);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/json,text/event-stream',
        'Cookie': cookieHeader
      }
    };
    
    https.get(options, (res) => {
      console.log('  Status:', res.statusCode, 'Location:', res.headers.location || '(none)');
      
      // Capture cookies
      if (res.headers['set-cookie']) {
        const newCookies = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
        cookies = cookies ? cookies + '; ' + newCookies : newCookies;
      }
      
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Check if redirect goes to our callback server
        const redirectUrl = res.headers.location;
        if (redirectUrl.includes('127.0.0.1:4098/callback')) {
      console.log('  Redirect to our callback server! Following...');
      // Don't follow - the callback server will receive it
      console.log('  Callback URL:', redirectUrl);
      // Extract code from the redirect and exchange
      const callbackUrl = new URL(redirectUrl);
      const code = callbackUrl.searchParams.get('code');
      const state = callbackUrl.searchParams.get('state');
      console.log('  Code extracted from redirect:', code ? code.substring(0, 50) + '...' : '(none)');
      console.log('  State:', state);
      if (code) {
        exchangeToken(code);
      } else {
        callbackServer.close();
        process.exit(1);
      }
        } else if (redirectUrl.includes('127.0.0.1')) {
          console.log('  Redirect to localhost! Following...');
          // This is a redirect to our callback - we need to handle it
          http.get(redirectUrl, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
              console.log('  Callback response:', res.statusCode, data.substring(0, 200));
            });
          }).on('error', (e) => {
            console.log('  Callback error:', e.message);
          });
        } else {
          console.log('  Following redirect to:', redirectUrl);
          followRedirect(redirectUrl, cookies);
        }
      } else {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          console.log('  Final response body:', data.substring(0, 500));
        });
      }
    }).on('error', (e) => {
      console.log('  Error:', e.message);
    });
  }
  
  followRedirect(currentUrl, cookies);
  
  // Timeout
  setTimeout(() => {
    console.log('\nTimeout waiting for auth callback');
    callbackServer.close();
    process.exit(1);
  }, 30000);
});
