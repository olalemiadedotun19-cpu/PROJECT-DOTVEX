const { spawn } = require('child_process');
const crypto = require('crypto');

// Generate PKCE
const codeVerifier = crypto.randomBytes(32).toString('base64url');
const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

// Create static OAuth client info
const staticOAuthClientInfo = JSON.stringify({
  client_id: 'kilo-test-client',
  client_secret: ''
});

// Create static OAuth client metadata
const staticOAuthClientMetadata = JSON.stringify({
  redirect_uris: ['http://127.0.0.1:4097/callback'],
  token_endpoint_auth_method: 'none',
  client_name: 'Kilo MCP Client',
  grant_types: ['authorization_code', 'refresh_token'],
  response_types: ['code'],
  code_challenge_methods_supported: ['S256'],
  scope: 'resources.admin:*'
});

// Start mcp-remote client with static OAuth client info
// This should force the OAuth flow
const proc = spawn('node', [
  'C:/Users/USER/AppData/Roaming/npm/node_modules/mcp-remote/dist/client.js',
  'https://www.kaggle.com/mcp',
  '--port', '4097',
  '--debug',
  '--static-oauth-client-info', staticOAuthClientInfo,
  '--static-oauth-client-metadata', staticOAuthClientMetadata,
  '--auth-timeout', '15'
], {
  env: {
    ...process.env,
    HOME: 'C:/Users/USER',
    USERPROFILE: 'C:/Users/USER',
    MCP_REMOTE_CONFIG_DIR: 'C:/Users/USER/.mcp-auth',
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let timer = setTimeout(() => {
  console.log('=== Output after 20s ===');
  console.log(output);
  proc.kill();
  process.exit(0);
}, 20000);

proc.stdout.on('data', (data) => {
  output += data.toString();
  console.log('[stdout]', data.toString().trim());
});

proc.stderr.on('data', (data) => {
  output += data.toString();
  console.log('[stderr]', data.toString().trim());
});

proc.on('exit', (code) => {
  clearTimeout(timer);
  console.log('=== Exited with code', code, '===');
  // Print full output
  console.log('\n=== Full output ===');
  console.log(output);
  process.exit(0);
});
