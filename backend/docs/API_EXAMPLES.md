# API Examples for Service Provider Install Lifecycle

## Start Installation

### Request
```bash
curl -X POST http://localhost:3000/api/service/install/start \
  -H "Authorization: Bearer YOUR_SERVICE_PROVIDER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "installId": "60f1b2b3c4d5e6f7a8b9c0d1",
    "deviceId": "ESP32_001234",
    "initialMileage": 15500
  }'
```

### Success Response
```json
{
  "success": true,
  "message": "Installation started successfully",
  "data": {
    "installId": "60f1b2b3c4d5e6f7a8b9c0d1",
    "status": "in_progress",
    "deviceId": "ESP32_001234",
    "initialMileage": 15500,
    "startedAt": "2023-07-15T10:30:00.000Z",
    "solanaTx": "5a2d7a3f4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e",
    "arweaveTx": "z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4",
    "arweaveUrl": "https://arweave.net/z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4",
    "solanaUrl": "https://explorer.solana.com/tx/5a2d7a3f4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e"
  }
}
```

### Flagged Response
```json
{
  "success": false,
  "flagged": true,
  "message": "Initial mileage is less than last verified mileage. Installation flagged for review.",
  "data": {
    "initialMileage": 14000,
    "lastVerifiedMileage": 15000
  }
}
```

## Complete Installation

### Request
```bash
curl -X POST http://localhost:3000/api/service/install/complete \
  -H "Authorization: Bearer YOUR_SERVICE_PROVIDER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "installId": "60f1b2b3c4d5e6f7a8b9c0d1",
    "finalNotes": "Installation completed successfully. Device is transmitting data."
  }'
```

### Response
```json
{
  "success": true,
  "message": "Installation completed successfully",
  "data": {
    "installId": "60f1b2b3c4d5e6f7a8b9c0d1",
    "status": "completed",
    "completedAt": "2023-07-15T14:45:00.000Z"
  }
}
```

## Assign Installation (Admin Only)

### Request
```bash
curl -X POST http://localhost:3000/api/admin/assign-install \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "installId": "60f1b2b3c4d5e6f7a8b9c0d1",
    "serviceProviderId": "60f1b2b3c4d5e6f7a8b9c0d2"
  }'
```

### Response
```json
{
  "success": true,
  "message": "Installation assigned successfully",
  "data": {
    "installId": "60f1b2b3c4d5e6f7a8b9c0d1",
    "status": "assigned",
    "assignedAt": "2023-07-15T09:15:00.000Z",
    "serviceProviderId": "60f1b2b3c4d5e6f7a8b9c0d2"
  }
}
```