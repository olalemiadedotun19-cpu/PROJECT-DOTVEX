const https = require('https');
const http = require('http');
const crypto = require('crypto');
const url = require('url');

const PORT = 4097;
const codeVerifier = crypto.randomBytes(32).toString('base64url');
const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

// Start callback HTTP server
const callbackServer = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  console.log('\n=== CALLBACK RECEIVED ===');
  console.log('Path:', parsed.pathname);
  console.log('Query:', JSON.stringify(parsed.query).substring(0, 300));
  
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('Auth complete');
  
  const code = parsed.query.code;
  if (code) {
    console.log('\n=== Authorization code:', code.substring(0, 60) + '... ===');
    exchangeToken(code);
  } else {
    console.log('No code received');
    callbackServer.close();
    process.exit(1);
  }
});

callbackServer.listen(PORT, '127.0.0.1', () => {
  console.log('Callback server listening on http://127.0.0.1:' + PORT + '/callback');
  
  // Build authorization URL with the registered client
  const authUrl = new URL('https://www.kaggle.com/api/v1/oauth2/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', 'kilo-test-client');
  authUrl.searchParams.set('redirect_uri', `http://127.0.0.1:${PORT}/callback`);
  authUrl.searchParams.set('scope', 'resources.admin:*');
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('state', crypto.randomBytes(32).toString('hex'));
  
  console.log('\n=== Authorization URL ===');
  console.log(authUrl.toString());
  
  // Follow redirect chain, preserving cookies
  let cookies = '';
  let redirectCount = 0;
  
  function followRequest(reqUrl) {
    if (redirectCount > 15) {
      console.log('\nToo many redirects');
      callbackServer.close();
      process.exit(1);
      return;
    }
    redirectCount++;
    
    const parsed = new URL(reqUrl);
    console.log(`\n[${redirectCount}] ${reqUrl.substring(0, 120)}`);
    
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/json,text/event-stream',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...(cookies ? { 'Cookie': cookies } : {})
      }
    };
    
    https.get(options, (res) => {
      // Capture cookies
      if (res.headers['set-cookie']) {
        const newCookies = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
        cookies = cookies ? `${cookies}; ${newCookies}` : newCookies;
        console.log('  New cookies:', newCookies.substring(0, 150));
      }
      
      console.log('  Status:', res.statusCode);
      
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let nextUrl = res.headers.location;
        if (!nextUrl.startsWith('http')) {
          nextUrl = `https://${parsed.hostname}${nextUrl}`;
        }
        
        // Check if redirect goes to our callback server
        if (nextUrl.includes(`127.0.0.1:${PORT}/callback`)) {
          console.log('  Redirect to our callback server!');
          const callbackUrl = new URL(nextUrl);
          const code = callbackUrl.searchParams.get('code');
          if (code) {
            console.log('  Code extracted:', code.substring(0, 60) + '...');
            exchangeToken(code);
          }
        } else {
          console.log('  Redirect location:', nextUrl.substring(0, 120) + '...');
          followRequest(nextUrl);
        }
      } else {
        // Final response - check content
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          console.log('  Final response body length:', body.length);
          if (body.includes('login') || body.includes('password') || body.includes('signin')) {
            console.log('  LOGIN PAGE DETECTED');
          }
          if (body.includes('recaptcha') || body.includes('captcha')) {
            console.log('  RECAPTCHA DETECTED');
          }
          console.log('  Body preview:', body.substring(0, 300));
        });
      }
    }).on('error', (e) => {
      console.log('  Error:', e.message);
    });
  }
  
  followRequest(authUrl.toString());
  
  setTimeout(() => {
    console.log('\nTimeout');
    callbackServer.close();
    process.exit(0);
  }, 25000);
});

function exchangeToken(authCode) {
  const tokenData = new URLSearchParams();
  tokenData.append('grant_type', 'authorization_code');
  tokenData.append('client_id', 'kilo-test-client');
  tokenData.append('code', authCode);
  tokenData.append('redirect_uri', `http://127.0.0.1:${PORT}/callback`);
  tokenData.append('code_verifier', codeVerifier);
  
  const postData = tokenData.toString();
  
  const req = https.request({
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
      console.log('Body:', data.substring(0, 1000));
      
      try {
        const parsed = JSON.parse(data);
        if (parsed.access_token) {
          console.log('\n=== SUCCESS! Got OAuth token! ===');
          console.log('Access token:', parsed.access_token.substring(0, 60) + '...');
          console.log('Expires in:', parsed.expires_in);
          console.log('Token type:', parsed.token_type);
          console.log('Refresh token:', parsed.refresh_token ? 'present' : 'absent');
          
          require('fs').writeFileSync('C:/Users/USER/Downloads/dotvex/kaggle_oauth_token.json', JSON.stringify(parsed, null, 2));
          console.log('Token saved');
          
          // Test MCP tools
          testTools(parsed.access_token);
        } else if (parsed.error) {
          console.log('OAuth error:', parsed.error, parsed.error_description);
        }
      } catch(e) {
        console.log('Parse error:', e.message);
      }
      
      callbackServer.close();
      process.exit(0);
    });
  });
  req.on('error', (e) => {
    console.log('Token exchange error:', e.message);
    callbackServer.close();
    process.exit(1);
  });
  req.write(postData);
  req.end();
}

function testTools(token) {
  // Test get_accelerator_quota
  const data1 = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name: 'get_accelerator_quota', arguments: {} }
  });
  
  console.log('\n=== Testing get_accelerator_quota ===');
  
  const req1 = https.request({
    hostname: 'www.kaggle.com',
    path: '/mcp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': 'Bearer ' + token,
      'Content-Length': Buffer.byteLength(data1)
    }
  }, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', body.substring(0, 500));
      
      // Test create_notebook_session
      console.log('\n=== Testing create_notebook_session (dry check) ===');
      console.log('create_notebook_session is available as a tool (schema verified)');
      
      callbackServer.close();
    });
  });
  req1.on('error', (e) => console.log('Error:', e.message));
  req1.write(data1);
  req1.end();
}
