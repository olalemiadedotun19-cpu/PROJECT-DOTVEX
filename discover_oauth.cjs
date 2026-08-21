const https = require('https');
const fs = require('fs');

// Read the token file content to understand OAuth metadata
// Even though we cleared the token, let's check if there's any OAuth metadata
// in the Kilo config or elsewhere

const kiloConfig = JSON.parse(fs.readFileSync('C:/Users/USER/Downloads/dotvex/.kilo/kilo.jsonc', 'utf8'));
console.log('Kaggle MCP config:', JSON.stringify(kiloConfig.mcp, null, 2));

// Try to discover OAuth metadata from the Kaggle MCP server
// by sending an initialize request
const data = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'kilo', version: '1.0.0' }
  }
});

const req = https.request({
  hostname: 'www.kaggle.com',
  path: '/mcp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream'
  }
}, (response) => {
  let body = '';
  response.on('data', c => body += c);
  response.on('end', () => {
    console.log('\nInitialize response status:', response.statusCode);
    console.log('Headers:', JSON.stringify(response.headers, null, 2));
    console.log('Body:', body.substring(0, 2000));
  });
});

req.on('error', e => console.log('Error:', e.message));
req.write(data);
req.end();
