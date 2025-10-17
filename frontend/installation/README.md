# Device Installation Request Frontend

This document describes the frontend implementation for the device installation request flow.

## Components

### NewInstallationRequestModal

A multi-step modal component for creating new installation requests:

1. **Owner Selection** - Select the vehicle owner (default: current user)
2. **Vehicle Selection** - Search and select a vehicle from the owner's vehicles
3. **Device Details** - Enter device ID or scan QR code (optional)
4. **Notes** - Add any additional notes for the installation

### DevicesList

Updated device installations page with:
- "New Request" button that opens the modal
- Existing device request listing functionality

## Services

### InstallationService

API service wrapper for all installation request endpoints:

- `createInstallationRequest()` - Create new installation request
- `getInstallationRequests()` - Get filtered list of requests
- `getOwnerVehicles()` - Get owner's vehicles for selection
- `searchVehicles()` - Search vehicles globally or by owner
- `assignInstallationRequest()` - Assign device to request
- `completeInstallationRequest()` - Complete installation
- `getRawInstallationRequest()` - Get raw request data for debugging

## Integration

The new flow integrates with existing components while maintaining backward compatibility:

1. Existing device request listing is preserved
2. New requests are created through the modal flow
3. All existing API endpoints remain unchanged
4. New v1 API endpoints are mounted at `/api/v1/installation-requests`

## Usage

To use the new installation request flow:

1. Navigate to the Devices page
2. Click "New Request" button
3. Follow the 4-step modal flow:
   - Select owner (defaults to current user)
   - Search and select vehicle
   - Enter device details (optional)
   - Add notes and submit

## Styling

The component uses the existing Tailwind CSS classes and follows the project's design system:
- Primary color: `primary-600`
- Consistent spacing and typography
- Responsive design for all screen sizes
- Accessible form elements and buttons

## Testing

To test the new flow:

1. Open the Devices page
2. Click "New Request"
3. Verify the 4-step modal appears
4. Test owner selection (mocked in this implementation)
5. Test vehicle search functionality
6. Test form validation
7. Verify successful submission

## Future Improvements

1. Implement real owner search API integration
2. Add device QR code scanning functionality
3. Add real-time updates using WebSocket
4. Implement more comprehensive validation
5. Add unit tests for the components