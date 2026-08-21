// Start mcp-remote as a proxy on port 4099, using the cached tokens
// Then send MCP protocol messages through it
const { spawn } = require('child_process');
const http = require('http');

// Start mcp-remote
const proc = spawn('node', [
  'C:/Users/USER/AppData/Roaming/npm/node_modules/mcp-remote/dist/client.js',
  'https://www.kaggle.com/mcp',
  '--port', '4099',
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

// Wait for mcp-remote to be ready, then send a tool call
setTimeout(() => {
  console.log('=== Sending MCP initialize through mcp-remote proxy ===');
  
  // Send initialize + tools/call through the proxy
  const data = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name: 'get_accelerator_quota', arguments: {} }
  });
  
  const req = http.request({
    hostname: '127.0.0.1',
    port: 4099,
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
      console.log('Proxy response status:', res.statusCode);
      console.log('Proxy response headers:', JSON.stringify(res.headers));
      console.log('Proxy response body:', body.substring(0, 1000));
      
      // Also try initialize
      const initData = JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: { tools: {} },
          clientInfo: { name: 'test', version: '1.0.0' }
        }
      });
      
      const req2 = http.request({
        hostname: '127.0.0.1',
        port: 4099,
        path: '/mcp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Content-Length': Buffer.byteLength(initData)
        }
      }, (res2) => {
        let body2 = '';
        res2.on('data', (chunk) => body2 += chunk);
        res2.on('end', () => {
          console.log('\nInitialize response:', body2.substring(0, 500));
          proc.kill();
          process.exit(0);
        });
      });
      req2.on('error', (e) => console.log('Init error:', e.message));
      req2.write(initData);
      req2.end();
    });
  });
  req.on('error', (e) => console.log('Proxy error:', e.message));
  req.write(data);
  req.end();
}, 5000);

// Capture output
proc.stdout.on('data', (data) => {
  output += data.toString();
  const text = data.toString().trim();
  if (text) {
    console.log('[mcp-remote stdout]:', text.substring(0, 200));
  }
});

proc.stderr.on('data', (data) => {
  output += data.toString();
  const text = data.toString().trim();
  if (text && (text.includes('auth') || text.includes('Auth') || text.includes('token') || text.includes('Token') || text.includes('error') || text.includes('Error') || text.includes('connect') || text.includes('Connect'))) {
    console.log('[mcp-remote stderr]:', text.substring(0, 200));
  }
});

proc.on('exit', (code) => {
  console.log('mcp-remote exited with code', code);
});

// Show full output after 10 seconds
setTimeout(() => {
  console.log('\n=== Full mcp-remote output ===');
  console.log(output.substring(0, 2000));
  proc.kill();
  process.exit(0);
}, 10000);
