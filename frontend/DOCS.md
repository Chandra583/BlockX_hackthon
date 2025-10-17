# BlockX Dashboard Refactor Documentation

## Overview

This refactor transforms the existing BlockX dashboard into a full-featured vehicle management platform with enhanced navigation, trustScore system, device installation workflows, and real-time updates.

## New Features

### 1. Sidebar Navigation

The sidebar has been completely redesigned with a comprehensive navigation system:

- Dashboard Home
- Wallet Management
- Vehicle Management
- Device Installation
- History Tracking
- Marketplace
- Admin-specific sections (Install Requests, Users)
- Service Provider sections (Install Assignments)

### 2. TrustScore System

Vehicles now have a trustScore that indicates their reliability:

- **Green (90-100)**: Excellent trust score
- **Amber (70-89)**: Good trust score
- **Red (<70)**: Needs attention

TrustScore is displayed in:
- Vehicle list cards
- Vehicle details page
- Admin can manually update trustScore

### 3. Device Installation Workflow

New installation management system:

1. Owner requests device installation for their vehicle
2. Admin assigns request to a service provider
3. Service provider completes installation
4. Device is activated and begins sending telemetry

### 4. Real-time Updates

Socket.IO integration provides real-time updates for:
- Installation requests
- Device activations
- Telemetry ingestion
- TrustScore changes

### 5. History Tracking

Comprehensive telemetry history with:
- VIN filtering
- Date range selection
- Blockchain transaction links
- Arweave document references

## API Endpoints

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
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── NavItem.tsx
│   │   └── AppLayout.tsx
│   ├── dashboard/
│   │   ├── QuickActionsDropdown.tsx
│   │   └── ...
│   └── common/
│       └── SkeletonLoader.tsx
├── pages/
│   ├── DashboardHome.tsx
│   ├── Wallet/
│   │   ├── WalletCreate.tsx
│   │   └── WalletDetails.tsx
│   ├── Vehicles/
│   │   ├── VehicleList.tsx
│   │   └── VehicleDetails.tsx
│   ├── Devices/
│   │   └── DevicesList.tsx
│   ├── Admin/
│   │   └── AdminInstalls.tsx
│   ├── SP/
│   │   └── SPInstalls.tsx
│   └── History/
│       └── History.tsx
├── hooks/
│   ├── useSocket.js
│   └── useUI.ts
├── store/
│   └── uiSlice.ts
└── services/
    └── vehicle.ts (updated with new endpoints)
```

## Redux State Management

New UI slice manages:
- Sidebar open/closed state
- Active sidebar item
- Persistence in localStorage

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
2. Wallet creation and management pages
3. Advanced filtering and search capabilities
4. Export functionality for reports
5. Mobile-responsive design enhancements