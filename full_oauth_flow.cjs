const https = require('https');
const http = require('http');
const crypto = require('crypto');
const url = require('url');

// Step 1: Generate PKCE
const codeVerifier = crypto.randomBytes(32).toString('base64url');
const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

// Step 2: Register/reuse client
async function registerClient() {
  const data = JSON.stringify({
    redirect_uris: ['http://127.0.0.1:4098/callback'],
    token_endpoint_auth_method: 'none',
    client_name: 'Kilo MCP Client',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    code_challenge_methods_supported: ['S256'],
    scope: 'resources.admin:*'
  });
  
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'www.kaggle.com',
      path: '/api/v1/oauth2/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          console.log('Client registered:', parsed.client_id);
          resolve('kilo-test-client');
        } catch(e) {
          console.log('Registration response:', body);
          resolve('kilo-test-client');
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Step 3: OAuth flow with cookie preservation
async function oauthFlow(clientId) {
  // Build authorization URL
  const authUrl = new URL('https://www.kaggle.com/api/v1/oauth2/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', 'http://127.0.0.1:4098/callback');
  authUrl.searchParams.set('scope', 'resources.admin:*');
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('state', crypto.randomBytes(32).toString('hex'));

  console.log('Authorization URL:', authUrl.toString());
  
  // Start callback server
  const callbackServer = http.createServer((req, res) => {
    const parsed = url.parse(req.url, true);
    console.log('\n=== CALLBACK RECEIVED ===');
    console.log('Query:', JSON.stringify(parsed.query));
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('Auth complete. You can close this window.');
    
    const code = parsed.query.code;
    if (code) {
      console.log('Authorization code received:', code.substring(0, 50) + '...');
      exchangeToken(code, callbackServer);
    } else {
      callbackServer.close();
      process.exit(1);
    }
  });

  await new Promise(resolve => callbackServer.listen(4098, resolve));
  console.log('Callback server listening on http://127.0.0.1:4098/callback');
  
  // Follow redirect chain with cookie preservation
  let cookies = '';
  let currentUrl = authUrl.toString();
  let redirectCount = 0;
  
  function followRequest(reqUrl, cookieHeader) {
    if (redirectCount > 10) {
      console.log('Too many redirects');
      callbackServer.close();
      process.exit(1);
      return;
    }
    redirectCount++;
    
    const parsed = new URL(reqUrl);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/json,text/event-stream',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {})
      }
    };
    
    https.get(options, (res) => {
      console.log(`  [${redirectCount}] ${res.statusCode} ${res.headers.location || '(no redirect)'}`);
      
      // Capture cookies
      if (res.headers['set-cookie']) {
        const newCookies = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
        cookies = cookies ? `${cookies}; ${newCookies}` : newCookies;
        console.log('  Cookies:', newCookies.substring(0, 100));
      }
      
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let nextUrl = res.headers.location;
        if (!nextUrl.startsWith('http')) {
          nextUrl = `https://${parsed.hostname}${nextUrl}`;
        }
        
        // Check if redirect goes to our callback
        if (nextUrl.includes('127.0.0.1:4098/callback')) {
          console.log('  Redirecting to our callback server! Making request...');
          // The HTTP request will go to localhost, not the callback server
          // We need to extract the code from the redirect URL
          const callbackUrl = new URL(nextUrl);
          const code = callbackUrl.searchParams.get('code');
          if (code) {
            console.log('  Code extracted from redirect:', code.substring(0, 50) + '...');
            exchangeToken(code, callbackServer);
          } else {
            console.log('  No code in redirect');
          }
        } else {
          console.log('  Following redirect:', nextUrl.substring(0, 100) + '...');
          // Consume response
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => {
            followRequest(nextUrl, cookies);
          });
        }
      } else {
        // Final response
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          console.log('  Final status:', res.statusCode);
          console.log('  Body:', body.substring(0, 500));
          
          // Check for login form
          if (body.includes('login') || body.includes('password') || body.includes('signin')) {
            console.log('  LOGIN PAGE DETECTED');
          }
        });
      }
    }).on('error', (e) => {
      console.log('  Error:', e.message);
    });
  }
  
  // Start the flow
  console.log('\n=== Starting OAuth flow ===');
  followRequest(currentUrl, '');
  
  // Timeout
  setTimeout(() => {
    console.log('Timeout');
    callbackServer.close();
    process.exit(0);
  }, 25000);
}

function exchangeToken(authCode, server) {
  const tokenData = new URLSearchParams();
  tokenData.append('grant_type', 'authorization_code');
  tokenData.append('client_id', 'kilo-test-client');
  tokenData.append('code', authCode);
  tokenData.append('redirect_uri', 'http://127.0.0.1:4098/callback');
  tokenData.append('code_verifier', codeVerifier);
  
  const postData = tokenData.toString();
  
  https.request({
    hostname: 'www.kaggle.com',
    path: '/api/v1/oauth2/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('\n=== Token Exchange Result ===');
      console.log('Status:', res.statusCode);
      console.log('Body:', data);
      
      try {
        const parsed = JSON.parse(data);
        if (parsed.access_token) {
          console.log('\n=== SUCCESS! Got OAuth token! ===');
          console.log('Access token:', parsed.access_token.substring(0, 50) + '...');
          console.log('Expires in:', parsed.expires_in);
          console.log('Token type:', parsed.token_type);
          console.log('Scope:', parsed.scope);
          console.log('Refresh token:', parsed.refresh_token ? 'present' : 'absent');
          
          // Save full token response
          require('fs').writeFileSync('C:/Users/USER/Downloads/dotvex/kaggle_oauth_token.json', JSON.stringify(parsed, null, 2));
          console.log('Token saved to kaggle_oauth_token.json');
          
          // Now test the MCP tools with this token
          console.log('\n=== Testing MCP tools with token ===');
          testToolsWithToken(parsed.access_token);
        }
      } catch(e) {
        console.log('Parse error:', e.message);
      }
      
      server.close();
      process.exit(0);
    });
  }).on('error', (e) => {
    console.log('Token exchange error:', e.message);
    server.close();
    process.exit(1);
  }).end(postData);
}

async function testToolsWithToken(token) {
  const data = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name: 'get_accelerator_quota', arguments: {} }
  });
  
  const options = {
    hostname: 'www.kaggle.com',
    path: '/mcp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${token}`,
      'Content-Length': Buffer.byteLength(data)
    }
  };
  
  const req = https.request(options, (res) => {
    let responseBody = '';
    res.on('data', (chunk) => responseBody += chunk);
    res.on('end', () => {
      console.log('get_accelerator_quota with token:');
      console.log('Status:', res.statusCode);
      console.log('Body:', responseBody.substring(0, 500));
    });
  });
  req.on('error', (e) => console.log('Error:', e.message));
  req.write(data);
  req.end();
}

(async () => {
  console.log('=== Registering OAuth client ===');
  const clientId = await registerClient();
  console.log('\n=== Starting OAuth flow ===');
  await oauthFlow(clientId);
})();
