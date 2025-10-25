@echo off
REM Test data generation script for OBD3001 device and VIN 1HGCM82633A12DSAA
REM This script generates realistic telemetry data over multiple days

set DEVICE_ID=OBD3001
set VIN=1HGCM82633A12DSAA
set BASE_URL=http://localhost:3000

echo 🚀 Starting test data generation for %DEVICE_ID% (%VIN%)

REM Function to get timestamp (hours ago)
set /a TIMESTAMP_24H=%time:~0,2%*3600000+%time:~3,2%*60000+%time:~6,2%*1000-86400000
set /a TIMESTAMP_20H=%time:~0,2%*3600000+%time:~3,2%*60000+%time:~6,2%*1000-72000000
set /a TIMESTAMP_16H=%time:~0,2%*3600000+%time:~3,2%*60000+%time:~6,2%*1000-57600000
set /a TIMESTAMP_12H=%time:~0,2%*3600000+%time:~3,2%*60000+%time:~6,2%*1000-43200000
set /a TIMESTAMP_8H=%time:~0,2%*3600000+%time:~3,2%*60000+%time:~6,2%*1000-28800000
set /a TIMESTAMP_4H=%time:~0,2%*3600000+%time:~3,2%*60000+%time:~6,2%*1000-14400000
set /a TIMESTAMP_2H=%time:~0,2%*3600000+%time:~3,2%*60000+%time:~6,2%*1000-7200000
set /a TIMESTAMP_1H=%time:~0,2%*3600000+%time:~3,2%*60000+%time:~6,2%*1000-3600000
set /a TIMESTAMP_NOW=%time:~0,2%*3600000+%time:~3,2%*60000+%time:~6,2%*1000

echo 📅 Day 1: Normal operation
curl -X POST "%BASE_URL%/api/device/status" ^
    -H "Content-Type: application/json" ^
    -d "{\"deviceID\":\"%DEVICE_ID%\",\"status\":\"obd_connected\",\"vin\":\"%VIN%\",\"mileage\":45000,\"rpm\":1200,\"speed\":45,\"engineTemp\":90,\"fuelLevel\":75,\"batteryVoltage\":12.6,\"dataQuality\":98,\"odometerPID\":\"0x201C\",\"dataSource\":\"veepeak_obd\",\"timestamp\":%TIMESTAMP_24H%,\"message\":\"Day 1 - Normal operation\",\"bootCount\":5,\"signalStrength\":\"Good\",\"networkOperator\":\"Verizon\",\"freeHeap\":150000,\"veepeakConnected\":true,\"httpAttempts\":1}" ^
    --silent --show-error
echo ✅ Sent: 45000km - Day 1 - Normal operation
timeout /t 1 /nobreak >nul

curl -X POST "%BASE_URL%/api/device/status" ^
    -H "Content-Type: application/json" ^
    -d "{\"deviceID\":\"%DEVICE_ID%\",\"status\":\"obd_connected\",\"vin\":\"%VIN%\",\"mileage\":45050,\"rpm\":1500,\"speed\":60,\"engineTemp\":92,\"fuelLevel\":70,\"batteryVoltage\":12.8,\"dataQuality\":97,\"odometerPID\":\"0x201C\",\"dataSource\":\"veepeak_obd\",\"timestamp\":%TIMESTAMP_20H%,\"message\":\"Day 1 - Normal operation\",\"bootCount\":6,\"signalStrength\":\"Good\",\"networkOperator\":\"Verizon\",\"freeHeap\":145000,\"veepeakConnected\":true,\"httpAttempts\":1}" ^
    --silent --show-error
echo ✅ Sent: 45050km - Day 1 - Normal operation
timeout /t 1 /nobreak >nul

echo 📅 Day 2: Normal operation
curl -X POST "%BASE_URL%/api/device/status" ^
    -H "Content-Type: application/json" ^
    -d "{\"deviceID\":\"%DEVICE_ID%\",\"status\":\"obd_connected\",\"vin\":\"%VIN%\",\"mileage\":45100,\"rpm\":1800,\"speed\":35,\"engineTemp\":88,\"fuelLevel\":65,\"batteryVoltage\":12.5,\"dataQuality\":99,\"odometerPID\":\"0x201C\",\"dataSource\":\"veepeak_obd\",\"timestamp\":%TIMESTAMP_16H%,\"message\":\"Day 2 - Normal operation\",\"bootCount\":7,\"signalStrength\":\"Good\",\"networkOperator\":\"Verizon\",\"freeHeap\":140000,\"veepeakConnected\":true,\"httpAttempts\":1}" ^
    --silent --show-error
echo ✅ Sent: 45100km - Day 2 - Normal operation
timeout /t 1 /nobreak >nul

curl -X POST "%BASE_URL%/api/device/status" ^
    -H "Content-Type: application/json" ^
    -d "{\"deviceID\":\"%DEVICE_ID%\",\"status\":\"obd_connected\",\"vin\":\"%VIN%\",\"mileage\":45150,\"rpm\":2000,\"speed\":55,\"engineTemp\":95,\"fuelLevel\":60,\"batteryVoltage\":12.7,\"dataQuality\":96,\"odometerPID\":\"0x201C\",\"dataSource\":\"veepeak_obd\",\"timestamp\":%TIMESTAMP_12H%,\"message\":\"Day 2 - Normal operation\",\"bootCount\":8,\"signalStrength\":\"Good\",\"networkOperator\":\"Verizon\",\"freeHeap\":135000,\"veepeakConnected\":true,\"httpAttempts\":1}" ^
    --silent --show-error
echo ✅ Sent: 45150km - Day 2 - Normal operation
timeout /t 1 /nobreak >nul

echo 🚨 Day 3: FRAUD SCENARIO - Odometer rollback
curl -X POST "%BASE_URL%/api/device/status" ^
    -H "Content-Type: application/json" ^
    -d "{\"deviceID\":\"%DEVICE_ID%\",\"status\":\"obd_connected\",\"vin\":\"%VIN%\",\"mileage\":45200,\"rpm\":1600,\"speed\":40,\"engineTemp\":89,\"fuelLevel\":55,\"batteryVoltage\":12.4,\"dataQuality\":98,\"odometerPID\":\"0x201C\",\"dataSource\":\"veepeak_obd\",\"timestamp\":%TIMESTAMP_8H%,\"message\":\"Day 3 - Normal before rollback\",\"bootCount\":9,\"signalStrength\":\"Good\",\"networkOperator\":\"Verizon\",\"freeHeap\":130000,\"veepeakConnected\":true,\"httpAttempts\":1}" ^
    --silent --show-error
echo ✅ Sent: 45200km - Day 3 - Normal before rollback
timeout /t 1 /nobreak >nul

curl -X POST "%BASE_URL%/api/device/status" ^
    -H "Content-Type: application/json" ^
    -d "{\"deviceID\":\"%DEVICE_ID%\",\"status\":\"obd_connected\",\"vin\":\"%VIN%\",\"mileage\":82,\"rpm\":1200,\"speed\":25,\"engineTemp\":85,\"fuelLevel\":50,\"batteryVoltage\":12.3,\"dataQuality\":95,\"odometerPID\":\"0x201C\",\"dataSource\":\"veepeak_obd\",\"timestamp\":%TIMESTAMP_4H%,\"message\":\"Day 3 - FRAUD ROLLBACK DETECTED\",\"bootCount\":10,\"signalStrength\":\"Good\",\"networkOperator\":\"Verizon\",\"freeHeap\":125000,\"veepeakConnected\":true,\"httpAttempts\":1}" ^
    --silent --show-error
echo 🚨 Sent: 82km - Day 3 - FRAUD ROLLBACK DETECTED
timeout /t 1 /nobreak >nul

echo 📅 Day 4: Recovery
curl -X POST "%BASE_URL%/api/device/status" ^
    -H "Content-Type: application/json" ^
    -d "{\"deviceID\":\"%DEVICE_ID%\",\"status\":\"obd_connected\",\"vin\":\"%VIN%\",\"mileage\":45300,\"rpm\":1400,\"speed\":30,\"engineTemp\":87,\"fuelLevel\":45,\"batteryVoltage\":12.5,\"dataQuality\":97,\"odometerPID\":\"0x201C\",\"dataSource\":\"veepeak_obd\",\"timestamp\":%TIMESTAMP_2H%,\"message\":\"Day 4 - Recovery attempt\",\"bootCount\":11,\"signalStrength\":\"Good\",\"networkOperator\":\"Verizon\",\"freeHeap\":120000,\"veepeakConnected\":true,\"httpAttempts\":1}" ^
    --silent --show-error
echo ✅ Sent: 45300km - Day 4 - Recovery attempt
timeout /t 1 /nobreak >nul

curl -X POST "%BASE_URL%/api/device/status" ^
    -H "Content-Type: application/json" ^
    -d "{\"deviceID\":\"%DEVICE_ID%\",\"status\":\"obd_connected\",\"vin\":\"%VIN%\",\"mileage\":45350,\"rpm\":1700,\"speed\":50,\"engineTemp\":91,\"fuelLevel\":40,\"batteryVoltage\":12.6,\"dataQuality\":98,\"odometerPID\":\"0x201C\",\"dataSource\":\"veepeak_obd\",\"timestamp\":%TIMESTAMP_1H%,\"message\":\"Day 4 - Recovery attempt\",\"bootCount\":12,\"signalStrength\":\"Good\",\"networkOperator\":\"Verizon\",\"freeHeap\":115000,\"veepeakConnected\":true,\"httpAttempts\":1}" ^
    --silent --show-error
echo ✅ Sent: 45350km - Day 4 - Recovery attempt
timeout /t 1 /nobreak >nul

echo 📅 Day 5: Current
curl -X POST "%BASE_URL%/api/device/status" ^
    -H "Content-Type: application/json" ^
    -d "{\"deviceID\":\"%DEVICE_ID%\",\"status\":\"obd_connected\",\"vin\":\"%VIN%\",\"mileage\":45400,\"rpm\":1900,\"speed\":65,\"engineTemp\":93,\"fuelLevel\":35,\"batteryVoltage\":12.8,\"dataQuality\":99,\"odometerPID\":\"0x201C\",\"dataSource\":\"veepeak_obd\",\"timestamp\":%TIMESTAMP_NOW%,\"message\":\"Day 5 - Current reading\",\"bootCount\":13,\"signalStrength\":\"Good\",\"networkOperator\":\"Verizon\",\"freeHeap\":110000,\"veepeakConnected\":true,\"httpAttempts\":1}" ^
    --silent --show-error
echo ✅ Sent: 45400km - Day 5 - Current reading

echo.
echo 🎉 Test data generation completed!
echo 📊 Total records sent: 8
echo 🚨 Fraud scenario included (45,200km → 82km rollback)
echo ✅ Recovery scenarios included
echo.
echo 🔍 Check the backend logs for fraud detection alerts!
echo 📱 Check the frontend at http://localhost:5173/test/mileage-history
pause