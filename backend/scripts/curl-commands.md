# Telemetry Test Data - Curl Commands

**VIN:** 1HGCM82633A123465  
**Device:** OBD3001  
**Current Mileage:** 65076 km  

## 📅 TODAY - Valid Data (5 records)

### 1. Morning Drive (8:00 AM) - +5 km
```bash
curl -X POST http://localhost:3000/api/device/status \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "OBD3001",
    "vin": "1HGCM82633A123465",
    "status": "obd_connected",
    "mileage": 65081,
    "speed": 45,
    "rpm": 2200,
    "engineTemp": 88,
    "fuelLevel": 75,
    "dataQuality": 98,
    "timestamp": "2025-10-25T08:00:00.000Z"
  }'
```

### 2. Lunch Break (12:30 PM) - +12 km
```bash
curl -X POST http://localhost:3000/api/device/status \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "OBD3001",
    "vin": "1HGCM82633A123465",
    "status": "obd_connected",
    "mileage": 65093,
    "speed": 0,
    "rpm": 0,
    "engineTemp": 85,
    "fuelLevel": 72,
    "dataQuality": 99,
    "timestamp": "2025-10-25T12:30:00.000Z"
  }'
```

### 3. Afternoon Drive (3:15 PM) - +8 km
```bash
curl -X POST http://localhost:3000/api/device/status \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "OBD3001",
    "vin": "1HGCM82633A123465",
    "status": "obd_connected",
    "mileage": 65101,
    "speed": 35,
    "rpm": 1800,
    "engineTemp": 90,
    "fuelLevel": 68,
    "dataQuality": 97,
    "timestamp": "2025-10-25T15:15:00.000Z"
  }'
```

### 4. Evening Commute (6:45 PM) - +15 km
```bash
curl -X POST http://localhost:3000/api/device/status \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "OBD3001",
    "vin": "1HGCM82633A123465",
    "status": "obd_connected",
    "mileage": 65116,
    "speed": 55,
    "rpm": 2500,
    "engineTemp": 92,
    "fuelLevel": 65,
    "dataQuality": 99,
    "timestamp": "2025-10-25T18:45:00.000Z"
  }'
```

### 5. End of Day (9:30 PM) - +3 km
```bash
curl -X POST http://localhost:3000/api/device/status \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "OBD3001",
    "vin": "1HGCM82633A123465",
    "status": "obd_connected",
    "mileage": 65119,
    "speed": 0,
    "rpm": 0,
    "engineTemp": 87,
    "fuelLevel": 63,
    "dataQuality": 98,
    "timestamp": "2025-10-25T21:30:00.000Z"
  }'
```

## 📅 TOMORROW - Fraudulent Data (1 record)

### 6. Tomorrow Morning (8:00 AM) - FRAUD: Rollback -20000 km
```bash
curl -X POST http://localhost:3000/api/device/status \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "OBD3001",
    "vin": "1HGCM82633A123465",
    "status": "obd_connected",
    "mileage": 45119,
    "speed": 0,
    "rpm": 0,
    "engineTemp": 85,
    "fuelLevel": 60,
    "dataQuality": 95,
    "timestamp": "2025-10-26T08:00:00.000Z"
  }'
```

## 🎯 Expected Results

### Today's Records (Valid):
- **Record 1:** 65076 → 65081 km (+5 km) ✅ VALID
- **Record 2:** 65081 → 65093 km (+12 km) ✅ VALID  
- **Record 3:** 65093 → 65101 km (+8 km) ✅ VALID
- **Record 4:** 65101 → 65116 km (+15 km) ✅ VALID
- **Record 5:** 65116 → 65119 km (+3 km) ✅ VALID

### Tomorrow's Record (Fraud):
- **Record 6:** 65119 → 45119 km (-20000 km) 🚨 ROLLBACK_DETECTED

## 🚨 Fraud Detection Details

**Previous Mileage:** 65119 km  
**Reported Mileage:** 45119 km  
**Delta:** -20000 km (impossible decrease)  
**Status:** ROLLBACK_DETECTED  
**Fraud Alert:** ODOMETER ROLLBACK DETECTED  
**Fraud Score:** 95%  
**Reason:** Odometer tampering - mileage decreased by 20,000 km  

## 📊 Mileage Progression Summary

```
65076 km (starting)
    ↓ +5 km
65081 km (morning drive)
    ↓ +12 km  
65093 km (lunch break)
    ↓ +8 km
65101 km (afternoon drive)
    ↓ +15 km
65116 km (evening commute)
    ↓ +3 km
65119 km (end of day)
    ↓ -20000 km (FRAUD!)
45119 km (tomorrow - rollback detected)
```

## 🔧 Execution Instructions

### Run All Commands:
```bash
# Linux/Mac
chmod +x scripts/telemetry-test-data.sh
./scripts/telemetry-test-data.sh

# Windows
scripts/telemetry-test-data.bat
```

### Run Individual Commands:
Copy and paste each curl command individually to test specific scenarios.
