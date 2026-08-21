const { spawn } = require('child_process');

const proc = spawn('node', [
  'C:/Users/USER/AppData/Roaming/npm/node_modules/mcp-remote/dist/client.js',
  'https://www.kaggle.com/mcp',
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

let buf = '';
const responses = [];

proc.stdout.on('data', (d) => {
  buf += d.toString();
  let idx;
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (line.startsWith('{')) {
      try {
        const json = JSON.parse(line);
        if (json.result || json.error) responses.push(json);
      } catch (e) {}
    }
  }
});

proc.stderr.on('data', (d) => {
  const t = d.toString().trim();
  // Only log auth/token related lines
  if (/token|auth|Token|Auth|error|Error|connect|Connect/i.test(t)) {
    // suppress noisy repeated lines
  }
});

function send(obj) {
  proc.stdin.write(JSON.stringify(obj) + '\n');
}

function waitFor(predicate, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const found = responses.find(predicate);
      if (found) { clearInterval(interval); resolve(found); }
      else if (Date.now() - start > timeout) { clearInterval(interval); reject(new Error('timeout')); }
    }, 200);
  });
}

(async () => {
  // initialize
  send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {
    protocolVersion: '2025-06-18',
    capabilities: { tools: {} },
    clientInfo: { name: 'test', version: '1.0.0' }
  }});
  await waitFor(r => r.id === 1);

  // tools/list
  send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  const list = await waitFor(r => r.id === 2);
  const tools = list.result.tools;
  console.log('TOOL COUNT:', tools.length);
  const gpu = tools.find(t => t.name === 'get_accelerator_quota');
  const prof = tools.find(t => t.name === 'get_user_profile');
  const create = tools.find(t => t.name === 'create_notebook_session');
  console.log('get_accelerator_quota schema:', JSON.stringify(gpu ? gpu.inputSchema : null));
  console.log('get_user_profile schema:', JSON.stringify(prof ? prof.inputSchema : null));
  console.log('create_notebook_session schema:', JSON.stringify(create ? create.inputSchema : null));

  // call get_accelerator_quota
  send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'get_accelerator_quota', arguments: gpu && gpu.inputSchema && gpu.inputSchema.properties ? {} : {} } });
  const r3 = await waitFor(r => r.id === 3);
  console.log('\nget_accelerator_quota RESULT:', JSON.stringify(r3.result));

  // call get_user_profile
  send({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'get_user_profile', arguments: {} } });
  const r4 = await waitFor(r => r.id === 4);
  console.log('\nget_user_profile RESULT:', JSON.stringify(r4.result));

  proc.kill();
  process.exit(0);
})().catch(e => { console.error('ERR', e.message); proc.kill(); process.exit(1); });
