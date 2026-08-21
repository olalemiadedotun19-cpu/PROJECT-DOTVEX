const fs = require('fs');
const content = fs.readFileSync('C:/Users/USER/.vscode/extensions/kilocode.kilo-code-7.4.23-win32-x64/dist/extension.js', 'utf8');

// Find oauthSecretKey with context
const searchStr = 'oauthSecretKey';
let idx = content.indexOf(searchStr);
let count = 0;
while (idx !== -1 && count < 20) {
  const start = Math.max(0, idx - 200);
  const end = Math.min(content.length, idx + 200);
  const context = content.substring(start, end).replace(/\n/g, ' ').trim();
  
  // Only print if this looks like an assignment (not just a reference)
  if (context.includes(':') || context.includes('=')) {
    console.log('--- At index', idx, '---');
    console.log(context.substring(0, 400));
    console.log();
  }
  
  idx = content.indexOf(searchStr, idx + 1);
  count++;
}

// Also search for "kaggle" in the extension
const kaggleIdx = content.toLowerCase().indexOf('kaggle');
if (kaggleIdx !== -1) {
  console.log('\n=== Kaggle reference found ===');
  const start = Math.max(0, kaggleIdx - 100);
  const end = Math.min(content.length, kaggleIdx + 200);
  console.log(content.substring(start, end).replace(/\n/g, ' ').trim());
} else {
  console.log('\nNo "kaggle" string found in extension.js');
}

// Search for "mcp" related OAuth secret keys
const mcpIdx = content.indexOf('mcp-');
if (mcpIdx !== -1) {
  console.log('\n=== mcp- reference found ===');
  const start = Math.max(0, mcpIdx - 100);
  const end = Math.min(content.length, mcpIdx + 200);
  console.log(content.substring(start, end).replace(/\n/g, ' ').trim());
}
