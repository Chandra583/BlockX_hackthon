# Telemetry Batch Anchoring System

## Overview

The telemetry batch anchoring system automatically consolidates daily vehicle telemetry data and anchors it to both Arweave (for permanent storage) and Solana (for blockchain verification). This ensures data integrity and provides immutable records of vehicle usage.

## Architecture

```
Device → ESP32 → POST /api/device/status → TelemetryConsolidationService → Arweave + Solana
```

## Key Components

### 1. Merkle Tree Builder (`src/utils/merkle.ts`)
- Builds deterministic Merkle trees from telemetry segments
- Provides proof generation and verification
- Ensures data integrity through cryptographic hashing

### 2. Telemetry Consolidation Service (`src/services/telemetryConsolidation.service.ts`)
- Consolidates daily telemetry data into batches
- Builds Merkle trees for data integrity
- Uploads to Arweave for permanent storage
- Anchors Merkle root to Solana blockchain

### 3. Daily Job Scheduler (`src/jobs/dailyMerkleJob.ts`)
- Runs nightly at 2 AM UTC to process previous day's data
- Processes all vehicles with telemetry data
- Provides manual triggering capabilities

### 4. Enhanced Device Controller
- Triggers immediate consolidation for end-of-day trips
- Detects last trip of the day (after 10 PM or before 6 AM)
- Asynchronous processing to avoid blocking device responses

## Data Flow

1. **Device Ingestion**: ESP32 sends telemetry data via `POST /api/device/status`
2. **Immediate Trigger**: If end-of-day detected, trigger consolidation immediately
3. **Daily Consolidation**: Nightly job processes all pending batches
4. **Merkle Tree**: Build deterministic tree from telemetry segments
5. **Arweave Upload**: Store full batch data permanently
6. **Solana Anchoring**: Anchor Merkle root to blockchain
7. **Database Update**: Store transaction hashes in `telemetry_batches` collection

## Database Schema

### TelemetryBatch Model
```typescript
{
  vehicleId: ObjectId,
  deviceId: string,
  date: string, // YYYY-MM-DD
  segments: [{
    startTime: Date,
    endTime: Date,
    distance: number,
    rawDataCID?: string
  }],
  totalDistance: number,
  segmentsCount: number,
  merkleRoot: string,
  arweaveTx: string,
  solanaTx: string,
  status: 'pending' | 'consolidating' | 'anchored' | 'error',
  lastError?: string
}
```

## Environment Variables

### Backend (.env)
```bash
# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_CLUSTER=devnet
SOLANA_KEYPAIR_PATH=./keys/solana-keypair.json

# Arweave Configuration
ARWEAVE_GATEWAY=https://arweave.net
ARWEAVE_TESTNET_GATEWAY=https://testnet.redstone.tools
ARWEAVE_KEY={"kty":"RSA",...}
```

### Frontend (.env)
```bash
VITE_SOLANA_CLUSTER=devnet
VITE_ARWEAVE_GATEWAY=https://arweave.net
```

## API Endpoints

### Get Telemetry Batches
```
GET /api/vehicles/:vehicleId/telemetry-batches?limit=30
```

### Manual Consolidation
```
POST /api/vehicles/:vehicleId/consolidate-batch
{
  "date": "2025-01-15"
}
```

## Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### Manual Testing
1. Send telemetry data via ESP32 simulator
2. Check immediate consolidation triggers
3. Verify nightly job execution
4. Confirm transaction hashes in database

## Monitoring

### Logs
- Consolidation attempts and results
- Blockchain transaction confirmations
- Error handling and retries

### Metrics
- Daily batch processing counts
- Success/failure rates
- Blockchain transaction costs

## Error Handling

### Retry Logic
- Exponential backoff for blockchain failures
- Maximum 3 retry attempts
- Error status tracking in database

### Fallback Mechanisms
- Continue processing other batches on individual failures
- Manual consolidation endpoint for recovery
- Admin dashboard for monitoring

## Security Considerations

### Private Keys
- Never log private keys
- Use environment variables for key storage
- Secure key file permissions

### Data Validation
- Merkle tree verification before anchoring
- Fraud detection in telemetry data
- Tampering detection algorithms

## Performance

### Optimization
- Batch processing for multiple vehicles
- Asynchronous blockchain operations
- Database indexing for fast queries

### Scaling
- Horizontal scaling of consolidation workers
- Queue-based processing for high volume
- Caching for frequently accessed data

## Troubleshooting

### Common Issues
1. **Blockchain failures**: Check RPC endpoints and network connectivity
2. **Arweave uploads**: Verify wallet funding and gateway availability
3. **Database errors**: Check MongoDB connection and indexes
4. **Job scheduling**: Confirm cron job configuration

### Debug Commands
```bash
# Check job status
curl http://localhost:3000/api/admin/batch-processing/status

# Manual consolidation
curl -X POST http://localhost:3000/api/vehicles/{vehicleId}/consolidate-batch \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-01-15"}'
```

## Future Enhancements

### Planned Features
- Multi-chain anchoring (Ethereum, Polygon)
- Real-time WebSocket updates
- Advanced fraud detection
- Data compression for Arweave
- Batch verification APIs

### Performance Improvements
- Parallel processing of multiple vehicles
- Caching layer for blockchain data
- Optimized Merkle tree algorithms
- Database sharding for scale
