# Mileage Validation Flow - Sequence Diagram

```mermaid
sequenceDiagram
    participant Device as ESP32 Device
    participant API as POST /api/device/status
    participant Vehicle as Vehicle Model
    participant Telemetry as Telemetry Model
    participant Solana as Solana Service
    participant Frontend as Frontend UI

    Device->>API: POST with mileage data
    Note over Device,API: { deviceID, status, vin, mileage, timestamp }
    
    API->>API: Extract reportedMileage from payload
    Note over API: Accept both 'mileage' and 'currentMileage' keys
    
    API->>Vehicle: Find vehicle by VIN
    Vehicle-->>API: Return vehicle with lastVerifiedMileage
    
    API->>API: Calculate delta = reportedMileage - vehicle.lastVerifiedMileage
    
    alt delta < -5 (Rollback Detected)
        API->>Telemetry: Save flagged record
        Note over Telemetry: flagged: true, validationStatus: 'ROLLBACK_DETECTED'
        API-->>Device: 422 Flagged Response
        Note over API,Device: { flagged: true, reason: 'rollback detected' }
    else delta >= -5 (Valid)
        API->>Vehicle: Atomic update lastVerifiedMileage
        Note over Vehicle: Race condition protection with findOneAndUpdate
        
        API->>Telemetry: Save valid record
        Note over Telemetry: flagged: false, validationStatus: 'VALID'
        
        API->>Solana: Anchor to blockchain
        Note over Solana: Payload with previousMileage, newMileage, delta
        
        API-->>Device: 200 Success Response
        Note over API,Device: { status: 'success', mileageValidation }
    end
    
    API->>Frontend: Emit socket event
    Note over Frontend: 'telemetry_accepted' or 'telemetry_flagged'
    
    Frontend->>Frontend: Update UI with validation status
    Note over Frontend: Show badges, deltas, blockchain links
```

## Key Validation Rules

1. **Rollback Detection**: Any decrease > 5km is flagged as fraud
2. **Atomic Updates**: Race condition protection with findOneAndUpdate
3. **Authoritative Source**: Always use vehicle.lastVerifiedMileage, never trust device
4. **Backwards Compatibility**: Accept both 'mileage' and 'currentMileage' keys
5. **Blockchain Anchoring**: Only valid records are anchored, flagged records are not

## Error Handling

- **422 Flagged**: Rollback detected, record saved but not anchored
- **500 Error**: System error, record not saved
- **400 Bad Request**: Missing required fields

## Frontend Integration

- **Valid Records**: Green badge, positive delta, blockchain link
- **Flagged Records**: Red badge, negative delta, "Not anchored" status
- **Suspicious Records**: Yellow badge, large delta, review required

