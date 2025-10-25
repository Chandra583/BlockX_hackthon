# Test Data Generation for OBD3001 Device

This document provides comprehensive test data generation scripts for device `OBD3001` and VIN `1HGCM82633A12DSAA` to test the fraud detection system.

## 🚀 Quick Start

### Option 1: Node.js Script (Recommended)
```bash
cd backend
node scripts/quick-test-data.js
```

### Option 2: Bash Script (Linux/Mac)
```bash
cd backend
chmod +x scripts/curl-test-data.sh
./scripts/curl-test-data.sh
```

### Option 3: Windows Batch File
```cmd
cd backend
scripts\curl-test-data.bat
```

## 📊 Test Scenarios

### Scenario 1: Normal Operation (Days 1-2)
- **Mileage Progression**: 45,000km → 45,050km → 45,100km → 45,150km
- **Pattern**: Normal daily driving with realistic mileage increases
- **Expected Result**: All records accepted, no fraud alerts

### Scenario 2: Fraud Detection (Day 3)
- **Mileage Progression**: 45,200km → **82km** (MASSIVE ROLLBACK)
- **Pattern**: Odometer rollback from 45,200km to 82km
- **Expected Result**: 
  - HTTP 422 response
  - `flagged: true`
  - `validationStatus: 'ROLLBACK_DETECTED'`
  - Socket event: `fraud_flagged`
  - Not anchored to blockchain

### Scenario 3: Recovery Attempts (Days 4-5)
- **Mileage Progression**: 45,300km → 45,350km → 45,400km
- **Pattern**: Attempting to recover from fraud
- **Expected Result**: Records accepted if mileage increases

## 🔧 Manual Testing Commands

### Test Normal Operation
```bash
curl -X POST http://localhost:3000/api/device/status \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "OBD3001",
    "status": "obd_connected",
    "vin": "1HGCM82633A12DSAA",
    "mileage": 45100,
    "rpm": 1500,
    "speed": 45,
    "engineTemp": 90,
    "fuelLevel": 75,
    "batteryVoltage": 12.6,
    "dataQuality": 98,
    "odometerPID": "0x201C",
    "dataSource": "veepeak_obd",
    "timestamp": '$(date +%s000)',
    "message": "Normal operation test",
    "bootCount": 5,
    "signalStrength": "Good",
    "networkOperator": "Verizon",
    "freeHeap": 150000,
    "veepeakConnected": true,
    "httpAttempts": 1
  }'
```

### Test Fraud Detection
```bash
curl -X POST http://localhost:3000/api/device/status \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "OBD3001",
    "status": "obd_connected",
    "vin": "1HGCM82633A12DSAA",
    "mileage": 82,
    "rpm": 1200,
    "speed": 25,
    "engineTemp": 85,
    "fuelLevel": 50,
    "batteryVoltage": 12.3,
    "dataQuality": 95,
    "odometerPID": "0x201C",
    "dataSource": "veepeak_obd",
    "timestamp": '$(date +%s000)',
    "message": "FRAUD ROLLBACK DETECTED",
    "bootCount": 10,
    "signalStrength": "Good",
    "networkOperator": "Verizon",
    "freeHeap": 125000,
    "veepeakConnected": true,
    "httpAttempts": 1
  }'
```

## 📱 Frontend Testing

### Test the Mileage History Component
1. **Visit**: `http://localhost:5173/test/mileage-history`
2. **Expected**: See the fraud detection demo with:
   - Rollback scenario (45,200km → 82km)
   - Validation badges (Rollback, Valid, etc.)
   - Delta calculations (-45,118km for rollback)
   - Blockchain links for valid records

### Test the Vehicle Details Page
1. **Visit**: `http://localhost:5173/owner/vehicles/{vehicleId}`
2. **Expected**: See fraud detection cards:
   - Fraud Alert Card with rollback detection
   - OBD Data Validation Card with fraud score

## 🔍 Backend Logs to Monitor

### Successful Fraud Detection
```
🚨 FRAUD ALERT: Odometer rollback detected for VIN 1HGCM82633A12DSAA: 45200 -> 82 km
❌ Telemetry flagged: rollback_detected
🚨 Socket event: fraud_flagged
```

### Successful Normal Operation
```
✅ Telemetry accepted: 45100 km (+100 km)
✅ Socket event: telemetry_accepted
✅ Anchored to blockchain
```

## 📊 Expected Database Records

### VehicleTelemetry Collection
```json
{
  "deviceID": "OBD3001",
  "vin": "1HGCM82633A12DSAA",
  "obd": {
    "mileage": 82,
    "rpm": 1200,
    "speed": 25,
    "engineTemp": 85,
    "fuelLevel": 50,
    "batteryVoltage": 12.3,
    "dataQuality": 95
  },
  "validation": {
    "previousMileage": 45200,
    "newMileage": 82,
    "delta": -45118,
    "tamperingDetected": true,
    "validationStatus": "ROLLBACK_DETECTED",
    "flagged": true,
    "reason": "Reported mileage (82 km) is significantly lower than last verified mileage (45200 km)."
  },
  "flagged": true,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Vehicle Collection Update
```json
{
  "vin": "1HGCM82633A12DSAA",
  "currentMileage": 45200,
  "lastVerifiedMileage": 45200,
  "lastMileageUpdate": "2024-01-15T10:30:00.000Z"
}
```

## 🎯 Testing Checklist

- [ ] **Backend running** on `http://localhost:3000`
- [ ] **Frontend running** on `http://localhost:5173`
- [ ] **Database connected** and accessible
- [ ] **Socket.IO** connection established
- [ ] **Test data generated** using one of the scripts
- [ ] **Fraud detection** working (HTTP 422 for rollback)
- [ ] **Frontend components** displaying fraud alerts
- [ ] **Mileage history** showing validation status
- [ ] **Blockchain anchoring** working for valid records
- [ ] **Socket events** being emitted correctly

## 🚨 Troubleshooting

### Common Issues

1. **"Connection refused"**
   - Ensure backend is running: `npm run dev` in backend directory

2. **"CORS error"**
   - Check backend CORS configuration
   - Ensure frontend URL is whitelisted

3. **"Database connection failed"**
   - Check MongoDB connection string
   - Ensure MongoDB is running

4. **"Socket connection failed"**
   - Check Socket.IO configuration
   - Ensure both frontend and backend are running

### Debug Commands

```bash
# Check backend logs
tail -f backend/logs/combined-$(date +%Y-%m-%d).log

# Check database connection
mongo --eval "db.adminCommand('ismaster')"

# Test API endpoint
curl -X GET http://localhost:3000/api/health
```

## 📈 Performance Testing

### Load Testing
```bash
# Generate 100 records quickly
for i in {1..100}; do
  node scripts/quick-test-data.js
  sleep 0.1
done
```

### Stress Testing
```bash
# Generate fraud scenarios
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/device/status \
    -H "Content-Type: application/json" \
    -d '{"deviceID":"OBD3001","vin":"1HGCM82633A12DSAA","mileage":'$((82 + i))',"timestamp":'$(date +%s000)'}'
done
```

## 🎉 Success Criteria

- ✅ **Fraud detection** working (rollback flagged)
- ✅ **Normal operation** working (valid records accepted)
- ✅ **Frontend display** showing fraud alerts
- ✅ **Mileage history** with validation status
- ✅ **Blockchain integration** working
- ✅ **Real-time updates** via Socket.IO
- ✅ **Database consistency** maintained

Ready for hackathon demo! 🚀
