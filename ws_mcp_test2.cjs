// Use built-in WebSocket (browser-compatible API in Node 24)
const ws = new WebSocket('ws://127.0.0.1:47822');

ws.addEventListener('open', () => {
  console.log('Connected to port 47822');
  
  // Send initialize
  const msg = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-03-26',
      capabilities: { tools: {} },
      clientInfo: { name: 'kilo-test', version: '1.0.0' }
    }
  };
  ws.send(JSON.stringify(msg));
  console.log('Sent initialize');
});

ws.addEventListener('message', (event) => {
  const text = event.data.toString();
  console.log('Received:', text.substring(0, 500));
  
  try {
    const msg = JSON.parse(text);
    if (msg.id === 1 && msg.result) {
      console.log('Server info:', JSON.stringify(msg.result.serverInfo));
      console.log('Capabilities:', JSON.stringify(msg.result.capabilities));
      
      // List tools
      setTimeout(() => {
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list'
        }));
        console.log('Sent tools/list');
      }, 1000);
    }
    
    if (msg.id === 2 && msg.result) {
      const tools = msg.result.tools || [];
      console.log('Total tools:', tools.length);
      const kaggleTools = tools.filter(t => t.name.toLowerCase().includes('kaggle'));
      console.log('Kaggle tools:', kaggleTools.length);
      tools.slice(0, 10).forEach(t => console.log('  -', t.name));
      
      // Try get_accelerator_quota
      setTimeout(() => {
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/call',
          params: { name: 'get_accelerator_quota', arguments: {} }
        }));
        console.log('Sent get_accelerator_quota');
      }, 1000);
    }
    
    if (msg.id === 3) {
      console.log('get_accelerator_quota result:', JSON.stringify(msg.result || msg.error));
    }
    
    if (msg.id === 2 && msg.result) {
      // Also try create_notebook_session
      setTimeout(() => {
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 4,
          method: 'tools/call',
          params: { 
            name: 'create_notebook_session', 
            arguments: { request: { language: 'python', kernelType: 'python' } } 
          }
        }));
        console.log('Sent create_notebook_session');
      }, 3000);
    }
    
    if (msg.id === 4) {
      console.log('create_notebook_session result:', JSON.stringify(msg.result || msg.error));
    }
  } catch(e) {
    // Not JSON, ignore
  }
});

ws.addEventListener('error', (event) => {
  console.log('WebSocket Error:', event.message);
});

ws.addEventListener('close', () => {
  console.log('Connection closed');
  process.exit(0);
});

// Timeout after 15 seconds
setTimeout(() => {
  console.log('Timeout, closing');
  ws.close();
  process.exit(0);
}, 15000);
