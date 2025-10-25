#!/bin/bash

# Test data generation script for OBD3001 device and VIN 1HGCM82633A12DSAA
# This script generates realistic telemetry data over multiple days

DEVICE_ID="OBD3001"
VIN="1HGCM82633A12DSAA"
BASE_URL="http://localhost:3000"

echo "🚀 Starting test data generation for $DEVICE_ID ($VIN)"

# Function to create a timestamp
get_timestamp() {
    local hours_ago=$1
    date -d "$hours_ago hours ago" +%s000
}

# Function to send telemetry data
send_telemetry() {
    local mileage=$1
    local hours_ago=$2
    local description=$3
    
    local timestamp=$(get_timestamp $hours_ago)
    
    curl -X POST "$BASE_URL/api/device/status" \
        -H "Content-Type: application/json" \
        -d "{
            \"deviceID\": \"$DEVICE_ID\",
            \"status\": \"obd_connected\",
            \"vin\": \"$VIN\",
            \"mileage\": $mileage,
            \"rpm\": $((800 + RANDOM % 2000)),
            \"speed\": $((10 + RANDOM % 80)),
            \"engineTemp\": $((85 + RANDOM % 20)),
            \"fuelLevel\": $((20 + RANDOM % 80)),
            \"batteryVoltage\": $(echo "scale=1; 12.4 + $RANDOM/32767*1.2" | bc),
            \"dataQuality\": $((95 + RANDOM % 5)),
            \"odometerPID\": \"0x201C\",
            \"dataSource\": \"veepeak_obd\",
            \"timestamp\": $timestamp,
            \"message\": \"$description\",
            \"bootCount\": $((1 + RANDOM % 10)),
            \"signalStrength\": \"Good\",
            \"networkOperator\": \"Verizon\",
            \"freeHeap\": $((100000 + RANDOM % 50000)),
            \"veepeakConnected\": true,
            \"httpAttempts\": 1
        }" \
        --silent --show-error
    
    echo "✅ Sent: ${mileage}km - $description"
    sleep 1
}

# Day 1: Normal operation (24-20 hours ago)
echo "📅 Day 1: Normal operation"
send_telemetry 45000 24 "Day 1 - Normal operation"
send_telemetry 45050 20 "Day 1 - Normal operation"

# Day 2: Normal operation (16-12 hours ago)
echo "📅 Day 2: Normal operation"
send_telemetry 45100 16 "Day 2 - Normal operation"
send_telemetry 45150 12 "Day 2 - Normal operation"

# Day 3: FRAUD SCENARIO - Odometer rollback (8-4 hours ago)
echo "🚨 Day 3: FRAUD SCENARIO - Odometer rollback"
send_telemetry 45200 8 "Day 3 - Normal before rollback"
send_telemetry 82 4 "Day 3 - FRAUD ROLLBACK DETECTED"

# Day 4: Recovery (2-1 hours ago)
echo "📅 Day 4: Recovery"
send_telemetry 45300 2 "Day 4 - Recovery attempt"
send_telemetry 45350 1 "Day 4 - Recovery attempt"

# Day 5: Current (now)
echo "📅 Day 5: Current"
send_telemetry 45400 0 "Day 5 - Current reading"

echo ""
echo "🎉 Test data generation completed!"
echo "📊 Total records sent: 8"
echo "🚨 Fraud scenario included (45,200km → 82km rollback)"
echo "✅ Recovery scenarios included"
echo ""
echo "🔍 Check the backend logs for fraud detection alerts!"
echo "📱 Check the frontend at http://localhost:5173/test/mileage-history"