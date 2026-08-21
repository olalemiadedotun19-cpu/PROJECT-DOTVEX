const WebSocket = require('ws');

const ws = new WebSocket('ws://127.0.0.1:47822', {
  headers: {
    'Accept': 'application/json, text/event-stream',
  }
});

ws.on('open', () => {
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

ws.on('message', (data) => {
  console.log('Received:', data.toString().substring(0, 500));
  
  // After initialize, list tools
  setTimeout(() => {
    const msg = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    };
    ws.send(JSON.stringify(msg));
    
    setTimeout(() => {
      // Try get_accelerator_quota
      const msg = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'get_accelerator_quota', arguments: {} }
      };
      ws.send(JSON.stringify(msg));
      
      setTimeout(() => {
        const msg = {
          jsonrpc: '2.0',
          id: 4,
          method: 'tools/call',
          params: { name: 'create_notebook_session', arguments: { request: { language: 'python', kernelType: 'python' } } }
        };
        ws.send(JSON.stringify(msg));
        
        setTimeout(() => {
          ws.close();
          process.exit(0);
        }, 5000);
      }, 3000);
    }, 3000);
  }, 3000);
});

ws.on('error', (e) => {
  console.log('Error:', e.message);
});

ws.on('close', () => {
  console.log('Connection closed');
});
