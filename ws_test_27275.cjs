// Try port 27275 with WebSocket
const ws = new WebSocket('ws://127.0.0.1:27275');

ws.addEventListener('open', () => {
  console.log('Connected to port 27275');
  
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
  console.log('Received:', text.substring(0, 1000));
  
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
      tools.slice(0, 20).forEach(t => console.log('  -', t.name));
      
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
  } catch(e) {
    // Not JSON
    console.log('Non-JSON message:', text.substring(0, 200));
  }
});

ws.addEventListener('error', (event) => {
  console.log('WebSocket Error:', event.message || 'unknown error');
});

ws.addEventListener('close', () => {
  console.log('Connection closed');
  process.exit(0);
});

setTimeout(() => {
  console.log('Timeout, closing');
  ws.close();
  process.exit(0);
}, 15000);
