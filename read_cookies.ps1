$src = "C:\Users\USER\AppData\Local\Google\Chrome\User Data\Default\Network\Cookies"
$dst = [System.IO.Path]::GetTempFileName()
try {
    Copy-Item -Path $src -Destination $dst -Force
    Write-Host "Copy OK"
} catch {
    Write-Host "Copy failed"
    [System.IO.File]::WriteAllBytes($dst, [System.IO.File]::ReadAllBytes($src))
    Write-Host "Direct copy OK"
}

# Use Node.js to read the SQLite since PowerShell doesn't have SQLite by default
node -e "const db = new (require('node:sqlite').DatabaseSync)('$dst', {readonly: true}); const cookies = db.prepare(\"SELECT host_key, name, encrypted_value FROM cookies WHERE host_key LIKE '%kaggle%'\").all(); console.log('Kaggle cookies:', cookies.length); cookies.forEach(c => { console.log('  host:', c.host_key, 'name:', c.name, 'encrypted_len:', c.encrypted_value ? Buffer.from(c.encrypted_value).length : 0); }); db.close();"
