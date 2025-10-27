# BMW M3 Fraud Alert Test Script
# Vehicle: 68fd4f3f22d482da0cb51428 (VIN: 1HGCM82633A12DSAA)
# Device: OBD9292
# Starting Mileage: 56 km
# Test Period: Next 5 days with ONE fraud alert

$BASE_URL = "http://localhost:3000"
$VEHICLE_ID = "68fd4f3f22d482da0cb51428"
$DEVICE_ID = "OBD9292"
$VIN = "1HGCM82633A12DSAA"

Write-Host "🚗 BMW M3 Fraud Alert Test" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host "Vehicle ID: $VEHICLE_ID" -ForegroundColor White
Write-Host "VIN: $VIN" -ForegroundColor White
Write-Host "Device ID: $DEVICE_ID" -ForegroundColor White
Write-Host "Starting Mileage: 56 km" -ForegroundColor White
Write-Host "Test Period: Next 5 days" -ForegroundColor White
Write-Host "Expected Fraud Alert: Day 3 (mileage rollback)" -ForegroundColor Yellow

# Test data for 5 days with ONE fraud alert
$testData = @(
    @{
        day = 1
        date = (Get-Date).AddDays(1)
        mileage = 58
        description = "Day 1: Normal driving"
    },
    @{
        day = 2
        date = (Get-Date).AddDays(2)
        mileage = 61
        description = "Day 2: Normal driving"
    },
    @{
        day = 3
        date = (Get-Date).AddDays(3)
        mileage = 45
        description = "Day 3: FRAUD ALERT - Mileage rollback detected"
    },
    @{
        day = 4
        date = (Get-Date).AddDays(4)
        mileage = 48
        description = "Day 4: Normal driving after fraud"
    },
    @{
        day = 5
        date = (Get-Date).AddDays(5)
        mileage = 52
        description = "Day 5: Normal driving"
    }
)

function Send-TelemetryData {
    param($dayData)
    
    $payload = @{
        deviceID = $DEVICE_ID
        vin = $VIN
        status = "obd_connected"
        message = "Day $($dayData.day) telemetry data"
        mileage = $dayData.mileage
        engineTemp = 85 + (Get-Random -Minimum 0 -Maximum 10)
        fuelLevel = 70 + (Get-Random -Minimum 0 -Maximum 20)
        rpm = 2000 + (Get-Random -Minimum 0 -Maximum 1000)
        speed = 50 + (Get-Random -Minimum 0 -Maximum 30)
        dataQuality = 95 + (Get-Random -Minimum 0 -Maximum 5)
        timestamp = [DateTimeOffset]::new($dayData.date).ToUnixTimeMilliseconds()
        dataSource = "veepeak_obd"
    }
    
    try {
        Write-Host "`n📡 Day $($dayData.day): Sending telemetry data..." -ForegroundColor Yellow
        Write-Host "   Mileage: $($dayData.mileage) km" -ForegroundColor White
        Write-Host "   Description: $($dayData.description)" -ForegroundColor White
        
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/device/status" -Method POST -Body ($payload | ConvertTo-Json -Depth 10) -ContentType "application/json"
        
        if ($response.success) {
            Write-Host "   ✅ Success: $($response.message)" -ForegroundColor Green
            
            if ($response.fraudDetected) {
                Write-Host "   🚨 FRAUD ALERT DETECTED!" -ForegroundColor Red
                Write-Host "   Details: $($response.fraudDetails | ConvertTo-Json -Depth 5)" -ForegroundColor Red
            }
        } else {
            Write-Host "   ❌ Error: $($response.message)" -ForegroundColor Red
        }
        
        return $response
    }
    catch {
        Write-Host "   ❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "   Response: $responseBody" -ForegroundColor Red
        }
        return $null
    }
}

function Check-FraudAlerts {
    try {
        Write-Host "`n🔍 Checking fraud alerts..." -ForegroundColor Yellow
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/telemetry/fraud-alerts/$VEHICLE_ID" -Method GET
        
        if ($response.success) {
            Write-Host "   📊 Fraud alerts count: $($response.count)" -ForegroundColor White
            if ($response.data.Count -gt 0) {
                Write-Host "   🚨 Active fraud alerts:" -ForegroundColor Red
                for ($i = 0; $i -lt $response.data.Count; $i++) {
                    $alert = $response.data[$i]
                    Write-Host "      $($i + 1). $($alert.type): $($alert.description)" -ForegroundColor Red
                    Write-Host "         Detected: $((Get-Date $alert.detectedAt).ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
                    Write-Host "         Severity: $($alert.severity)" -ForegroundColor Gray
                }
            } else {
                Write-Host "   ✅ No fraud alerts detected" -ForegroundColor Green
            }
        }
    }
    catch {
        Write-Host "   ❌ Failed to check fraud alerts: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Check-TrustScore {
    try {
        Write-Host "`n📈 Checking TrustScore..." -ForegroundColor Yellow
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/trust/$VEHICLE_ID/score" -Method GET
        
        if ($response.success) {
            Write-Host "   🛡️  Current TrustScore: $($response.data.trustScore)" -ForegroundColor White
            Write-Host "   📅 Last Updated: $((Get-Date $response.data.lastUpdated).ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor White
        }
    }
    catch {
        Write-Host "   ❌ Failed to check TrustScore: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main execution
try {
    # Check initial state
    Check-FraudAlerts
    Check-TrustScore
    
    # Send test data for each day
    foreach ($dayData in $testData) {
        Send-TelemetryData -dayData $dayData
        
        # Wait 1 second between requests
        Start-Sleep -Seconds 1
        
        # Check fraud alerts after each day
        Check-FraudAlerts
    }
    
    # Final summary
    Write-Host "`n📋 Test Summary" -ForegroundColor Cyan
    Write-Host "================" -ForegroundColor Cyan
    Write-Host "✅ Sent 5 days of telemetry data" -ForegroundColor Green
    Write-Host "🚨 Expected: 1 fraud alert on Day 3 (mileage rollback)" -ForegroundColor Yellow
    Write-Host "📊 Check the VehicleDetails page to see the fraud alert" -ForegroundColor White
    Write-Host "🛡️  TrustScore should decrease due to fraud detection" -ForegroundColor White
    
    Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Refresh the VehicleDetails page" -ForegroundColor White
    Write-Host "2. Check TrustScore card shows fraud alert count" -ForegroundColor White
    Write-Host "3. Verify TrustScore decreased due to fraud" -ForegroundColor White
    Write-Host "4. Check fraud alert details in the UI" -ForegroundColor White
}
catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
}
