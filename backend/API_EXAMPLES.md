# API Examples for Mileage Validation

## Valid Mileage Update (200 OK)

### Request
```bash
curl -X POST http://localhost:3000/api/device/status \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "OBD3001",
    "status": "obd_connected",
    "vin": "1HGCM82633A123465",
    "mileage": 67100,
    "timestamp": 1735128000000,
    "dataSource": "veepeak_obd",
    "rpm": 2500,
    "speed": 70,
    "engineTemp": 88,
    "fuelLevel": 55,
    "dataQuality": 99
  }'
```

### Response
```json
{
  "status": "success",
  "message": "Device status received and processed",
  "data": {
    "deviceID": "OBD3001",
    "status": "obd_connected",
    "mileageValidation": {
      "reportedMileage": 67100,
      "previousMileage": 67000,
      "newMileage": 67100,
      "delta": 100,
      "flagged": false,
      "validationStatus": "VALID",
      "reason": null
    },
    "vehicleId": "68fb66b4917441cf5f7ae5f1",
    "telemetryId": "68fb66b4917441cf5f7ae5f2",
    "testId": "68fb66b4917441cf5f7ae5f3",
    "processingTime": 45
  },
  "timestamp": "2025-10-24T20:15:34.000Z"
}
```

## Flagged Rollback (422 Unprocessable Entity)

### Request
```bash
curl -X POST http://localhost:3000/api/device/status \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "OBD3001",
    "status": "obd_connected",
    "vin": "1HGCM82633A123465",
    "mileage": 82,
    "timestamp": 1735128000000,
    "dataSource": "veepeak_obd"
  }'
```

### Response
```json
{
  "status": "flagged",
  "message": "Mileage rollback detected",
  "flagged": true,
  "reason": "Odometer rollback detected: 65918 km decrease",
  "previousMileage": 67000,
  "reportedMileage": 82,
  "delta": -65918,
  "vehicleId": "68fb66b4917441cf5f7ae5f1",
  "timestamp": "2025-10-24T20:15:34.000Z"
}
```

## Backwards Compatibility Examples

### Using currentMileage (old key)
```bash
curl -X POST http://localhost:3000/api/device/status \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "OBD3001",
    "status": "obd_connected",
    "vin": "1HGCM82633A123465",
    "currentMileage": 67150,
    "timestamp": 1735128000000,
    "dataSource": "veepeak_obd"
  }'
```

### Using newMileage (new key)
```bash
curl -X POST http://localhost:3000/api/device/status \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "OBD3001",
    "status": "obd_connected",
    "vin": "1HGCM82633A123465",
    "newMileage": 67200,
    "timestamp": 1735128000000,
    "dataSource": "veepeak_obd"
  }'
```

## Test Scenarios

### 1. Valid Increase
```bash
# Vehicle at 67000 km, report 67100 km
curl -X POST http://localhost:3000/api/device/status \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "OBD3001",
    "status": "obd_connected",
    "vin": "1HGCM82633A123465",
    "mileage": 67100,
    "timestamp": 1735128000000,
    "dataSource": "veepeak_obd"
  }'
# Expected: 200 OK, delta = +100
```

### 2. Rollback Detection
```bash
# Vehicle at 67000 km, report 82 km
curl -X POST http://localhost:3000/api/device/status \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "OBD3001",
    "status": "obd_connected",
    "vin": "1HGCM82633A123465",
    "mileage": 82,
    "timestamp": 1735128000000,
    "dataSource": "veepeak_obd"
  }'
# Expected: 422 Flagged, delta = -65918
```

### 3. Small Rollback (within tolerance)
```bash
# Vehicle at 67000 km, report 66997 km (3 km decrease)
curl -X POST http://localhost:3000/api/device/status \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "OBD3001",
    "status": "obd_connected",
    "vin": "1HGCM82633A123465",
    "mileage": 66997,
    "timestamp": 1735128000000,
    "dataSource": "veepeak_obd"
  }'
# Expected: 200 OK (within 5km tolerance)
```

### 4. Large Rollback (fraud)
```bash
# Vehicle at 67000 km, report 66990 km (10 km decrease)
curl -X POST http://localhost:3000/api/device/status \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "OBD3001",
    "status": "obd_connected",
    "vin": "1HGCM82633A123465",
    "mileage": 66990,
    "timestamp": 1735128000000,
    "dataSource": "veepeak_obd"
  }'
# Expected: 422 Flagged, delta = -10
```

## On-Chain Payload Example

When a valid mileage update is anchored to Solana, the payload will be:

```json
{
  "eventType": "UPDATE_MILEAGE",
  "network": "devnet",
  "vehicleId": "41cf5f7ae5f1",
  "vin": "82633A123465",
  "previousMileage": 67000,
  "newMileage": 67100,
  "delta": 100,
  "deviceId": "OBD",
  "timestamp": "2025-10-24T20:15:34.000Z",
  "recordedBy": "automated",
  "notes": "Mileage update: 67000 -> 67100 km (+100 km)",
  "fraudCheck": "PASS"
}
```

## Frontend Integration

The frontend should display:

1. **Valid Records**: Green badge, positive delta with green arrow
2. **Flagged Records**: Red badge, negative delta with red arrow, "Not anchored" status
3. **Suspicious Records**: Yellow badge, large delta, requires review

### Example UI States

```typescript
// Valid record
{
  mileage: 67100,
  delta: 100,
  validationStatus: 'VALID',
  flagged: false,
  blockchainHash: 'abc123...'
}

// Flagged record
{
  mileage: 82,
  delta: -65918,
  validationStatus: 'ROLLBACK_DETECTED',
  flagged: true,
  blockchainHash: null // Not anchored
}
```

