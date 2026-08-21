$src = "C:\Users\USER\AppData\Local\Google\Chrome\User Data\Default\Network\Cookies"
$dst = "$env:TEMP\chrome_cookies_temp.db"

# Try to close Chrome handles or copy with retry
$retry = 0
while ($retry -lt 5) {
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

if (Test-Path $dst) {
    Write-Host "File exists: $dst"
    Write-Host "Size: $( (Get-Item $dst).Length )"
} else {
    Write-Host "Copy failed after retries"
}
