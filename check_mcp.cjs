const { KiloClient } = require('C:/Users/USER/.config/kilo/node_modules/@kilocode/sdk/dist/v2/gen/sdk.gen.js');
const { createClient } = require('C:/Users/USER/.config/kilo/node_modules/@kilocode/sdk/dist/v2/gen/client.gen.js');

// Try connecting to the Kilo local server
const kiloClient = new KiloClient({
  client: createClient({
    baseURL: 'http://127.0.0.1:4096',
    headers: {
      'x-kilo-directory': encodeURIComponent('C:\\Users\\USER\\Downloads\\dotvex'),
    }
  })
});

(async () => {
  try {
    console.log('=== MCP Server Status ===');
    const result = await kiloClient.mcp.status();
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Status error:', error.message || error);
    
    // Try listing tools
    try {
      console.log('\n=== Tool IDs ===');
      const toolIds = await kiloClient.tool.ids();
      const allIds = toolIds; // Get all tool IDs
      const mcpTools = allIds.filter(id => id.toLowerCase().includes('kaggle'));
      console.log('Total tools:', allIds.length);
      console.log('Kaggle/MCP tools:', mcpTools);
      console.log('All tools (first 30):', allIds.slice(0, 30));
    } catch (e2) {
      console.error('Tool IDs error:', e2.message || e2);
    }
  }
})();
