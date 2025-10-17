# cURL Examples for Installation Request API

## Authentication
First, obtain an authentication token:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Export the token for use in subsequent requests:
```bash
export TOKEN="your-jwt-token-here"
```

## Create Installation Request
```bash
curl -X POST http://localhost:3000/api/v1/installation-requests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ownerId": "owner-id-here",
    "vehicleId": "vehicle-id-here",
    "notes": "Please install device as soon as possible"
  }'
```

## Get Installation Requests
```bash
curl -X GET "http://localhost:3000/api/v1/installation-requests?status=requested&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

## Get Owner's Vehicles
```bash
curl -X GET "http://localhost:3000/api/v1/owners/owner-id-here/vehicles?q=ABC123" \
  -H "Authorization: Bearer $TOKEN"
```

## Search Vehicles
```bash
curl -X GET "http://localhost:3000/api/v1/vehicles/search?q=ABC123&ownerId=owner-id-here" \
  -H "Authorization: Bearer $TOKEN"
```

## Assign Installation Request (Admin only)
```bash
curl -X POST http://localhost:3000/api/v1/installation-requests/request-id-here/assign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device-id-here",
    "serviceProviderId": "service-provider-id-here",
    "assignedBy": "admin-id-here"
  }'
```

## Complete Installation Request (Service Provider/Admin)
```bash
curl -X POST http://localhost:3000/api/v1/installation-requests/request-id-here/complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "completedBy": "service-provider-id-here",
    "installationPhotoUrl": "https://example.com/photo.jpg",
    "notes": "Installation completed successfully"
  }'
```

## Get Raw Installation Request
```bash
curl -X GET http://localhost:3000/api/v1/installation-requests/request-id-here/raw \
  -H "Authorization: Bearer $TOKEN"
```