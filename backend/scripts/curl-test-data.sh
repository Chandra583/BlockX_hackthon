#!/bin/bash

# Quick 3-day test data injection using cURL
# Device: OBD30011, VIN: 1HGCM82633A12DSKL

DEVICE_ID="OBD30011"
VIN="1HGCM82633A12DSKL"
BASE_URL="http://localhost:3000/api"

echo "🚀 Starting 3-day test data injection..."
echo "📱 Device: $DEVICE_ID"
echo "🚗 VIN: $VIN"
echo "🌐 API: $BASE_URL"
echo ""

# Day 1 - Installation day
echo "📅 Day 1 - 2025-01-12 (Installation day)"
echo "   🚗 Trip 1: Test drive after installation (40km → 42km)"

# Trip 1 Start
curl -X POST "$BASE_URL/device/status" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "'$DEVICE_ID'",
    "status": "obd_connected",
    "vin": "'$VIN'",
    "mileage": 40,
    "rpm": 1500,
    "speed": 0,
    "engineTemp": 85,
    "fuelLevel": 70,
    "batteryVoltage": 12.4,
    "dataQuality": 98,
    "odometerPID": "0x201C",
    "dataSource": "veepeak_obd",
    "timestamp": 1736676000000,
    "tripStart": true,
    "engineOn": true
  }'

echo ""
echo "   📤 Trip 1 start sent"

# Trip 1 End
curl -X POST "$BASE_URL/device/status" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "'$DEVICE_ID'",
    "status": "obd_connected",
    "vin": "'$VIN'",
    "mileage": 42,
    "rpm": 0,
    "speed": 0,
    "engineTemp": 90,
    "fuelLevel": 68,
    "batteryVoltage": 12.3,
    "dataQuality": 97,
    "odometerPID": "0x201C",
    "dataSource": "veepeak_obd",
    "timestamp": 1736677800000,
    "tripEnd": true,
    "engineOff": true
  }'

echo ""
echo "   📤 Trip 1 end sent"

# Trip 2 Start
echo "   🚗 Trip 2: Drive to gas station (42km → 45km)"
curl -X POST "$BASE_URL/device/status" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "'$DEVICE_ID'",
    "status": "obd_connected",
    "vin": "'$VIN'",
    "mileage": 42,
    "rpm": 2000,
    "speed": 45,
    "engineTemp": 88,
    "fuelLevel": 68,
    "batteryVoltage": 12.5,
    "dataQuality": 96,
    "odometerPID": "0x201C",
    "dataSource": "veepeak_obd",
    "timestamp": 1736688600000,
    "tripStart": true,
    "engineOn": true
  }'

echo ""
echo "   📤 Trip 2 start sent"

# Trip 2 End
curl -X POST "$BASE_URL/device/status" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "'$DEVICE_ID'",
    "status": "obd_connected",
    "vin": "'$VIN'",
    "mileage": 45,
    "rpm": 0,
    "speed": 0,
    "engineTemp": 92,
    "fuelLevel": 85,
    "batteryVoltage": 12.4,
    "dataQuality": 98,
    "odometerPID": "0x201C",
    "dataSource": "veepeak_obd",
    "timestamp": 1736690400000,
    "tripEnd": true,
    "engineOff": true
  }'

echo ""
echo "   📤 Trip 2 end sent"

# Consolidate Day 1
echo "   🔄 Triggering consolidation for 2025-01-12..."
curl -X POST "$BASE_URL/vehicles/68f76921df4eb8fa3db14d34/consolidate-batch" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-01-12"}'

echo ""
echo "   ✅ Day 1 completed"
echo ""

# Day 2 - Daily commute
echo "📅 Day 2 - 2025-01-13 (Daily commute)"
echo "   🚗 Trip 1: Morning commute (45km → 52km)"

# Trip 1 Start
curl -X POST "$BASE_URL/device/status" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "'$DEVICE_ID'",
    "status": "obd_connected",
    "vin": "'$VIN'",
    "mileage": 45,
    "rpm": 1800,
    "speed": 35,
    "engineTemp": 87,
    "fuelLevel": 85,
    "batteryVoltage": 12.6,
    "dataQuality": 97,
    "odometerPID": "0x201C",
    "dataSource": "veepeak_obd",
    "timestamp": 1736762400000,
    "tripStart": true,
    "engineOn": true
  }'

echo ""
echo "   📤 Trip 1 start sent"

# Trip 1 End
curl -X POST "$BASE_URL/device/status" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "'$DEVICE_ID'",
    "status": "obd_connected",
    "vin": "'$VIN'",
    "mileage": 52,
    "rpm": 0,
    "speed": 0,
    "engineTemp": 89,
    "fuelLevel": 82,
    "batteryVoltage": 12.5,
    "dataQuality": 96,
    "odometerPID": "0x201C",
    "dataSource": "veepeak_obd",
    "timestamp": 1736766000000,
    "tripEnd": true,
    "engineOff": true
  }'

echo ""
echo "   📤 Trip 1 end sent"

# Trip 2 Start
echo "   🚗 Trip 2: Lunch break (52km → 58km)"
curl -X POST "$BASE_URL/device/status" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "'$DEVICE_ID'",
    "status": "obd_connected",
    "vin": "'$VIN'",
    "mileage": 52,
    "rpm": 1600,
    "speed": 25,
    "engineTemp": 86,
    "fuelLevel": 82,
    "batteryVoltage": 12.4,
    "dataQuality": 95,
    "odometerPID": "0x201C",
    "dataSource": "veepeak_obd",
    "timestamp": 1736784000000,
    "tripStart": true,
    "engineOn": true
  }'

echo ""
echo "   📤 Trip 2 start sent"

# Trip 2 End
curl -X POST "$BASE_URL/device/status" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "'$DEVICE_ID'",
    "status": "obd_connected",
    "vin": "'$VIN'",
    "mileage": 58,
    "rpm": 0,
    "speed": 0,
    "engineTemp": 88,
    "fuelLevel": 78,
    "batteryVoltage": 12.3,
    "dataQuality": 97,
    "odometerPID": "0x201C",
    "dataSource": "veepeak_obd",
    "timestamp": 1736785800000,
    "tripEnd": true,
    "engineOff": true
  }'

echo ""
echo "   📤 Trip 2 end sent"

# Trip 3 Start
echo "   🚗 Trip 3: Evening commute (58km → 65km)"
curl -X POST "$BASE_URL/device/status" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "'$DEVICE_ID'",
    "status": "obd_connected",
    "vin": "'$VIN'",
    "mileage": 58,
    "rpm": 1900,
    "speed": 40,
    "engineTemp": 90,
    "fuelLevel": 78,
    "batteryVoltage": 12.5,
    "dataQuality": 98,
    "odometerPID": "0x201C",
    "dataSource": "veepeak_obd",
    "timestamp": 1736802000000,
    "tripStart": true,
    "engineOn": true
  }'

echo ""
echo "   📤 Trip 3 start sent"

# Trip 3 End
curl -X POST "$BASE_URL/device/status" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "'$DEVICE_ID'",
    "status": "obd_connected",
    "vin": "'$VIN'",
    "mileage": 65,
    "rpm": 0,
    "speed": 0,
    "engineTemp": 91,
    "fuelLevel": 75,
    "batteryVoltage": 12.4,
    "dataQuality": 96,
    "odometerPID": "0x201C",
    "dataSource": "veepeak_obd",
    "timestamp": 1736805600000,
    "tripEnd": true,
    "engineOff": true
  }'

echo ""
echo "   📤 Trip 3 end sent"

# Consolidate Day 2
echo "   🔄 Triggering consolidation for 2025-01-13..."
curl -X POST "$BASE_URL/vehicles/68f76921df4eb8fa3db14d34/consolidate-batch" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-01-13"}'

echo ""
echo "   ✅ Day 2 completed"
echo ""

# Day 3 - Weekend trip
echo "📅 Day 3 - 2025-01-14 (Weekend trip)"
echo "   🚗 Trip 1: Weekend shopping (65km → 85km)"

# Trip 1 Start
curl -X POST "$BASE_URL/device/status" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "'$DEVICE_ID'",
    "status": "obd_connected",
    "vin": "'$VIN'",
    "mileage": 65,
    "rpm": 2200,
    "speed": 55,
    "engineTemp": 89,
    "fuelLevel": 75,
    "batteryVoltage": 12.6,
    "dataQuality": 98,
    "odometerPID": "0x201C",
    "dataSource": "veepeak_obd",
    "timestamp": 1736848800000,
    "tripStart": true,
    "engineOn": true
  }'

echo ""
echo "   📤 Trip 1 start sent"

# Trip 1 End
curl -X POST "$BASE_URL/device/status" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "'$DEVICE_ID'",
    "status": "obd_connected",
    "vin": "'$VIN'",
    "mileage": 85,
    "rpm": 0,
    "speed": 0,
    "engineTemp": 92,
    "fuelLevel": 70,
    "batteryVoltage": 12.5,
    "dataQuality": 97,
    "odometerPID": "0x201C",
    "dataSource": "veepeak_obd",
    "timestamp": 1736856000000,
    "tripEnd": true,
    "engineOff": true
  }'

echo ""
echo "   📤 Trip 1 end sent"

# Trip 2 Start
echo "   🚗 Trip 2: Return home (85km → 90km)"
curl -X POST "$BASE_URL/device/status" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "'$DEVICE_ID'",
    "status": "obd_connected",
    "vin": "'$VIN'",
    "mileage": 85,
    "rpm": 1700,
    "speed": 50,
    "engineTemp": 88,
    "fuelLevel": 70,
    "batteryVoltage": 12.4,
    "dataQuality": 96,
    "odometerPID": "0x201C",
    "dataSource": "veepeak_obd",
    "timestamp": 1736874000000,
    "tripStart": true,
    "engineOn": true
  }'

echo ""
echo "   📤 Trip 2 start sent"

# Trip 2 End
curl -X POST "$BASE_URL/device/status" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "'$DEVICE_ID'",
    "status": "obd_connected",
    "vin": "'$VIN'",
    "mileage": 90,
    "rpm": 0,
    "speed": 0,
    "engineTemp": 90,
    "fuelLevel": 65,
    "batteryVoltage": 12.3,
    "dataQuality": 98,
    "odometerPID": "0x201C",
    "dataSource": "veepeak_obd",
    "timestamp": 1736877600000,
    "tripEnd": true,
    "engineOff": true
  }'

echo ""
echo "   📤 Trip 2 end sent"

# Consolidate Day 3
echo "   🔄 Triggering consolidation for 2025-01-14..."
curl -X POST "$BASE_URL/vehicles/68f76921df4eb8fa3db14d34/consolidate-batch" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-01-14"}'

echo ""
echo "   ✅ Day 3 completed"
echo ""

echo "🎉 3-day test data injection completed!"
echo ""
echo "📊 Summary:"
echo "   - Days: 3"
echo "   - Total trips: 7"
echo "   - Final mileage: 90km"
echo "   - Device: $DEVICE_ID"
echo "   - VIN: $VIN"
echo ""
echo "🔍 Next steps:"
echo "   1. Check Daily Telemetry Batches UI in frontend"
echo "   2. Verify Solana transaction hashes in explorer"
echo "   3. Check backend logs for consolidation status"
echo "   4. Verify database telemetry_batches collection"
