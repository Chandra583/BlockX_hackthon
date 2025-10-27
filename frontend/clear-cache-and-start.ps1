# Clear all caches and restart development server
Write-Host "Clearing all caches and restarting development server..." -ForegroundColor Cyan

Set-Location -Path "frontend"

Write-Host "`n[1/5] Stopping any running dev servers..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "[2/5] Removing Vite cache..." -ForegroundColor Yellow
Remove-Item -Path "node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "[3/5] Removing dist folder..." -ForegroundColor Yellow
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "[4/5] Removing any remaining .js files in hooks..." -ForegroundColor Yellow
Remove-Item -Path "src\hooks\useSocket.js" -Force -ErrorAction SilentlyContinue

Write-Host "[5/5] Starting development server..." -ForegroundColor Yellow
Write-Host "`n========================================"
Write-Host "Please do the following in your browser:"
Write-Host "1. Open Developer Tools (F12)"
Write-Host "2. Right-click the refresh button"
Write-Host "3. Select 'Empty Cache and Hard Reload'"
Write-Host "4. OR press Ctrl+Shift+Delete and clear cache"
Write-Host "========================================`n" -ForegroundColor Green

npm run dev

