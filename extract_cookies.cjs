const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const cookieFile = 'C:/Users/USER/AppData/Local/Google/Chrome/User Data/Default/Network/Cookies';
const tempCopy = path.join(require('os').tmpdir(), 'chrome_cookies_temp.db');

// Try using Windows VSS or handle locking
// Method 1: Use robocopy to copy the file (handles locks better)
try {
  console.log('Trying robocopy...');
  execSync(`robocopy "${path.dirname(cookieFile)}" "${path.dirname(tempCopy)}" "${path.basename(cookieFile)}" /R:0 /W:0 /COPYALL 2>nul`, {
    encoding: 'utf8',
    timeout: 10000
  });
  console.log('robocopy succeeded');
} catch(e) {
  console.log('robocopy failed:', e.message);
}

// Method 2: Try PowerShell with lock handling
if (!fs.existsSync(tempCopy)) {
  console.log('Trying PowerShell with retry...');
  const psScript = `
    $src = "${cookieFile}"
    $dst = "${tempCopy}"
    $retry = 0
    while ($retry -lt 3) {
      try {
        [System.IO.File]::OpenRead($src).Dispose()
        Copy-Item -Path $src -Destination $dst -Force
        Write-Host "Copy succeeded"
        break
      } catch {
        $retry++
        Start-Sleep -Milliseconds 500
      }
    }
  `;
  
  try {
    const result = execSync(`powershell -NoProfile -Command "${psScript.replace(/\n/g, '; ')}"`, {
      encoding: 'utf8',
      timeout: 15000
    });
    console.log(result.trim());
  } catch(e) {
    console.log('PowerShell copy failed:', e.message);
  }
}

// Method 3: If copy worked, read cookies
if (fs.existsSync(tempCopy)) {
  console.log('Temp copy exists, reading cookies...');
  
  try {
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(tempCopy, { readonly: true });
    
    // Find kaggle cookies
    const cookies = db.prepare("SELECT host_key, name, value, encrypted_value, path FROM cookies WHERE host_key LIKE '%kaggle%'").all();
    console.log('Kaggle cookies found:', cookies.length);
    
    if (cookies.length > 0) {
      cookies.forEach(c => {
        console.log('\nCookie:', c.name, 'Domain:', c.host_key, 'Path:', c.path);
        console.log('  Value:', c.value || '(encrypted)');
        
        if (c.encrypted_value) {
          const enc = Buffer.from(c.encrypted_value);
          console.log('  Encrypted length:', enc.length);
          
          // Check if it starts with v10 (Chrome's encrypted format)
          const prefix = enc.slice(0, 3).toString();
          console.log('  Prefix:', JSON.stringify(prefix));
          
          // Decrypt using PowerShell DPAPI
          const bytes = Array.from(enc);
          const psCmd = `powershell -NoProfile -Command "$b=[byte[]]@(${bytes.join(',')}); $d=[System.Security.Cryptography.ProtectedData]::Unprotect($b, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser); [System.Text.Encoding]::UTF8.GetString($d)"`;
          
          try {
            const decrypted = execSync(psCmd, { encoding: 'utf8', timeout: 5000 });
            console.log('  DECRYPTED:', decrypted.trim().substring(0, 200));
            
            // Save the decrypted cookie
            if (decrypted.trim()) {
              const cookieStr = `${c.name}=${decrypted.trim()}`;
              fs.appendFileSync('C:/Users/USER/Downloads/dotvex/kaggle_cookies.txt', cookieStr + '; Domain=' + c.host_key + '; Path=' + c.path + '\n');
              console.log('  Saved to kaggle_cookies.txt');
            }
          } catch(e) {
            console.log('  Decryption error:', e.message);
          }
        }
      });
    }
    
    // Also check for account/login cookies (non-kaggle but might be related)
    const loginCookies = db.prepare("SELECT host_key, name, encrypted_value FROM cookies WHERE name LIKE '%session%' AND host_key LIKE '%kaggle%'").all();
    console.log('\nSession cookies:', loginCookies.length);
    
    db.close();
  } catch(e) {
    console.log('Database error:', e.message);
  }
  
  // Clean up
  try { fs.unlinkSync(tempCopy); } catch(e) {}
}
