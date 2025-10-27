Write-Host "`n=== useSocket File Verification ===" -ForegroundColor Cyan

Write-Host "`nChecking for useSocket.js..." -ForegroundColor Yellow
$jsFile = Get-ChildItem -Path "src\hooks\useSocket.js" -ErrorAction SilentlyContinue
if ($jsFile) {
    Write-Host "❌ PROBLEM: useSocket.js still exists!" -ForegroundColor Red
    Write-Host "   Delete it with: Remove-Item src\hooks\useSocket.js -Force" -ForegroundColor Yellow
} else {
    Write-Host "✅ GOOD: useSocket.js is deleted" -ForegroundColor Green
}

Write-Host "`nChecking for useSocket.ts..." -ForegroundColor Yellow
$tsFile = Get-ChildItem -Path "src\hooks\useSocket.ts" -ErrorAction SilentlyContinue
if ($tsFile) {
    Write-Host "✅ GOOD: useSocket.ts exists" -ForegroundColor Green
    Write-Host "   Location: $($tsFile.FullName)" -ForegroundColor Gray
    Write-Host "   Size: $($tsFile.Length) bytes" -ForegroundColor Gray
} else {
    Write-Host "❌ PROBLEM: useSocket.ts is missing!" -ForegroundColor Red
}

Write-Host "`nChecking Vite cache..." -ForegroundColor Yellow
$viteCache = Get-ChildItem -Path "node_modules\.vite" -Recurse -ErrorAction SilentlyContinue
if ($viteCache) {
    Write-Host "⚠️  WARNING: Vite cache exists" -ForegroundColor Yellow
    Write-Host "   Clear it with: Remove-Item -Recurse -Force node_modules\.vite" -ForegroundColor Yellow
} else {
    Write-Host "✅ GOOD: Vite cache is clear" -ForegroundColor Green
}

Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Clear your browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
Write-Host "2. Hard refresh the page (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "3. Or try Incognito mode to test" -ForegroundColor White
Write-Host "`n" -ForegroundColor White

