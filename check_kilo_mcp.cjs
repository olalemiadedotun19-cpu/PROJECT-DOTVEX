const path = require('path');
const { createKiloClient } = require('C:/Users/USER/.config/kilo/node_modules/@kilocode/sdk/dist/v2/client.js');

const kiloClient = createKiloClient({
  baseURL: 'http://localhost:47821',
  headers: {
    'x-kilo-directory': encodeURIComponent('C:\\Users\\USER\\Downloads\\dotvex'),
  }
});

(async () => {
  try {
    // Check MCP server status
    console.log('=== MCP Server Status ===');
    const status = await kiloClient.mcp.status();
    console.log(JSON.stringify(status, null, 2).substring(0, 1000));
    
    // List all tool IDs
    console.log('\n=== All Tool IDs ===');
    const toolIds = await kiloClient.tool.ids();
    console.log('Total tool IDs:', toolIds.length);
    console.log(JSON.stringify(toolIds, null, 2).substring(0, 2000));
    
  } catch (error) {
    console.error('Error:', error.message || error);
  }
})();
