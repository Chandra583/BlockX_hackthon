# Corrected Telemetry Test Data - PowerShell Version
# VIN: 1HGCM82633A123465
# Device: OBD3001

Write-Host "Corrected Telemetry Test Data Generation" -ForegroundColor Green
Write-Host "VIN: 1HGCM82633A123465"
Write-Host "Device: OBD3001"
Write-Host ""

# Record 1: Morning drive (8:00 AM) - +5 km
Write-Host "1. Morning Drive (8:00 AM) - +5 km" -ForegroundColor Cyan
$body1 = @{
    deviceID = "OBD3001"
    vin = "1HGCM82633A123465"
    status = "obd_connected"
    mileage = 65081
    speed = 45
    rpm = 2200
    engineTemp = 88
    fuelLevel = 75
    dataQuality = 98
    timestamp = 1732521600000
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:3000/api/device/status" -Method POST -Body $body1 -ContentType "application/json"
    Write-Host "SUCCESS: $($response1.message)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Record 2: Lunch break (12:30 PM) - +12 km
Write-Host "2. Lunch Break (12:30 PM) - +12 km" -ForegroundColor Cyan
$body2 = @{
    deviceID = "OBD3001"
    vin = "1HGCM82633A123465"
    status = "obd_connected"
    mileage = 65093
    speed = 0
    rpm = 0
    engineTemp = 85
    fuelLevel = 72
    dataQuality = 99
    timestamp = 1732534200000
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:3000/api/device/status" -Method POST -Body $body2 -ContentType "application/json"
    Write-Host "SUCCESS: $($response2.message)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Record 3: Afternoon drive (3:15 PM) - +8 km
Write-Host "3. Afternoon Drive (3:15 PM) - +8 km" -ForegroundColor Cyan
$body3 = @{
    deviceID = "OBD3001"
    vin = "1HGCM82633A123465"
    status = "obd_connected"
    mileage = 65101
    speed = 35
    rpm = 1800
    engineTemp = 90
    fuelLevel = 68
    dataQuality = 97
    timestamp = 1732544100000
} | ConvertTo-Json

try {
    $response3 = Invoke-RestMethod -Uri "http://localhost:3000/api/device/status" -Method POST -Body $body3 -ContentType "application/json"
    Write-Host "SUCCESS: $($response3.message)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Record 4: Evening commute (6:45 PM) - +15 km
Write-Host "4. Evening Commute (6:45 PM) - +15 km" -ForegroundColor Cyan
$body4 = @{
    deviceID = "OBD3001"
    vin = "1HGCM82633A123465"
    status = "obd_connected"
    mileage = 65116
    speed = 55
    rpm = 2500
    engineTemp = 92
    fuelLevel = 65
    dataQuality = 99
    timestamp = 1732554300000
} | ConvertTo-Json

try {
    $response4 = Invoke-RestMethod -Uri "http://localhost:3000/api/device/status" -Method POST -Body $body4 -ContentType "application/json"
    Write-Host "SUCCESS: $($response4.message)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Record 5: End of day (9:30 PM) - +3 km
Write-Host "5. End of Day (9:30 PM) - +3 km" -ForegroundColor Cyan
$body5 = @{
    deviceID = "OBD3001"
    vin = "1HGCM82633A123465"
    status = "obd_connected"
    mileage = 65119
    speed = 0
    rpm = 0
    engineTemp = 87
    fuelLevel = 63
    dataQuality = 98
    timestamp = 1732563000000
} | ConvertTo-Json

try {
    $response5 = Invoke-RestMethod -Uri "http://localhost:3000/api/device/status" -Method POST -Body $body5 -ContentType "application/json"
    Write-Host "SUCCESS: $($response5.message)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Record 6: Tomorrow morning with rollback fraud
Write-Host "6. Tomorrow Morning (8:00 AM) - FRAUD: Rollback from 65119 to 45119 km (-20000 km)" -ForegroundColor Red
$body6 = @{
    deviceID = "OBD3001"
    vin = "1HGCM82633A123465"
    status = "obd_connected"
    mileage = 45119
    speed = 0
    rpm = 0
    engineTemp = 85
    fuelLevel = 60
    dataQuality = 95
    timestamp = 1732608000000
} | ConvertTo-Json

try {
    $response6 = Invoke-RestMethod -Uri "http://localhost:3000/api/device/status" -Method POST -Body $body6 -ContentType "application/json"
    Write-Host "SUCCESS: $($response6.message)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "Expected Results:" -ForegroundColor Green
Write-Host "Today's records: All should be VALID (normal progression)"
Write-Host "Tomorrow's record: Should be FLAGGED as ROLLBACK_DETECTED"
Write-Host "Total mileage progression: 65076 -> 65119 -> 45119 (fraud)"
Write-Host ""
Write-Host "Fraud Detection:" -ForegroundColor Red
Write-Host "- Previous mileage: 65119 km"
Write-Host "- Reported mileage: 45119 km"
Write-Host "- Delta: -20000 km (impossible decrease)"
Write-Host "- Status: ROLLBACK_DETECTED"
