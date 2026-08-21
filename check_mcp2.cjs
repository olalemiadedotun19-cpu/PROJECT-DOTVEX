// Try using the Kilo SDK with the global client
const sdkPath = 'C:/Users/USER/.config/kilo/node_modules/@kilocode/sdk/dist/v2/gen/sdk.gen.js';
const clientGenPath = 'C:/Users/USER/.config/kilo/node_modules/@kilocode/sdk/dist/v2/gen/client.gen.js';
const sdkModule = require(sdkPath);
const KiloClient = sdkModule.KiloClient;
const clientMod = require(clientGenPath);
const KilobClient = clientMod.client;
KiloClient.client = KilobClient;

// Configure client
const http = require('http');
const options = {
  hostname: '127.0.0.1',
  port: 4096,
  path: '/api/mcp/status',
  method: 'GET',
  headers: {
    'x-kilo-directory': encodeURIComponent('C:\\Users\\USER\\Downloads\\dotvex'),
    'Accept': 'application/json',
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('MCP Status:', res.statusCode);
    console.log('Body:', data.substring(0, 500));
  });
});
req.on('error', (e) => console.log('Error:', e.message));
req.end();

(async () => {
  try {
    console.log('=== MCP Status ===');
    const status = await kiloClient.mcp.status();
    console.log(JSON.stringify(status, null, 2).substring(0, 2000));
  } catch(e) {
    console.error('MCP status error:', e.message || e);
  }
  
  try {
    console.log('\n=== Tool IDs ===');
    const toolIds = await kiloClient.tool.ids();
    const ids = Array.isArray(toolIds) ? toolIds : (toolIds.data || []);
    console.log('Total:', ids.length);
    const kaggle = ids.filter(id => typeof id === 'string' && (id.includes('kaggle') || id.includes('Kaggle')));
    console.log('Kaggle tools:', kaggle.length);
    if (kaggle.length > 0) console.log('Names:', kaggle.slice(0, 20));
  } catch(e) {
    console.error('Tool IDs error:', e.message || e);
  }

  try {
    console.log('\n=== MCP Resources ===');
    const res = await kiloClient.experimental.resource.list();
    console.log(JSON.stringify(res, null, 2).substring(0, 1000));
  } catch(e) {
    console.error('Resources error:', e.message || e);
  }
})();
