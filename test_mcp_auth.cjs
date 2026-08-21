const { spawn } = require('child_process');

// Run mcp-remote with explicit OAuth settings and debug mode
const proc = spawn('node', [
  'C:/Users/USER/AppData/Roaming/npm/node_modules/mcp-remote/dist/proxy.js',
  'https://www.kaggle.com/mcp',
  '--port', '9472',
  '--debug',
  '--auth-timeout', '30'
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
  console.log('=== Output after 15s ===');
  console.log(output);
  proc.kill();
  process.exit(0);
}, 15000);

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
  if (output) console.log('Full output:', output);
});
