# OBD Device ID Integration

## Overview
This implementation adds OBD device ID mapping to connect ESP32 telematics devices with active vehicle installations, enabling automatic mileage tracking and updates.

## Implementation Details

### 1. ESP32 Firmware Changes (`esp32Code/ESP32_EC200U_Backend_TCP/ESP32_EC200U_Backend_TCP.ino`)

**Added Configuration:**
- `deviceId` field in config struct (default: "OBD0000")
- Persistent storage via Preferences
- Configuration loading/saving functions

**Updated JSON Payload:**
```json
{
  "deviceID": "ESP32_VTS_001",
  "deviceId": "OBD3211",  // NEW: OBD Device ID for installation mapping
  "status": "obd_connected",
  "mileage": 250.5,
  "vin": "1HGCM82633A123411",
  // ... other fields
}
```

### 2. Backend Changes (`backend/src/controllers/device/device.controller.ts`)

**New Interface Field:**
```typescript
interface ESP32DeviceData {
  deviceID: string;
  deviceId?: string;  // NEW: OBD Device ID for installation mapping
  // ... other fields
}
```

**New Processing Method:**
- `processDeviceIdMapping()` - Maps deviceId to active installations
- Updates vehicle mileage automatically
- Validates VIN consistency
- Emits real-time socket events
- Updates telemetry records with installation info

**Key Features:**
- Finds active installations with matching `deviceId`
- Updates vehicle `currentMileage` and `lastMileageUpdate`
- Adds mileage record to `mileageHistory` with source "automated"
- Recalculates vehicle trust score
- Emits socket events for real-time updates

### 3. Frontend Changes (`frontend/src/pages/Vehicles/VehicleDetails.tsx`)

**Enhanced Mileage Display:**
- Shows current mileage in km (corrected from miles)
- Displays last update timestamp
- Enhanced lastMileageUpdate section with date and time

**Visual Improvements:**
- More detailed mileage update information
- Better formatting for timestamps
- Real-time update indicators

## Data Flow

1. **ESP32 Sends Data:**
   ```
   ESP32 → POST /api/device/status
   {
     "deviceId": "OBD3211",
     "mileage": 250.5,
     "vin": "1HGCM82633A123411",
     // ... other fields
   }
   ```

2. **Backend Processing:**
   - Receives ESP32 data
   - Finds active installation with matching `deviceId`
   - Updates vehicle mileage and history
   - Emits socket events

3. **Frontend Display:**
   - Shows updated mileage
   - Displays last update timestamp
   - Real-time updates via socket events

## Configuration

### ESP32 Configuration
```cpp
// Set deviceId before flashing or via serial command
char deviceId[32] = "OBD3211";  // Change this for each device

// Save to preferences
preferences.putString("deviceId", config.deviceId);
```

### Backend Requirements
- Active installation with matching `deviceId`
- Installation status: `in_progress` or `assigned`
- Valid vehicle record

## Testing

### Manual Testing
1. **Set up installation:**
   - Create installation request with `deviceId: "OBD3211"`
   - Set status to `in_progress`

2. **Send test data:**
   ```bash
   node backend/test-obd-device-integration.js
   ```

3. **Verify results:**
   - Check vehicle mileage updated
   - Check lastMileageUpdate timestamp
   - Check mileageHistory record added

### Expected Results
- Vehicle `currentMileage` updated to ESP32 reading
- `lastMileageUpdate` set to current timestamp
- New mileage record added to `mileageHistory`
- Trust score recalculated
- Socket event emitted for real-time updates

## Security Considerations

### Phase 1 (Current)
- Basic deviceId validation
- VIN consistency checks
- No authentication required for device endpoints

### Phase 2 (Future)
- Per-device JWT tokens
- Rate limiting per deviceId
- Signed payloads (HMAC)
- Device key rotation

## Error Handling

### Common Issues
1. **No matching installation:**
   - Logs warning, continues processing
   - Data stored but not linked to vehicle

2. **VIN mismatch:**
   - Logs warning, continues processing
   - Data still processed but flagged

3. **Database errors:**
   - Non-critical errors logged
   - ESP32 functionality continues

### Monitoring
- Check logs for deviceId mapping warnings
- Monitor vehicle mileage update frequency
- Track socket event emissions
- Monitor trust score changes

## Future Enhancements

1. **Device Management:**
   - Device registration endpoint
   - Device status dashboard
   - Remote configuration updates

2. **Advanced Analytics:**
   - Mileage trend analysis
   - Fraud detection algorithms
   - Predictive maintenance alerts

3. **Real-time Features:**
   - Live mileage updates
   - Push notifications
   - WebSocket connections

## Files Modified

### ESP32 Firmware
- `esp32Code/ESP32_EC200U_Backend_TCP/ESP32_EC200U_Backend_TCP.ino`

### Backend
- `backend/src/controllers/device/device.controller.ts`

### Frontend
- `frontend/src/pages/Vehicles/VehicleDetails.tsx`

### Testing
- `backend/test-obd-device-integration.js`
- `OBD_DEVICE_INTEGRATION.md`

## Next Steps

1. **Deploy and Test:**
   - Flash ESP32 with updated firmware
   - Set deviceId for each device
   - Test with real installations

2. **Monitor and Optimize:**
   - Monitor database performance
   - Optimize socket event handling
   - Fine-tune fraud detection

3. **Scale and Secure:**
   - Implement device authentication
   - Add rate limiting
   - Implement device key rotation

