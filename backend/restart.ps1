# Kill process on port 5000 if exists
$connection = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($connection) {
    Write-Host "Killing process on port 5000 (PID: $($connection.OwningProcess))..." -ForegroundColor Yellow
    Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Start the server
Write-Host "Starting server on port 5000..." -ForegroundColor Green
npm start