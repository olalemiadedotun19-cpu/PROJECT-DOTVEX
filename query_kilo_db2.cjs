const Database = require('node:sqlite').DatabaseSync;
const path = require('path');

const dbPath = 'C:/Users/USER/.local/share/kilo/kilo.db';

const db = new Database(dbPath, { readonly: true });

// List all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name));

// Check each table for kaggle/mcp/oauth related data
for (const table of tables) {
  const tableName = table.name;
  try {
    const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
    const relevantRows = rows.filter(row => {
      const json = JSON.stringify(row);
      return json.toLowerCase().includes('kaggle') ||
             json.toLowerCase().includes('mcp') ||
             json.toLowerCase().includes('oauth') ||
             json.toLowerCase().includes('access_token');
    });

    if (relevantRows.length > 0) {
      console.log('\n=== Table:', tableName, '-', relevantRows.length, 'relevant rows ===');
      relevantRows.slice(0, 5).forEach((row, i) => {
        console.log('Row ' + i + ':', JSON.stringify(row, null, 2).substring(0, 1000));
      });
    }
  } catch(e) {
    console.log('Error reading table', tableName, ':', e.message);
  }
}

db.close();
console.log('\n=== Done ===');
