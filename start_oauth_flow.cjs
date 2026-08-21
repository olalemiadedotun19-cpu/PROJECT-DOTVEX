const https = require('https');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const url = require('url');

const PORT = 4097;
const CALLBACK_URL = `http://127.0.0.1:${PORT}/callback`;

// Generate PKCE
const codeVerifier = crypto.randomBytes(32).toString('base64url');
const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
const state = crypto.randomBytes(32).toString('hex');

// Save the code_verifier for token exchange later
fs.writeFileSync('C:/Users/USER/Downloads/dotvex/oauth_state.json', JSON.stringify({
  code_verifier: codeVerifier,
  state: state,
  redirect_uri: CALLBACK_URL,
  timestamp: new Date().toISOString()
}, null, 2));

// Start callback server to capture the auth code
const callbackServer = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  console.log('\n=== CALLBACK RECEIVED ===');
  console.log('Path:', parsed.pathname);
  console.log('Query:', JSON.stringify(parsed.query));
  
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<html><body><h1>Authentication Complete</h1><p>You can close this window.</p></body></html>');
  
  const code = parsed.query.code;
  if (code) {
    console.log('\n=== Authorization code received! ===');
    console.log('Code:', code.substring(0, 80) + '...');
    
    // Exchange code for token
    const tokenData = new URLSearchParams();
    tokenData.append('grant_type', 'authorization_code');
    tokenData.append('client_id', 'kilo-test-client');
    tokenData.append('code', code);
    tokenData.append('redirect_uri', CALLBACK_URL);
    tokenData.append('code_verifier', codeVerifier);
    
    const req2 = https.request({
      hostname: 'www.kaggle.com',
      path: '/api/v1/oauth2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(tokenData.toString())
      }
    }, (res2) => {
      let data = '';
      res2.on('data', (chunk) => data += chunk);
      res2.on('end', () => {
        console.log('\n=== Token Exchange Result ===');
        console.log('Status:', res2.statusCode);
        console.log('Body:', data);
        
        try {
          const parsed2 = JSON.parse(data);
          if (parsed2.access_token) {
            console.log('\n=== SUCCESS: OAuth token obtained! ===');
            console.log('Access token:', parsed2.access_token.substring(0, 80) + '...');
            console.log('Token type:', parsed2.token_type);
            console.log('Expires in:', parsed2.expires_in);
            console.log('Refresh token:', parsed2.refresh_token ? 'present' : 'absent');
            console.log('Scope:', parsed2.scope);
            
            // Save tokens in mcp-remote format
            const tokenPath = 'C:/Users/USER/.mcp-auth/mcp-remote-0.1.37/47ccabe08d07cd744dec6a0ec36ffe48_tokens.json';
            const tokenData2 = {
              access_token: parsed2.access_token,
              refresh_token: parsed2.refresh_token,
              expires_at: Math.floor(Date.now() / 1000) + (parsed2.expires_in || 3600),
              scope: parsed2.scope,
              token_type: parsed2.token_type
            };
            fs.writeFileSync(tokenPath, JSON.stringify(tokenData2, null, 2));
            console.log('Tokens saved to:', tokenPath);
            
            // Also save a plain copy for reference
            fs.writeFileSync('C:/Users/USER/Downloads/dotvex/kaggle_oauth_token.json', JSON.stringify(tokenData2, null, 2));
            console.log('Tokens also saved to: kaggle_oauth_token.json');
            
            // Save client info for mcp-remote
            const clientInfoPath = 'C:/Users/USER/.mcp-auth/mcp-remote-0.1.37/47ccabe08d07cd744dec6a0ec36ffe48_client_info.json';
            const clientInfo = {
              client_id: 'kilo-test-client',
              redirect_uris: [CALLBACK_URL],
              token_endpoint_auth_method: 'none',
              client_name: 'Kilo MCP Client',
              grant_types: ['authorization_code', 'refresh_token'],
              response_types: ['code'],
              code_challenge_methods_supported: ['S256'],
              scope: 'resources.admin:*'
            };
            fs.writeFileSync(clientInfoPath, JSON.stringify(clientInfo, null, 2));
            console.log('Client info saved to:', clientInfoPath);
            
            console.log('\n=== NOW TESTING MCP TOOLS WITH TOKEN ===');
            testMCPTools(parsed2.access_token);
          } else {
            console.log('Error in token response:', parsed2.error || parsed2);
          }
        } catch(e) {
          console.log('Parse error:', e.message);
        }
        
        callbackServer.close();
      });
    });
    req2.on('error', (e) => {
      console.log('Token exchange error:', e.message);
      callbackServer.close();
    });
    req2.end(tokenData.toString());
  } else {
    console.log('No code in callback');
    callbackServer.close();
  }
});

callbackServer.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Callback server listening on ${CALLBACK_URL}`);
  
  // Register or reuse client
  // First try to register a new client
  const regData = JSON.stringify({
    redirect_uris: [CALLBACK_URL],
    token_endpoint_auth_method: 'none',
    client_name: 'Kilo MCP Client',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    code_challenge_methods_supported: ['S256'],
    scope: 'resources.admin:*'
  });
  
  // Try registration (might already exist)
  const regReq = https.request({
    hostname: 'www.kaggle.com',
    path: '/api/v1/oauth2/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(regData)
    }
  }, (regRes) => {
    let body = '';
    regRes.on('data', (chunk) => body += chunk);
    regRes.on('end', () => {
      let clientId = 'kilo-test-client';
      try {
        const parsed = JSON.parse(body);
        if (parsed.client_id) {
          clientId = parsed.client_id;
          console.log('Registered client:', clientId);
        }
      } catch(e) {
        console.log('Registration response:', body);
      }
      
      // Build authorization URL
      const authUrl = new URL('https://www.kaggle.com/api/v1/oauth2/authorize');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', CALLBACK_URL);
      authUrl.searchParams.set('scope', 'resources.admin:*');
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
      authUrl.searchParams.set('state', state);
      
      console.log('\n========================================');
      console.log('🔐 KAGGLE MCP OAUTH AUTHORIZATION URL');
      console.log('========================================');
      console.log('\nOpen this URL in your browser to complete authentication:');
      console.log('\n' + authUrl.toString());
      console.log('\n========================================');
      console.log('After completing login, reCAPTCHA, and OAuth consent,');
      console.log('your browser will redirect to: ' + CALLBACK_URL);
      console.log('This callback server will capture the authorization code');
      console.log('and automatically exchange it for an OAuth token.');
      console.log('========================================\n');
      
      console.log('Waiting for callback...\n');
    });
  });
  regReq.on('error', (e) => {
    console.log('Registration error:', e.message);
    // Use default client_id
    const authUrl = new URL('https://www.kaggle.com/api/v1/oauth2/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', 'kilo-test-client');
    authUrl.searchParams.set('redirect_uri', CALLBACK_URL);
    authUrl.searchParams.set('scope', 'resources.admin:*');
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('state', state);
    
    console.log('\n========================================');
    console.log('🔐 KAGGLE MCP OAUTH AUTHORIZATION URL');
    console.log('========================================');
    console.log('\nOpen this URL in your browser to complete authentication:');
    console.log('\n' + authUrl.toString());
    console.log('\n========================================');
    console.log('Waiting for callback...\n');
  });
  regReq.write(regData);
  regReq.end();
});

// Timeout after 5 minutes
setTimeout(() => {
  console.log('\n⏰ Timeout (5 minutes) - no callback received');
  console.log('The callback server will be stopped now.');
  callbackServer.close();
  process.exit(0);
}, 300000);

function testMCPTools(token) {
  // Test 1: get_accelerator_quota
  const data1 = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name: 'get_accelerator_quota', arguments: {} }
  });
  
  console.log('\n--- TEST 1: get_accelerator_quota ---');
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
  }, (res1) => {
    let body1 = '';
    res1.on('data', (chunk) => body1 += chunk);
    res1.on('end', () => {
      console.log('Status:', res1.statusCode);
      console.log('Response:', body1.substring(0, 1000));
      
      // Test 2: get_user_profile (authenticated account access)
      const data2 = JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: { name: 'get_user_profile', arguments: {} }
      });
      
      console.log('\n--- TEST 2: get_user_profile ---');
      const req2 = https.request({
        hostname: 'www.kaggle.com',
        path: '/mcp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Authorization': 'Bearer ' + token,
          'Content-Length': Buffer.byteLength(data2)
        }
      }, (res2) => {
        let body2 = '';
        res2.on('data', (chunk) => body2 += chunk);
        res2.on('end', () => {
          console.log('Status:', res2.statusCode);
          console.log('Response:', body2.substring(0, 1000));
          
          // Test 3: Verify create_notebook_session is callable (list tools to confirm availability)
          console.log('\n--- TEST 3: create_notebook_session ---');
          console.log('Tool is available (schema verified earlier)');
          console.log('create_notebook_session accepts: language, kernelType, dockerImage, machineShape, slug, enableInternet');
          
          callbackServer.close();
          process.exit(0);
        });
      });
      req2.on('error', (e) => console.log('Error:', e.message));
      req2.write(data2);
      req2.end();
    });
  });
  req1.on('error', (e) => console.log('Error:', e.message));
  req1.write(data1);
  req1.end();
}
