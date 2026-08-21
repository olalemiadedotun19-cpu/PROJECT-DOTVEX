const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { exec } = require('child_process');
const fs = require('fs');

const CALLBACK_PORT = 21715;
const CALLBACK_PATH = '/oauth/callback';

// Generate PKCE challenge
const codeVerifier = crypto.randomBytes(32).toString('base64url');
const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
const state = crypto.randomUUID();

const params = new URLSearchParams({
  client_id: 'dotvex-kaggle-mcp-client',
  redirect_uri: `http://localhost:${CALLBACK_PORT}${CALLBACK_PATH}`,
  response_type: 'code',
  scope: 'resources.admin:*',
  state: state,
  code_challenge: codeChallenge,
  code_challenge_method: 'S256'
});

const authUrl = `https://www.kaggle.com/api/v1/oauth2/authorize?${params.toString()}`;

// Save state for token exchange
fs.writeFileSync('C:/Users/USER/Downloads/dotvex/oauth_state.json', JSON.stringify({
  codeVerifier,
  state,
  clientId: 'dotvex-kaggle-mcp-client',
  redirectUri: `http://localhost:${CALLBACK_PORT}${CALLBACK_PATH}`
}, null, 2));

// Create callback server
const server = http.createServer((req, res) => {
  if (req.url.startsWith(CALLBACK_PATH)) {
    const url = new URL(req.url, `http://localhost:${CALLBACK_PORT}`);
    const code = url.searchParams.get('code');
    const returnedState = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    console.log('\n=== CALLBACK RECEIVED ===');
    console.log('URL:', req.url);
    console.log('State:', returnedState);
    console.log('Code:', code ? code.substring(0, 20) + '...' : 'NONE');
    console.log('Error:', error || 'none');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`<h1>Authorization Failed</h1><p>Error: ${error}</p><p>You can close this window.</p>`);
      console.log('\nAuthorization failed:', error);
      server.close();
      process.exit(1);
    }

    if (returnedState !== state) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`<h1>State Mismatch</h1><p>Expected: ${state}</p><p>Got: ${returnedState}</p>`);
      console.log('\nState mismatch!');
      server.close();
      process.exit(1);
    }

    // Save authorization code
    fs.writeFileSync('C:/Users/USER/Downloads/dotvex/oauth_code.json', JSON.stringify({
      code,
      state: returnedState,
      timestamp: Date.now()
    }, null, 2));

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <h1>✓ Authorization Successful!</h1>
      <p>You can close this window.</p>
      <p>Code received: ${code ? code.substring(0, 20) + '...' : 'NONE'}</p>
      <script>setTimeout(() => window.close(), 3000)</script>
    `);

    console.log('\n✓ Authorization code saved to oauth_code.json');
    console.log('✓ You can close the browser window');
    
    server.close();
    process.exit(0);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(CALLBACK_PORT, () => {
  console.log('Callback server listening on port', CALLBACK_PORT);
  console.log('\n=== OPENING AUTHORIZATION URL ===');
  console.log('Auth URL:', authUrl);
  console.log('\nWaiting for authorization...');
  console.log('Please click "Authorize" in the browser window.');
  console.log('This window will stay open until you complete authorization.\n');

  // Open Chrome
  setTimeout(() => {
    exec(`start chrome "${authUrl}"`, (error) => {
      if (error) {
        console.log('Could not open Chrome automatically:', error.message);
        console.log('\nPlease open this URL manually:');
        console.log(authUrl);
      } else {
        console.log('Chrome opened. Please complete authorization.');
      }
    });
  }, 500);
});

// Handle server close
server.on('close', () => {
  console.log('\nCallback server closed.');
});

// Keep process alive
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  server.close();
  process.exit(0);
});

console.log('Press Ctrl+C to cancel at any time.');
