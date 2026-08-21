const fs = require('fs');
const path = require('path');

const cookieDirs = [
  path.join(process.env.LOCALAPPDATA || 'C:/Users/USER/AppData/Local', 'Google', 'Chrome', 'User Data', 'Default', 'Network', 'Cookies'),
  path.join(process.env.LOCALAPPDATA || 'C:/Users/USER/AppData/Local', 'Microsoft', 'Edge', 'User Data', 'Default', 'Network', 'Cookies'),
  path.join(process.env.LOCALAPPDATA || 'C:/Users/USER/AppData/Local', 'BraveSoftware', 'Brave-Browser', 'User Data', 'Default', 'Network', 'Cookies'),
];

for (const cookieFile of cookieDirs) {
  console.log('Checking:', cookieFile);
  if (fs.existsSync(cookieFile)) {
    console.log('FOUND:', cookieFile);
    
    try {
      const db = new (require('node:sqlite').DatabaseSync)(cookieFile, { readonly: true });
      
      // Check for kaggle cookies
      const cookies = db.prepare("SELECT host_key, name, value, encrypted_value FROM cookies WHERE host_key LIKE '%kaggle%' OR name LIKE '%kaggle%' OR name LIKE '%ka_session%'").all();
      console.log('Kaggle-related cookies:', cookies.length);
      cookies.forEach(c => {
        console.log('  Host:', c.host_key, 'Name:', c.name, 'Encrypted length:', c.encrypted_value ? Buffer.from(c.encrypted_value).length : 0);
      });
      
      db.close();
    } catch(e) {
      console.log('Error reading DB:', e.message);
    }
  } else {
    console.log('NOT FOUND');
  }
}
