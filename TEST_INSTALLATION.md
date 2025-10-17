# Testing the Installation Flow

## Overview

This document describes how to test the new device installation workflow.

## Test Steps

### 1. Request Installation

As a vehicle owner:
1. Navigate to a vehicle details page
2. Click "Request Device Install"
3. Verify the installation request is created with status "requested"

### 2. Assign Installation

As an admin:
1. Navigate to "Install Requests" in the admin section
2. Select a pending installation request
3. Assign it to a service provider
4. Verify the status changes to "assigned"

### 3. Complete Installation

As a service provider:
1. Navigate to "Install Assignments"
2. Select an assigned installation
3. Enter device ID and complete installation
4. Verify the status changes to "completed"

## API Testing

You can also test the endpoints directly:

### Request Installation
```bash
curl -X POST http://localhost:3000/api/vehicles/{vehicleId}/request-install \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Please install device"}'
```

### Assign Installation
```bash
curl -X POST http://localhost:3000/api/admin/assign-install \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"installId": "{installId}", "serviceProviderId": "{spId}", "notes": "Assign to service provider"}'
```

### Complete Installation
```bash
curl -X POST http://localhost:3000/api/service/install/complete \
  -H "Authorization: Bearer {sp_token}" \
  -H "Content-Type: application/json" \
  -d '{"installId": "{installId}", "deviceId": "ESP32_001234", "notes": "Device installed successfully"}'
```

## Expected Results

1. Installation requests are created with proper status tracking
2. Admins can assign requests to service providers
3. Service providers can complete installations
4. Vehicle records are updated with device information
5. All operations are logged appropriately

## Troubleshooting

If you encounter issues:
1. Check user roles and permissions
2. Verify authentication tokens
3. Ensure required fields are provided
4. Check database connectivity