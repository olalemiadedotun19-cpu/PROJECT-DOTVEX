const fs = require('fs');
const srcPath = 'C:/Users/USER/AppData/Local/Google/Chrome/User Data/Default/Network/Cookies';
const dstPath = 'C:/Users/USER/AppData/Local/Temp/chrome_cookies_copy';

try {
  fs.copyFileSync(srcPath, dstPath);
  console.log('Copied to:', dstPath);
  
  const db = new (require('node:sqlite').DatabaseSync)(dstPath, { readonly: true });
  
  // Check all cookies for kaggle or session-related
  const cookies = db.prepare("SELECT host_key, name, value, encrypted_value, path, expires_utc FROM cookies WHERE host_key LIKE '%kaggle%' OR name LIKE '%ka_session%'").all();
  console.log('Kaggle cookies:', cookies.length);
  cookies.forEach(c => {
    console.log('  Host:', c.host_key, 'Name:', c.name, 'Path:', c.path);
    console.log('  Expires:', c.expires_utc);
    const encryptedLen = c.encrypted_value ? Buffer.from(c.encrypted_value).length : 0;
    console.log('  Encrypted value length:', encryptedLen);
    // The encrypted_value in Windows Chrome uses DPAPI
    // Check if it starts with v10 or v11 (Chrome's encrypted format)
    if (c.encrypted_value) {
      const prefix = Buffer.from(c.encrypted_value).slice(0, 3).toString();
      console.log('  Prefix:', prefix);
    }
  });
  
  // Also check for any cookies with 'session' in the name
  const sessionCookies = db.prepare("SELECT host_key, name, value, encrypted_value FROM cookies WHERE name LIKE '%session%'").all();
  console.log('\nSession cookies:', sessionCookies.length);
  sessionCookies.slice(0, 10).forEach(c => {
    console.log('  ', c.host_key, c.name);
  });
  
  db.close();
  
  // Try to decrypt using Windows DPAPI
  const { execSync } = require('child_process');
  console.log('\n=== Trying to decrypt with PowerShell ===');
  
  if (cookies.length > 0) {
    const firstCookie = cookies[0];
    const encryptedHex = Buffer.from(firstCookie.encrypted_value).toString('hex');
    console.log('Trying to decrypt cookie:', firstCookie.name, 'from', firstCookie.host_key);
    
    try {
      const psScript = `
        Add-Type -AssemblyName System.Security
        $encrypted = [byte[]](${Array.from(Buffer.from(firstCookie.encrypted_value)).join(',')})
        $decrypted = [System.Security.Cryptography.ProtectedData]::Unprotect($encrypted, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
        [System.Text.Encoding]::UTF8.GetString($decrypted)
      `;
      const result = execSync(`powershell -Command "${psScript}"`, { encoding: 'utf8', timeout: 5000 });
      console.log('Decrypted cookie value:', result.trim());
    } catch(e) {
      console.log('Decryption error:', e.message);
    }
  }
  
} catch(e) {
  console.log('Error:', e.message);
}
