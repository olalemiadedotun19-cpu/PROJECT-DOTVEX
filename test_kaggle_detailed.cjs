const { spawn } = require('child_process');

const proc = spawn('node', [
  'C:/Users/USER/AppData/Roaming/npm/node_modules/mcp-remote/dist/proxy.js',
  'https://www.kaggle.com/mcp',
  '--debug',
  '--port', '9472'
], {
  env: {
    ...process.env,
    HOME: 'C:/Users/USER',
    USERPROFILE: 'C:/Users/USER',
    MCP_REMOTE_CONFIG_DIR: 'C:/Users/USER/.mcp-auth',
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

let requestId = 0;
const pendingRequests = new Map();
let outputBuffer = '';

proc.stdout.on('data', (data) => {
  outputBuffer += data.toString();
  let idx;
  while ((idx = outputBuffer.indexOf('\n')) !== -1) {
    const line = outputBuffer.substring(0, idx).trim();
    outputBuffer = outputBuffer.substring(idx + 1);
    if (line.startsWith('{')) {
      try {
        const msg = JSON.parse(line);
        if (msg.id !== undefined && msg.id !== null) {
          const p = pendingRequests.get(msg.id);
          if (p) { clearTimeout(p.timeout); pendingRequests.delete(msg.id); }
          if (msg.result) p.resolve(msg.result);
          else if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
        }
      } catch(e) {}
    }
  }
});

proc.stderr.on('data', (data) => {
  process.stderr.write('[mcp-remote] ' + data);
});

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function sendRequest(method, params = {}) {
  const id = requestId++;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error('Timeout for ' + method));
    }, 15000);
    pendingRequests.set(id, { resolve, reject, timeout });
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}

(async () => {
  await sleep(4000);
  
  try {
    console.log('\n=== Initialize ===');
    const init = await sendRequest('initialize', {
      protocolVersion: '2025-03-26',
      capabilities: { tools: {}, resources: {}, prompts: {} },
      clientInfo: { name: 'kilo-test', version: '1.0.0' }
    });
    console.log('Server info:', JSON.stringify(init.serverInfo));
    console.log('Capabilities:', JSON.stringify(init.capabilities));
    
    // Try calling get_accelerator_quota
    console.log('\n=== get_accelerator_quota ===');
    const result = await sendRequest('tools/call', {
      name: 'get_accelerator_quota',
      arguments: {}
    });
    
    // Print detailed result
    console.log('Full result:', JSON.stringify(result, null, 2));
    
    // Check if there's more detail in the error
    if (result.content) {
      result.content.forEach(c => {
        console.log('Content type:', c.type);
        console.log('Content text:', c.text || c);
      });
    }
    if (result.isError) {
      console.log('isError: true');
    }
    
    // Also try get_user_profile to check auth
    console.log('\n=== get_user_profile ===');
    try {
      const profile = await sendRequest('tools/call', {
        name: 'get_user_profile',
        arguments: { request: { userName: 'olalemiadedotun19' } }
      });
      console.log('Profile result:', JSON.stringify(profile, null, 2));
    } catch(e) {
      console.log('Profile error:', e.message);
    }
    
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    proc.kill();
  }
})();
