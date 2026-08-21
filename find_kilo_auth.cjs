const fs = require('fs');
const path = require('path');

// Read the extension's bundled code
const extDir = 'C:/Users/USER/.vscode/extensions/kilocode.kilo-code-7.4.23-win32-x64';
const extJs = fs.readFileSync(extDir + '/dist/extension.js', 'utf8');

// Search for auth-related patterns
const patterns = [
  'auth', 'password', 'token', 'Basic realm', '4096',
  'server', 'port', '--auth', 'apiKey', 'secret'
];

// Find lines with auth + server or port
const lines = extJs.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lower = line.toLowerCase();
  
  // Look for server startup with auth
  if ((lower.includes('auth') || lower.includes('server') || lower.includes('port')) && 
      (lower.includes('4096') || lower.includes('listen') || lower.includes('start')) &&
       !lower.includes('jsonrpc') && !lower.includes('protocol')) {
    console.log((i+1) + ': ' + line.trim().substring(0, 200));
  }
}

// Also search for the pattern of starting a server with auth
console.log('\n=== Searching for server start patterns ===');
const authIdx = extJs.indexOf('Basic realm');
if (authIdx !== -1) {
  console.log('Found "Basic realm" at index', authIdx);
  console.log('Context:', extJs.substring(Math.max(0, authIdx - 200), authIdx + 200));
}

// Search for port 4096
const portIdx = extJs.indexOf('4096');
if (portIdx !== -1) {
  console.log('\nFound "4096" at index', portIdx);
  console.log('Context:', extJs.substring(Math.max(0, portIdx - 200), portIdx + 200));
}

// Search for auth token generation
const authTokenIdx = extJs.toLowerCase().indexOf('auth');
if (authTokenIdx !== -1) {
  console.log('\nFound "auth" at index', authTokenIdx);
  console.log('Context:', extJs.substring(Math.max(0, authTokenIdx - 100), authTokenIdx + 300));
}
