const { execSync } = require('child_process');
const fs = require('fs');

// Use PowerShell to copy the locked file and read cookies
const psScript = `
# Copy the locked SQLite file using PowerShell's file copy with retry
$src = "C:\\Users\\USER\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Network\\Cookies"
$dst = "$env:TEMP\\chrome_cookies_copy"

try {
    Copy-Item -Path $src -Destination $dst -Force
    Write-Host "Copy succeeded"
} catch {
    Write-Host "Copy failed: $_"
    # Try volume shadow copy or direct read
    $bytes = [System.IO.File]::ReadAllBytes($src)
    [System.IO.File]::WriteAllBytes($dst, $bytes)
    Write-Host "Direct read/write succeeded"
}

# Now read cookies using PowerShell's SQLite support
Add-Type -AssemblyName System.Data
$connectionString = "Data Source=$dst;Version=3;Read Only=true;"
try {
    $conn = New-Object System.Data.SQLite.SQLiteConnection($connectionString)
    $conn.Open()
    
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT host_key, name, value, encrypted_value, path FROM cookies WHERE host_key LIKE '%kaggle%' OR name LIKE '%ka_session%'"
    $reader = $cmd.ExecuteReader()
    
    $cookieCount = 0
    while ($reader.Read()) {
        $cookieCount++
        $host = $reader["host_key"]
        $name = $reader["name"]
        $encrypted = $reader["encrypted_value"]
        
        Write-Host "Cookie: host=$host name=$name"
        
        # Decrypt using DPAPI
        if ($encrypted -and $encrypted.Length -gt 0) {
            try {
                $decrypted = [System.Security.Cryptography.ProtectedData]::Unprotect($encrypted, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
                $value = [System.Text.Encoding]::UTF8.GetString($decrypted)
                Write-Host "  Decrypted value: $($value.Substring(0, [Math]::Min(200, $value.Length)))"
                Write-Host "  Full length: $($value.Length)"
            } catch {
                Write-Host "  Decryption error: $_"
            }
        }
    }
    
    $reader.Close()
    $conn.Close()
    Write-Host "Total Kaggle cookies: $cookieCount"
} catch {
    Write-Host "SQLite error: $_"
}
`;

try {
    const result = execSync(`powershell -Command "${psScript.replace(/\n/g, '; ')}"`, {
        encoding: 'utf8',
        timeout: 15000,
        maxBuffer: 1024 * 1024
    });
    console.log(result);
} catch(e) {
    console.log('Error:', e.stdout || e.stderr || e.message);
}
