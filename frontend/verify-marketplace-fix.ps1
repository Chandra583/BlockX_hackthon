Write-Host "=== Marketplace Navigation Fix Verification ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking files..." -ForegroundColor Yellow
$files = @(
    "frontend\src\config\navigation.js",
    "frontend\src\components\marketplace\VehicleMarketplace.tsx",
    "frontend\src\pages\marketplace\MarketplaceBrowse.tsx",
    "frontend\src\routes\AppRouter.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "[OK] $file" -ForegroundColor Green
    } else {
        Write-Host "[MISSING] $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Checking TypeScript..." -ForegroundColor Yellow
Set-Location frontend
npx tsc --noEmit
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] TypeScript compilation passed" -ForegroundColor Green
} else {
    Write-Host "[ERROR] TypeScript compilation failed" -ForegroundColor Red
}
Set-Location ..

Write-Host ""
Write-Host "Fix complete! Start the app:" -ForegroundColor Green
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  npm start" -ForegroundColor White
Write-Host ""
Write-Host "  cd frontend" -ForegroundColor White  
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""