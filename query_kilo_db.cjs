const Database = require('sqlite3');
const path = require('path');

const dbPath = 'C:/Users/USER/.local/share/kilo/kilo.db';

const db = new Database.Database(dbPath, (err) => {
  if (err) {
    console.error('DB Error:', err.message);
    return;
  }
  
  // List all tables
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) { console.error('Error:', err.message); return; }
    console.log('Tables:', rows.map(r => r.name));
    
    // Check each table for kaggle/mcp/oauth related data
    const tables = rows.map(r => r.name);
    tables.forEach(table => {
      db.all(`SELECT * FROM ${table}`, (err, rows) => {
        if (err) return;
        
        const relevantRows = rows.filter(row => {
          const json = JSON.stringify(row);
          return json.toLowerCase().includes('kaggle') || 
                 json.toLowerCase().includes('mcp') ||
                 json.toLowerCase().includes('oauth') ||
                 json.toLowerCase().includes('access_token');
        });
        
        if (relevantRows.length > 0) {
          console.log('\n=== Table:', table, '-', relevantRows.length, 'relevant rows ===');
          relevantRows.slice(0, 3).forEach((row, i) => {
            console.log('Row ' + i + ':', JSON.stringify(row, null, 2).substring(0, 500));
          });
        }
      });
    });
  });
});

setTimeout(() => {
  db.close();
  console.log('\n=== Done ===');
}, 5000);
