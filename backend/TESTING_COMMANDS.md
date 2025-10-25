# Manual Testing Commands

## Setup Test Vehicle

```bash
# Create test vehicle with 67000 km
curl -X POST http://localhost:3000/api/vehicles/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "vin": "TEST12345678901234",
    "vehicleNumber": "TEST001",
    "make": "Test",
    "model": "Model",
    "year": 2023,
    "initialMileage": 67000,
    "color": "White",
    "bodyType": "sedan",
    "fuelType": "gasoline",
    "transmission": "automatic"
  }'
```

## Test Case 1: Valid Mileage Increase

```bash
# Should return 200 OK
curl -X POST http://localhost:3000/api/device/status \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "TEST_DEVICE_001",
    "status": "obd_connected",
    "vin": "TEST12345678901234",
    "mileage": 67100,
    "timestamp": 1735128000000,
    "dataSource": "veepeak_obd"
  }'

# Expected Response:
# {
#   "status": "success",
#   "data": {
#     "mileageValidation": {
#       "reportedMileage": 67100,
#       "previousMileage": 67000,
#       "newMileage": 67100,
#       "delta": 100,
#       "flagged": false,
#       "validationStatus": "VALID"
#     }
#   }
# }
```

## Test Case 2: Rollback Detection (Your Bug Case)

```bash
# Should return 422 Flagged
curl -X POST http://localhost:3000/api/device/status \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "TEST_DEVICE_001",
    "status": "obd_connected",
    "vin": "TEST12345678901234",
    "mileage": 82,
    "timestamp": 1735128000000,
    "dataSource": "veepeak_obd"
  }'

# Expected Response:
# {
#   "status": "flagged",
#   "flagged": true,
#   "reason": "Odometer rollback detected: 65918 km decrease",
#   "previousMileage": 67000,
#   "reportedMileage": 82,
#   "delta": -65918
# }
```

## Test Case 3: Small Rollback (Within Tolerance)

```bash
# Should return 200 OK (within 5km tolerance)
curl -X POST http://localhost:3000/api/device/status \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "TEST_DEVICE_001",
    "status": "obd_connected",
    "vin": "TEST12345678901234",
    "mileage": 66997,
    "timestamp": 1735128000000,
    "dataSource": "veepeak_obd"
  }'
```

## Test Case 4: Large Rollback (Fraud)

```bash
# Should return 422 Flagged
curl -X POST http://localhost:3000/api/device/status \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "TEST_DEVICE_001",
    "status": "obd_connected",
    "vin": "TEST12345678901234",
    "mileage": 66990,
    "timestamp": 1735128000000,
    "dataSource": "veepeak_obd"
  }'
```

## Test Case 5: Backwards Compatibility

```bash
# Test old 'currentMileage' key
curl -X POST http://localhost:3000/api/device/status \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "TEST_DEVICE_001",
    "status": "obd_connected",
    "vin": "TEST12345678901234",
    "currentMileage": 67200,
    "timestamp": 1735128000000,
    "dataSource": "veepeak_obd"
  }'

# Test new 'newMileage' key
curl -X POST http://localhost:3000/api/device/status \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "TEST_DEVICE_001",
    "status": "obd_connected",
    "vin": "TEST12345678901234",
    "newMileage": 67300,
    "timestamp": 1735128000000,
    "dataSource": "veepeak_obd"
  }'
```

## Verification Steps

### 1. Check Vehicle Mileage Update

```bash
# Get vehicle details
curl -X GET http://localhost:3000/api/vehicles/TEST_VEHICLE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Verify lastVerifiedMileage was updated for valid records
# Verify lastVerifiedMileage was NOT updated for flagged records
```

### 2. Check Telemetry Records

```bash
# Get telemetry history
curl -X GET http://localhost:3000/api/vehicles/TEST_VEHICLE_ID/telemetry \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Verify:
# - Valid records have flagged: false
# - Flagged records have flagged: true
# - Delta calculations are correct
# - Validation status is set properly
```

### 3. Check Blockchain Anchoring

```bash
# Valid records should have solanaTx
# Flagged records should NOT have solanaTx
# Check Solana explorer for transaction details
```

## Expected Results Summary

| Test Case | HTTP Status | Flagged | Delta | Anchored |
|-----------|-------------|---------|-------|----------|
| 67000 → 67100 | 200 | false | +100 | Yes |
| 67000 → 82 | 422 | true | -65918 | No |
| 67000 → 66997 | 200 | false | -3 | Yes |
| 67000 → 66990 | 422 | true | -10 | No |

## Frontend Verification

1. Navigate to vehicle details page
2. Check mileage history table
3. Verify:
   - Valid records show green badges
   - Flagged records show red badges
   - Delta calculations are correct
   - Blockchain links work for valid records
   - "Not anchored" status for flagged records

