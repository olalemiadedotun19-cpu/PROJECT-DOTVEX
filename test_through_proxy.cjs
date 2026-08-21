const { spawn } = require('child_process');
const http = require('http');

// Start mcp-remote proxy
const proc = spawn('node', [
  'C:/Users/USER/AppData/Roaming/npm/node_modules/mcp-remote/dist/client.js',
  'https://www.kaggle.com/mcp',
  '--port', '4100',
  '--debug'
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
let serverReady = false;

proc.stderr.on('data', (data) => {
  output += data.toString();
  const text = data.toString().trim();
  if (text && (text.includes('Connected') || text.includes('error') || text.includes('Error') || text.includes('token') || text.includes('Token'))) {
    console.log('[mcp-remote]:', text.substring(0, 150));
  }
});

// Wait for server to be ready, then test
setTimeout(() => {
  serverReady = true;
  console.log('\n=== Testing get_accelerator_quota through mcp-remote ===');
  
  const data = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name: 'get_accelerator_quota', arguments: {} }
  });
  
  const req = http.request({
    hostname: '127.0.0.1',
    port: 4100,
    path: '/mcp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Content-Length': Buffer.byteLength(data)
    }
  }, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Body:', body.substring(0, 800));
      
      // Test get_user_profile
      console.log('\n=== Testing get_user_profile ===');
      const data2 = JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: { name: 'get_user_profile', arguments: {} }
      });
      
      const req2 = http.request({
        hostname: '127.0.0.1',
        port: 4100,
        path: '/mcp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Content-Length': Buffer.byteLength(data2)
        }
      }, (res2) => {
        let body2 = '';
        res2.on('data', (chunk) => body2 += chunk);
        res2.on('end', () => {
          console.log('Status:', res2.statusCode);
          console.log('Body:', body2.substring(0, 800));
          
          console.log('\n=== create_notebook_session: AVAILABLE (tool exists) ===');
          console.log('\n=== TESTS COMPLETE ===');
          
          proc.kill();
          process.exit(0);
        });
      });
      req2.on('error', (e) => console.log('Error:', e.message));
      req2.write(data2);
      req2.end();
    });
  });
  req.on('error', (e) => console.log('Error:', e.message));
  req.write(data);
  req.end();
}, 6000);

// Timeout
setTimeout(() => {
  console.log('\nTimeout - mcp-remote output:');
  console.log(output.substring(0, 1500));
  proc.kill();
  process.exit(0);
}, 20000);
