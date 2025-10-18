# Service Provider Install Lifecycle and Anchoring Flow

## Overview

This document describes the implementation of the Service Provider install lifecycle and anchoring flow for BlockX. The system ensures that all device installations are properly tracked, validated, and anchored to both Arweave and Solana blockchains for immutable verification.

## Architecture Decision: Platform-Custodial Anchoring

For the MVP implementation, we use **platform-custodial anchoring** where the server-side platform signs and sends blockchain transactions using its own keypair. This approach was chosen for the following reasons:

1. **Simplicity**: Service providers don't need to manage their own wallets or SOL tokens
2. **User Experience**: Eliminates wallet connection friction for service providers
3. **Security**: Centralized key management with proper security controls
4. **Compliance**: Easier to maintain audit trails and regulatory compliance

### Future Considerations

For future releases, we may implement:
- Service provider custodial anchoring (self-signing)
- Multi-signature anchoring for high-value transactions
- Gasless meta-transactions using relayers

## API Endpoints

### Start Installation
```
POST /api/service/install/start
```

**Request Body:**
```json
{
  "installId": "string",
  "deviceId": "string",
  "initialMileage": "number"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Installation started successfully",
  "data": {
    "installId": "string",
    "status": "in_progress",
    "deviceId": "string",
    "initialMileage": "number",
    "startedAt": "ISO8601 timestamp",
    "solanaTx": "string",
    "arweaveTx": "string",
    "arweaveUrl": "string",
    "solanaUrl": "string"
  }
}
```

**Validation Logic:**
1. Verify installation exists and is assigned to caller
2. Verify installation status is 'assigned'
3. Validate `initialMileage >= vehicle.lastVerifiedMileage`
   - If true: Set status to 'in_progress', create telemetry batch, anchor to blockchain
   - If false: Set status to 'flagged', emit `install_flagged` socket event

### Complete Installation
```
POST /api/service/install/complete
```

**Request Body:**
```json
{
  "installId": "string",
  "finalNotes": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Installation completed successfully",
  "data": {
    "installId": "string",
    "status": "completed",
    "completedAt": "ISO8601 timestamp"
  }
}
```

### Assign Installation (Admin Only)
```
POST /api/admin/assign-install
```

**Request Body:**
```json
{
  "installId": "string",
  "serviceProviderId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Installation assigned successfully",
  "data": {
    "installId": "string",
    "status": "assigned",
    "assignedAt": "ISO8601 timestamp",
    "serviceProviderId": "string"
  }
}
```

## Anchoring Process

### 1. Arweave Upload

When an installation starts successfully, the system:
1. Creates a JSON payload with installation details
2. Uploads the payload to Arweave
3. Stores the Arweave transaction ID on the install record

**Payload Structure:**
```json
{
  "installId": "string",
  "vehicleId": "string",
  "vin": "string",
  "ownerId": "string",
  "serviceProviderId": "string",
  "deviceId": "string",
  "initialMileage": "number",
  "timestamp": "ISO8601 timestamp",
  "eventType": "INSTALL_START"
}
```

### 2. Solana Anchor

After Arweave upload:
1. Creates a deterministic SHA256 hash of the payload
2. Signs and sends a memo transaction to Solana with the hash
3. Stores the Solana transaction ID on the install record

### 3. Idempotency

The anchoring process is idempotent:
- If `install.solanaTx` already exists, return existing transaction info
- Prevents duplicate anchoring of the same installation event

## Real-time Updates

The system emits the following socket events:

- `install_started`: When installation starts successfully
- `install_flagged`: When installation is flagged due to mileage validation failure
- `install_completed`: When installation is completed

## Database Schema Updates

### Install Model
Added fields:
- `startedAt`: Date
- `initialMileage`: Number
- `solanaTx`: String
- `arweaveTx`: String
- `history`: Array of action logs

### Vehicle Model
Added field:
- `lastVerifiedMileage`: Number (default: 0)

## Migration

The migration script `scripts/migrate-add-install-model.js` handles:
1. Adding missing fields to existing Install documents
2. Setting default values for new fields
3. Ensuring all vehicles have `lastVerifiedMileage` field
4. Creating necessary database indexes

## Testing

Unit tests are provided for:
- Install start functionality (success and flagged paths)
- Install assignment functionality

Run tests with:
```bash
npm run test
```

## Frontend Integration

The frontend implements:
- SPInstalls page showing assigned installations
- InstallStartModal for entering device ID and initial mileage
- Real-time updates via socket hooks
- Links to blockchain transaction explorers

## Required Environment Variables

Ensure the following environment variables are configured:
- `ARWEAVE_WALLET_KEY`: Arweave wallet JSON for anchoring
- `SOLANA_RPC_URL`: Solana RPC endpoint (defaults to devnet)

For development, these can be added to `.env`:
```env
# Arweave (testnet wallet generated automatically if not provided)
# ARWEAVE_WALLET_KEY={"kty":"RSA",...}

# Solana (defaults to devnet)
# SOLANA_RPC_URL=https://api.devnet.solana.com
```