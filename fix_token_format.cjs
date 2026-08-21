const fs = require('fs');

// Read the token we saved
const tokenFile = 'C:/Users/USER/.mcp-auth/mcp-remote-0.1.37/47ccabe08d07cd744dec6a0ec36ffe48_tokens.json';
const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));

console.log('Current token file:', JSON.stringify(tokens, null, 2).substring(0, 300));

// Fix: mcp-remote expects expires_in (relative seconds), not expires_at (absolute timestamp)
const fixedTokens = {
  access_token: tokens.access_token,
  refresh_token: tokens.refresh_token,
  expires_in: 10800,  // 3 hours (10800 seconds)
  scope: tokens.scope,
  token_type: tokens.token_type
};

fs.writeFileSync(tokenFile, JSON.stringify(fixedTokens, null, 2));
console.log('Fixed token file:', JSON.stringify(fixedTokens, null, 2).substring(0, 300));

// Also save the client info in the correct format
const clientInfoPath = 'C:/Users/USER/.mcp-auth/mcp-remote-0.1.37/47ccabe08d07cd744dec6a0ec36ffe48_client_info.json';
const clientInfo = {
  client_id: 'kilo-mcp-client',
  redirect_uris: ['http://127.0.0.1:4097/callback'],
  token_endpoint_auth_method: 'none',
  client_name: 'MCP Remote Client',
  grant_types: ['authorization_code', 'refresh_token'],
  response_types: ['code'],
  code_challenge_methods_supported: ['S256']
};
fs.writeFileSync(clientInfoPath, JSON.stringify(clientInfo, null, 2));
console.log('Client info saved:', clientInfoPath);

console.log('\nToken file fixed. Now retrying with mcp-remote proxy...');
