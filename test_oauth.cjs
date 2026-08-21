const { spawn } = require('child_process');

// Start mcp-remote and capture its output
const proc = spawn('node', [
  'C:/Users/USER/AppData/Roaming/npm/node_modules/mcp-remote/dist/proxy.js',
  'https://www.kaggle.com/mcp'
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
  console.log('=== mcp-remote output (first 20s) ===');
  console.log(output);
  proc.kill('SIGTERM');
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
  console.log('\n=== Process exited with code', code, '===');
  console.log('Full output:\n', output);
});
