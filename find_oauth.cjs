const fs = require('fs');
const content = fs.readFileSync('C:/Users/USER/AppData/Roaming/npm/node_modules/mcp-remote/dist/chunk-65X3S4HB.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.match(/callback|redirect|browser|authUrl|authorize|grant|port/i) && line.match(/function|const|let|var|return|await|log\(|\.listen|\.on\(|=>/)) {
    console.log((i+1) + ': ' + line.trim().substring(0, 200));
  }
});
