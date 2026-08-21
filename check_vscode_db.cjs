const Database = require('node:sqlite').DatabaseSync;
const fs = require('fs');
const path = require('path');

function checkDB(dbPath, dbName) {
  if (!fs.existsSync(dbPath)) return;
  try {
    const db = new Database(dbPath, { readonly: true });
    
    // Check item table for kilo/mcp/kaggle keys
    const rows = db.prepare("SELECT key, value FROM itemTable WHERE key LIKE '%kilo%' OR key LIKE '%mcp%' OR key LIKE '%kaggle%' OR key LIKE '%kagi%'").all();
    if (rows.length > 0) {
      console.log('\n=== ' + dbName + ' — relevant keys ===');
      rows.forEach(r => {
        console.log('Key:', r.key);
        console.log('Value:', r.value ? r.value.substring(0, 300) : '(null)');
      });
    }
    
    // Also check for auth/token/oauth keys
    const authRows = db.prepare("SELECT key, value FROM itemTable WHERE key LIKE '%auth%' OR key LIKE '%token%' OR key LIKE '%oauth%'").all();
    if (authRows.length > 0) {
      console.log('\n=== ' + dbName + ' — auth/token keys ===');
      authRows.forEach(r => {
        console.log('Key:', r.key);
        console.log('Value:', r.value ? r.value.substring(0, 200) : '(null)');
      });
    }
    
    // Check for any keys containing 'mcp' or 'kilo' in any table
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('\n=== ' + dbName + ' tables:', tables.map(t => t.name).join(', '));
    
    db.close();
  } catch(e) {
    console.log(dbName, 'Error:', e.message);
  }
}

// Check main DB
const mainDb = 'C:/Users/USER/AppData/Roaming/Code/User/globalStorage/state.vscdb';
checkDB(mainDb, 'main state.vscdb');

// Check workspace DBs
const wsBase = 'C:/Users/USER/AppData/Roaming/Code/User/workspaceStorage';
if (fs.existsSync(wsBase)) {
  const dirs = fs.readdirSync(wsBase);
  dirs.forEach(dir => {
    const dbPath = path.join(wsBase, dir, 'state.vscdb');
    checkDB(dbPath, 'workspace ' + dir);
  });
}

console.log('\n=== Check complete ===');
