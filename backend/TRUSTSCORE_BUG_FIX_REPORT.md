# TrustScore Cumulative Calculation Bug Fix Report

## Summary
Fixed the TrustScore cumulative calculation bug where multiple sequential events (e.g., -30 then -30) were not being applied correctly, resulting in incorrect final scores instead of proper cumulative changes (100 → 70 → 40).

## Root Cause Analysis
The bug was caused by **non-atomic TrustScore updates** in the device controller where:
1. TrustScore was read from the vehicle document
2. A new TrustEvent was created and saved
3. The vehicle's TrustScore was updated separately
4. This created a race condition where concurrent events could read the same base score

## Files Modified

### 1. New TrustScore Service (`backend/src/services/core/trustScore.service.ts`)
**Purpose**: Single source of truth for atomic TrustScore updates
**Key Features**:
- MongoDB transactions for atomicity
- Retry logic with exponential backoff
- Out-of-order event detection and rejection
- Proper concurrency handling
- Score clamping (0-100)

**Key Methods**:
- `updateTrustScore()`: Atomic update with transaction
- `getCurrentTrustScore()`: Get current score and metadata
- `getTrustScoreHistory()`: Get chronological history
- `recomputeTrustScore()`: Recompute from scratch for verification
- `seedTrustScore()`: Initialize score for testing

### 2. Updated Device Controller (`backend/src/controllers/device/device.controller.ts`)
**Changes**:
- Replaced direct TrustScore manipulation with atomic service calls
- Added proper error handling and logging
- Integrated socket event emission through service

**Before**:
```typescript
// Race condition prone
const trustEvent = new TrustEvent({...});
await trustEvent.save();
vehicle.trustScore = Math.max(0, vehicle.trustScore - 30);
await vehicle.save();
```

**After**:
```typescript
// Atomic operation
const trustResult = await TrustScoreService.updateTrustScore({
  vehicleId: vehicle._id.toString(),
  change: -30,
  reason: `Mileage rollback detected: ${reportedMileage} km vs ${previousMileage} km`,
  source: 'fraudEngine',
  // ... other params
});
```

### 3. Updated Trust Controller (`backend/src/controllers/trust/trust.controller.ts`)
**Changes**:
- Replaced manual TrustScore updates with atomic service calls
- Added new endpoints for getting vehicle TrustScore and seeding
- Improved error handling and response formatting

**New Endpoints**:
- `GET /api/trust/:vehicleId/score` - Get current TrustScore
- `POST /api/trust/:vehicleId/seed` - Seed initial score (admin only)

### 4. New Telemetry Event Controller (`backend/src/controllers/telemetry/telemetryEvent.controller.ts`)
**Purpose**: Dedicated endpoint for processing TrustScore-affecting events
**Endpoint**: `POST /api/telemetry/event`
**Features**:
- Event type mapping to reasons
- Atomic TrustScore updates
- Socket event emission
- Comprehensive error handling

### 5. Updated Routes (`backend/src/routes/trust/trust.routes.ts`, `backend/src/routes/telemetry/telemetry.routes.ts`)
**Added Routes**:
- `GET /api/trust/:vehicleId/score`
- `POST /api/trust/:vehicleId/seed`
- `POST /api/telemetry/event`

### 6. Updated Vehicle Model (`backend/src/models/core/Vehicle.model.ts`)
**Added Field**: `lastTrustScoreUpdate?: Date` for tracking when TrustScore was last updated

## API Contract Changes

### New Endpoints

#### 1. Get Vehicle TrustScore
```http
GET /api/trust/:vehicleId/score
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "vehicleId": "68fd05d50c462a28534d4544",
    "trustScore": 40,
    "lastUpdated": "2025-10-25T11:45:17Z",
    "previousScore": 70
  }
}
```

#### 2. Seed TrustScore (Admin Only)
```http
POST /api/trust/:vehicleId/seed
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "score": 100
}
```

#### 3. Process Telemetry Event
```http
POST /api/telemetry/event
Authorization: Bearer <token>
Content-Type: application/json

{
  "vehicleId": "68fd05d50c462a28534d4544",
  "type": "MILEAGE_ROLLBACK",
  "deltaScore": -30,
  "recordedAt": "2025-10-25T11:45:15Z",
  "source": "fraud-detect",
  "meta": {
    "prevMileage": 65185,
    "newMileage": 50000
  }
}
```

### Enhanced TrustEvent Model
**Added Fields**:
- `previousScore`: Score before the change
- `newScore`: Score after the change
- `eventTimestamp`: When the event occurred (for ordering)

## Verification Steps

### 1. Manual Testing with cURL

#### Step 1: Seed Initial Score
```bash
curl -X POST "http://localhost:3000/api/trust/68fd05d50c462a28534d4544/seed" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"score":100}'
```

#### Step 2: Apply First Rollback Event
```bash
curl -X POST "http://localhost:3000/api/telemetry/event" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "vehicleId":"68fd05d50c462a28534d4544",
    "type":"MILEAGE_ROLLBACK",
    "deltaScore": -30,
    "recordedAt":"2025-10-25T11:45:15Z",
    "source":"fraud-detect",
    "meta": {"prevMileage":65185,"newMileage":50000}
  }'
```

#### Step 3: Apply Second Rollback Event
```bash
curl -X POST "http://localhost:3000/api/telemetry/event" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "vehicleId":"68fd05d50c462a28534d4544",
    "type":"MILEAGE_ROLLBACK",
    "deltaScore": -30,
    "recordedAt":"2025-10-25T11:45:17Z",
    "source":"fraud-detect",
    "meta": {"prevMileage":65185,"newMileage":45000}
  }'
```

#### Step 4: Verify Final Score
```bash
curl -X GET "http://localhost:3000/api/trust/68fd05d50c462a28534d4544/score" \
  -H "Authorization: Bearer <token>"
```

**Expected Result**: `{"trustScore": 40}`

### 2. Automated Testing Scripts

#### Bash Script (`backend/scripts/verify-trustscore-fix.sh`)
- Comprehensive test suite
- Concurrent event testing
- Expected result validation

#### PowerShell Script (`backend/scripts/verify-trustscore-fix.ps1`)
- Windows-compatible version
- Same test coverage as bash script

### 3. Unit Tests (`backend/src/tests/trustScore.service.test.ts`)
**Test Coverage**:
- Single delta application
- Cumulative delta application
- Score clamping (0-100)
- Concurrent update handling
- Out-of-order event rejection
- Non-existent vehicle handling
- History retrieval
- Score recomputation

### 4. Integration Tests (`backend/src/tests/trustScore.integration.test.ts`)
**Test Coverage**:
- Full API endpoint testing
- Authentication and authorization
- Error handling
- Concurrent event processing
- History verification

## Database Schema Changes

### Vehicle Collection
**Added Field**:
```typescript
lastTrustScoreUpdate?: Date
```

### TrustEvent Collection
**Enhanced Fields**:
- `previousScore`: Required field for audit trail
- `newScore`: Required field for audit trail
- `eventTimestamp`: Optional field for event ordering

## Performance Considerations

### 1. Atomic Updates
- Uses MongoDB transactions for consistency
- Prevents race conditions
- Ensures data integrity

### 2. Retry Logic
- Exponential backoff for failed transactions
- Maximum 3 retry attempts
- Prevents indefinite blocking

### 3. Indexing
- Existing indexes on `vehicleId` and `createdAt` are sufficient
- No additional indexes required

## Security Considerations

### 1. Authentication
- All endpoints require valid JWT tokens
- Admin-only endpoints for seeding and manual adjustments

### 2. Authorization
- Vehicle owners can only access their own vehicles
- Admins have full access
- Proper role-based access control

### 3. Input Validation
- Score clamping prevents invalid values
- Event timestamp validation prevents manipulation
- Required field validation

## Monitoring and Logging

### 1. Debug Logging
```typescript
logger.info(`🔄 TrustScore update initiated: vehicle=${vehicleId}, change=${change}, reason=${reason}`);
logger.info(`✅ TrustScore updated: vehicle=${vehicleId}, prev=${previousScore}, delta=${change}, new=${newScore}, reason=${reason}`);
logger.warn(`⚠️ Out-of-order event detected: vehicle=${vehicleId}, eventTime=${eventTimestamp}, latestTime=${latestEvent.createdAt}`);
```

### 2. Error Logging
- Failed transaction attempts
- Out-of-order event detection
- Non-existent vehicle access

## Migration Notes

### 1. Database Migration
No migration required - new fields are optional and have defaults.

### 2. API Compatibility
- Existing endpoints remain unchanged
- New endpoints are additive
- No breaking changes

### 3. Frontend Updates
- Frontend should use new `/api/trust/:vehicleId/score` endpoint
- Socket events remain the same format
- No frontend changes required for basic functionality

## Testing Results

### Expected Behavior
1. **Initial Score**: 100
2. **After First Rollback**: 70 (100 - 30)
3. **After Second Rollback**: 40 (70 - 30)
4. **After Concurrent Events**: 25 (40 - 10 - 5)

### Verification Checklist
- [x] Unit tests pass
- [x] Integration tests pass
- [x] Manual API testing successful
- [x] Concurrent event handling verified
- [x] Out-of-order event rejection working
- [x] Score clamping functional
- [x] Database consistency maintained
- [x] Socket events emitted correctly

## Conclusion

The TrustScore cumulative calculation bug has been completely resolved through:

1. **Atomic Operations**: MongoDB transactions ensure consistency
2. **Single Source of Truth**: TrustScoreService centralizes all updates
3. **Race Condition Prevention**: Proper locking and retry logic
4. **Audit Trail**: Complete history with previousScore/newScore tracking
5. **Comprehensive Testing**: Unit, integration, and manual tests

The fix ensures that TrustScore changes are applied cumulatively and correctly, maintaining data integrity and providing a reliable audit trail for all trust-related events.
