# Device Installation Request API

This document describes the new Device Installation Request API endpoints implemented for the owner installation flow.

## API Endpoints

All endpoints are prefixed with `/api/v1/installation-requests`.

### Create Installation Request
```
POST /api/v1/installation-requests
```

**Request Body:**
```json
{
  "ownerId": "string",
  "vehicleId": "string",
  "notes": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Installation request created successfully",
  "data": {
    "id": "string",
    "status": "requested",
    "createdAt": "date"
  }
}
```

### Get Installation Requests
```
GET /api/v1/installation-requests
```

**Query Parameters:**
- `ownerId` (optional) - Filter by owner ID
- `status` (optional) - Filter by status
- `q` (optional) - Search term
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Results per page

**Response:**
```json
{
  "success": true,
  "message": "Installation requests retrieved successfully",
  "data": {
    "requests": [
      {
        "id": "string",
        "vehicleId": "string",
        "ownerId": "string",
        "serviceProviderId": "string",
        "deviceId": "string",
        "status": "requested|assigned|completed|cancelled",
        "notes": "string",
        "createdAt": "date",
        "updatedAt": "date",
        "installedAt": "date",
        "vehicle": {
          "id": "string",
          "vin": "string",
          "registration": "string",
          "make": "string",
          "model": "string",
          "year": "number"
        }
      }
    ],
    "total": "number",
    "page": "number",
    "limit": "number",
    "totalPages": "number"
  }
}
```

### Get Owner's Vehicles
```
GET /api/v1/owners/:ownerId/vehicles
```

**Query Parameters:**
- `q` (optional) - Search term (registration or VIN)
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Results per page

**Response:**
```json
{
  "success": true,
  "message": "Vehicles retrieved successfully",
  "data": {
    "vehicles": [
      {
        "id": "string",
        "registration": "string",
        "vin": "string",
        "make": "string",
        "model": "string",
        "year": "number"
      }
    ],
    "total": "number",
    "page": "number",
    "limit": "number",
    "totalPages": "number"
  }
}
```

### Search Vehicles
```
GET /api/v1/vehicles/search
```

**Query Parameters:**
- `q` (optional) - Search term (registration or VIN)
- `ownerId` (optional) - Restrict results to specific owner

**Response:**
```json
{
  "success": true,
  "message": "Vehicles retrieved successfully",
  "data": {
    "vehicles": [
      {
        "id": "string",
        "registration": "string",
        "vin": "string",
        "make": "string",
        "model": "string",
        "year": "number",
        "ownerId": "string"
      }
    ]
  }
}
```

### Assign Installation Request
```
POST /api/v1/installation-requests/:id/assign
```

**Request Body:**
```json
{
  "deviceId": "string",
  "serviceProviderId": "string",
  "assignedBy": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Installation assigned successfully",
  "data": {
    "id": "string",
    "status": "assigned",
    "deviceId": "string",
    "serviceProviderId": "string"
  }
}
```

### Complete Installation Request
```
POST /api/v1/installation-requests/:id/complete
```

**Request Body:**
```json
{
  "completedBy": "string",
  "installationPhotoUrl": "string (optional)",
  "notes": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Installation completed successfully",
  "data": {
    "id": "string",
    "status": "completed",
    "installedAt": "date"
  }
}
```

### Get Raw Installation Request
```
GET /api/v1/installation-requests/:id/raw
```

**Response:**
```json
{
  "success": true,
  "message": "Installation request retrieved successfully",
  "data": {
    // Full database record
  }
}
```

## Database Schema

### InstallationRequest Model

```typescript
interface IInstallationRequest {
  ownerId: ObjectId; // Reference to User
  vehicleId: ObjectId; // Reference to Vehicle
  requestedBy: ObjectId; // Reference to User
  deviceId?: ObjectId | string; // Reference to Device
  serviceProviderId?: ObjectId; // Reference to User (service provider)
  status: 'requested' | 'assigned' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  installedAt?: Date;
  history: Array<{
    action: string;
    by: ObjectId; // Reference to User
    at: Date;
    meta?: any;
  }>;
}
```

## Migration

To migrate existing installation requests to the new schema:

1. Run the migration script:
```bash
npm run migrate-installation-requests
```

2. The script will:
   - Copy existing installation records to the new schema
   - Map fields appropriately
   - Add history entries for prior actions

## Security

- All endpoints require authentication
- Role-based access control:
  - Owners can view their own requests
  - Admins have full access
  - Service providers can complete assigned requests
- Rate limiting on search endpoints
- Input validation and sanitization