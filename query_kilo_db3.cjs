const Database = require('node:sqlite').DatabaseSync;
const dbPath = 'C:/Users/USER/.local/share/kilo/kilo.db';

const db = new Database(dbPath, { readonly: true });

// Check specific tables: account, credential, control_account, permission, account_state
const tablesToCheck = ['account', 'credential', 'control_account', 'account_state', 'permission'];

for (const tableName of tablesToCheck) {
  try {
    const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
    console.log('\n=== Table:', tableName, '- Rows:', rows.length, '===');
    rows.forEach((row, i) => {
      console.log('Row ' + i + ':', JSON.stringify(row, null, 2));
    });
  } catch(e) {
    console.log('Error reading', tableName, ':', e.message);
  }
}

// Also check workspace and project tables
const moreTables = ['workspace', 'project'];
for (const tableName of moreTables) {
  try {
    const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
    console.log('\n=== Table:', tableName, '- Rows:', rows.length, '===');
    rows.forEach((row, i) => {
      const json = JSON.stringify(row);
      if (json.toLowerCase().includes('mcp') || json.toLowerCase().includes('kaggle') || json.toLowerCase().includes('oauth')) {
        console.log('RELEVANT Row ' + i + ':', json.substring(0, 500));
      } else {
        console.log('Row ' + i + ':', json.substring(0, 200));
      }
    });
  } catch(e) {
    console.log('Error reading', tableName, ':', e.message);
  }
}

db.close();
