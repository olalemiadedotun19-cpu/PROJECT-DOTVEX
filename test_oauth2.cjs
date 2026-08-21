const { spawn } = require('child_process');
const readline = require('readline');

// Start mcp-remote with detailed output
const proc = spawn('node', [
  'C:/Users/USER/AppData/Roaming/npm/node_modules/mcp-remote/dist/proxy.js',
  'https://www.kaggle.com/mcp',
  '--port', '9472'
], {
  env: {
    ...process.env,
    HOME: 'C:/Users/USER',
    USERPROFILE: 'C:/Users/USER',
    BROWSER: 'none', // Prevent browser opening
    MCP_REMOTE_CONFIG_DIR: 'C:/Users/USER/.mcp-auth',
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

let allOutput = '';
let timer = setTimeout(() => {
  console.log('=== Complete output ===');
  console.log(allOutput);
  proc.kill();
  process.exit(0);
}, 30000);

proc.stdout.on('data', (data) => {
  const text = data.toString().trim();
  allOutput += text + '\n';
  console.log('[stdout]', text);
});

proc.stderr.on('data', (data) => {
  const text = data.toString().trim();
  allOutput += text + '\n';
  console.log('[stderr]', text);
});

proc.on('exit', (code) => {
  clearTimeout(timer);
  console.log('=== Process exited with code', code, '===');
});

// Also try to communicate via MCP protocol
let requestId = 0;
const pendingRequests = new Map();

proc.stdout.on('data', (data) => {
  // Parse MCP responses
  const text = data.toString();
  const lines = text.trim().split('\n');
  for (const line of lines) {
    if (line.startsWith('{')) {
      try {
        const msg = JSON.parse(line);
        if (msg.id !== undefined && msg.id !== null) {
          const p = pendingRequests.get(msg.id);
          if (p) {
            clearTimeout(p.timeout);
            pendingRequests.delete(msg.id);
            if (msg.result) p.resolve(msg.result);
            else if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
          }
        }
      } catch(e) {}
    }
  }
});

async function sendRequest(method, params = {}) {
  const id = requestId++;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error('Timeout for ' + method));
    }, 10000);
    pendingRequests.set(id, { resolve, reject, timeout });
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}

async function main() {
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    console.log('\n=== Sending initialize ===');
    await sendRequest('initialize', {
      protocolVersion: '2025-03-26',
      capabilities: { tools: {} },
      clientInfo: { name: 'test', version: '1.0.0' }
    });
    
    console.log('\n=== Calling get_accelerator_quota ===');
    const result = await sendRequest('tools/call', {
      name: 'get_accelerator_quota',
      arguments: {}
    });
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch(e) {
    console.error('Error:', e.message);
  }
}

setTimeout(() => main(), 5000);
