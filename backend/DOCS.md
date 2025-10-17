# BlockX Backend Refactor Documentation

## Overview

This refactor enhances the BlockX backend with new features for device installation management, trustScore system, and real-time updates.

## New Features

### 1. Installation Model

New `Install` model tracks device installation requests:

- Vehicle association
- Owner information
- Service provider assignment
- Status tracking (requested, assigned, in_progress, completed, cancelled)
- Timestamps for each stage

### 2. TrustScore System

Vehicles now include a trustScore field (default 100) that can be updated by admins. The trustScore decreases when fraud alerts are added to the vehicle.

### 3. Real-time Event Hooks

Placeholder functions for emitting real-time events when key actions occur.

### 4. Metrics Middleware

Request/response logging middleware for performance monitoring.

## New API Endpoints

### Vehicle Endpoints
- `PATCH /api/vehicles/:vehicleId/trustscore` - Update vehicle trustScore (admin only)

### Installation Endpoints
- `POST /api/vehicles/:vehicleId/request-install` - Request device installation
- `POST /api/admin/assign-install` - Assign installation to service provider
- `POST /api/service/install/complete` - Complete installation
- `GET /api/devices` - List installation requests

## File Structure

```
src/
├── models/
│   └── Install.model.ts
├── routes/
│   └── installs.routes.ts
├── middleware/
│   └── metrics.middleware.ts
├── utils/
│   └── eventHooks.ts
└── routes/
    └── vehicle/
        └── vehicle.routes.ts (updated with trustScore endpoint)
```

## Database Indexes

New indexes added for performance:
- Install model indexes on vehicleId, ownerId, serviceProviderId, status, requestedAt
- Vehicle model already includes trustScore index

## Testing

Unit tests included for:
- TrustScore calculations
- Installation flow
- Vehicle model updates

## Migration

Run the migration script to backfill trustScore for existing vehicles:

```bash
node scripts/migrate-add-trustscore.js
```

## Future Enhancements

1. Full Socket.IO integration for real-time updates
2. Advanced filtering and search capabilities
3. Export functionality for reports
4. Enhanced security measures
5. Performance optimizations