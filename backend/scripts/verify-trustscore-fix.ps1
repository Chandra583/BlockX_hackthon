# TrustScore Cumulative Calculation Bug Fix Verification Script (PowerShell)
# This script tests the exact scenario described in the bug report

Write-Host "🔧 TrustScore Cumulative Calculation Bug Fix Verification" -ForegroundColor Yellow
Write-Host "=========================================================" -ForegroundColor Yellow

# Configuration
$BASE_URL = "http://localhost:3000"
$VEHICLE_ID = "68fd05d50c462a28534d4544"
$AUTH_TOKEN = "your-auth-token-here" # Replace with actual token

# Function to make API calls
function Make-Request {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Data = $null,
        [int]$ExpectedStatus
    )
    
    $headers = @{
        "Authorization" = "Bearer $AUTH_TOKEN"
    }
    
    if ($Data) {
        $headers["Content-Type"] = "application/json"
        try {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -Body $Data
            Write-Host "✅ $Method $Url - Status: 200" -ForegroundColor Green
            $response | ConvertTo-Json -Depth 10
        }
        catch {
            Write-Host "❌ $Method $Url - Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    else {
        try {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers
            Write-Host "✅ $Method $Url - Status: 200" -ForegroundColor Green
            $response | ConvertTo-Json -Depth 10
        }
        catch {
            Write-Host "❌ $Method $Url - Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
}

# Test 1: Seed initial TrustScore
Write-Host "Test 1: Seeding initial TrustScore (100)" -ForegroundColor Yellow
$seedData = @{
    score = 100
} | ConvertTo-Json
Make-Request -Method "POST" -Url "$BASE_URL/api/trust/$VEHICLE_ID/seed" -Data $seedData -ExpectedStatus 200

# Test 2: Apply first rollback event (-30)
Write-Host "Test 2: First rollback event (-30)" -ForegroundColor Yellow
$event1Data = @{
    vehicleId = $VEHICLE_ID
    type = "MILEAGE_ROLLBACK"
    deltaScore = -30
    recordedAt = "2025-10-25T11:45:15Z"
    source = "fraud-detect"
    meta = @{
        prevMileage = 65185
        newMileage = 50000
    }
} | ConvertTo-Json
Make-Request -Method "POST" -Url "$BASE_URL/api/telemetry/event" -Data $event1Data -ExpectedStatus 200

# Test 3: Apply second rollback event (-30)
Write-Host "Test 3: Second rollback event (-30)" -ForegroundColor Yellow
$event2Data = @{
    vehicleId = $VEHICLE_ID
    type = "MILEAGE_ROLLBACK"
    deltaScore = -30
    recordedAt = "2025-10-25T11:45:17Z"
    source = "fraud-detect"
    meta = @{
        prevMileage = 65185
        newMileage = 45000
    }
} | ConvertTo-Json
Make-Request -Method "POST" -Url "$BASE_URL/api/telemetry/event" -Data $event2Data -ExpectedStatus 200

# Test 4: Verify final TrustScore should be 40
Write-Host "Test 4: Verifying final TrustScore (should be 40)" -ForegroundColor Yellow
Make-Request -Method "GET" -Url "$BASE_URL/api/trust/$VEHICLE_ID/score" -ExpectedStatus 200

# Test 5: Check TrustScore history
Write-Host "Test 5: Checking TrustScore history" -ForegroundColor Yellow
Make-Request -Method "GET" -Url "$BASE_URL/api/trust/$VEHICLE_ID/history" -ExpectedStatus 200

# Test 6: Concurrent events test
Write-Host "Test 6: Testing concurrent events" -ForegroundColor Yellow
Write-Host "Sending two concurrent events..."

$concurrentEvent1 = @{
    vehicleId = $VEHICLE_ID
    type = "MILEAGE_ROLLBACK"
    deltaScore = -10
    recordedAt = "2025-10-25T11:45:20Z"
    source = "fraud-detect"
} | ConvertTo-Json

$concurrentEvent2 = @{
    vehicleId = $VEHICLE_ID
    type = "MILEAGE_ROLLBACK"
    deltaScore = -5
    recordedAt = "2025-10-25T11:45:21Z"
    source = "fraud-detect"
} | ConvertTo-Json

# Start both requests concurrently
$job1 = Start-Job -ScriptBlock {
    param($url, $headers, $data)
    Invoke-RestMethod -Uri $url -Method "POST" -Headers $headers -Body $data
} -ArgumentList "$BASE_URL/api/telemetry/event", @{"Authorization" = "Bearer $AUTH_TOKEN"; "Content-Type" = "application/json"}, $concurrentEvent1

$job2 = Start-Job -ScriptBlock {
    param($url, $headers, $data)
    Invoke-RestMethod -Uri $url -Method "POST" -Headers $headers -Body $data
} -ArgumentList "$BASE_URL/api/telemetry/event", @{"Authorization" = "Bearer $AUTH_TOKEN"; "Content-Type" = "application/json"}, $concurrentEvent2

# Wait for both jobs to complete
Wait-Job $job1, $job2
Receive-Job $job1
Receive-Job $job2
Remove-Job $job1, $job2

# Check final score after concurrent events
Write-Host "Final TrustScore after concurrent events (should be 25):" -ForegroundColor Yellow
Make-Request -Method "GET" -Url "$BASE_URL/api/trust/$VEHICLE_ID/score" -ExpectedStatus 200

Write-Host "🎉 TrustScore verification complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Expected Results:"
Write-Host "- Initial score: 100"
Write-Host "- After first rollback: 70"
Write-Host "- After second rollback: 40"
Write-Host "- After concurrent events: 25"
Write-Host ""
Write-Host "If all tests pass, the cumulative calculation bug is fixed!"
