const { spawn } = require('child_process');
const readline = require('readline');

// Start mcp-remote as an MCP server (STDIO transport)
const proc = spawn('node', [
  'C:/Users/USER/AppData/Roaming/npm/node_modules/mcp-remote/dist/proxy.js',
  'https://www.kaggle.com/mcp',
  '--port', '9472'
], {
  env: {
    ...process.env,
    HOME: 'C:/Users/USER',
    USERPROFILE: 'C:/Users/USER',
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

let requestId = 0;
const pendingRequests = new Map();
let outputBuffer = '';

// Read from stdout
proc.stdout.on('data', (data) => {
  outputBuffer += data.toString();
  let newlineIndex;
  while ((newlineIndex = outputBuffer.indexOf('\n')) !== -1) {
    const line = outputBuffer.substring(0, newlineIndex).trim();
    outputBuffer = outputBuffer.substring(newlineIndex + 1);
    if (line) {
      console.log('[RECV]', line);
      try {
        const msg = JSON.parse(line);
        if (msg.id !== undefined && msg.id !== null) {
          const pending = pendingRequests.get(msg.id);
          if (pending) {
            clearTimeout(pending.timeout);
            pendingRequests.delete(msg.id);
            if (msg.result) pending.resolve(msg.result);
            else if (msg.error) pending.reject(new Error(JSON.stringify(msg.error)));
            else pending.reject(new Error('No result or error'));
          }
        }
      } catch(e) {
        // Not JSON, skip
      }
    }
  }
});

proc.stderr.on('data', (data) => {
  const text = data.toString();
  console.error('[MCP-REMOTE]', text.trim());
});

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function sendRequest(method, params = {}) {
  const id = requestId++;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error(`Request ${method} timed out`));
    }, 15000);
    pendingRequests.set(id, { resolve, reject, timeout });
    
    const msg = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };
    console.log('[SEND]', method, JSON.stringify(msg));
    proc.stdin.write(JSON.stringify(msg) + '\n');
  });
}

async function main() {
  try {
    // Wait for MCP server to be ready
    await sleep(3000);
    
    // Initialize
    console.log('\n=== Initialize ===');
    const initResult = await sendRequest('initialize', {
      protocolVersion: '2025-03-26',
      capabilities: { tools: {}, prompts: {}, resources: {} },
      clientInfo: { name: 'test-client', version: '1.0.0' }
    });
    console.log('Initialize result:', JSON.stringify(initResult, null, 2).substring(0, 500));
    
    // List tools
    console.log('\n=== List Tools ===');
    const toolsResult = await sendRequest('tools/list');
    console.log('Tools result:', JSON.stringify(toolsResult, null, 2));
    
    if (toolsResult.tools) {
      const kaggleTools = toolsResult.tools.filter(t => t.name.toLowerCase().includes('kaggle'));
      console.log('\nKaggle tools found:', kaggleTools.length);
      kaggleTools.forEach(t => console.log('  -', t.name, t.description?.substring(0, 80)));
    }
    
    // Try to call get_accelerator_quota
    const hasAcceleratorQuota = toolsResult.tools?.some(t => t.name.toLowerCase().includes('accelerator'));
    console.log('\nget_accelerator_quota available:', hasAcceleratorQuota);
    
    if (hasAcceleratorQuota) {
      console.log('\n=== Calling get_accelerator_quota ===');
      const quotaResult = await sendRequest('tools/call', {
        name: 'get_accelerator_quota',
        arguments: {}
      });
      console.log('Accelerator quota result:', JSON.stringify(quotaResult, null, 2));
    }
    
    // Check for create_notebook_session
    const hasCreateNotebook = toolsResult.tools?.some(t => t.name.toLowerCase().includes('notebook'));
    console.log('\ncreate_notebook_session available:', hasCreateNotebook);
    
  } catch(error) {
    console.error('Main error:', error.message || error);
  } finally {
    proc.kill();
    process.exit(0);
  }
}

// Listen for process exit
proc.on('exit', (code) => {
  console.log(`\n[mcp-remote exited with code ${code}]`);
});

main().catch(e => {
  console.error('Fatal error:', e);
  proc.kill();
  process.exit(1);
});
