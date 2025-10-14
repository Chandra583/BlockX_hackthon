# Vehicle Registration & Verification Flow

## Overview
This document describes the new vehicle registration flow that requires admin verification before blockchain registration.

## Flow Description

### Previous Flow
1. User registers vehicle → Immediately sent to Solana blockchain
2. Vehicle saved with `verificationStatus: 'verified'`

### New Flow (Updated)
1. User registers vehicle → Saved to database with `verificationStatus: 'pending'`
2. Admin reviews and verifies vehicle details
3. Admin approves → Vehicle sent to Solana blockchain using owner's wallet
4. All transactions visible in owner's wallet
5. Vehicle status updated to `verificationStatus: 'verified'`

## API Endpoints

### 1. User Registration (Owner)
**Endpoint:** `POST /api/vehicles/register`

**Authentication:** Required (Owner role)

**Request Body:**
```json
{
  "vin": "1HGCM82633A123456",
  "vehicleNumber": "ABC1234",
  "make": "Honda",
  "model": "Civic",
  "year": 2023,
  "initialMileage": 50000,
  "color": "Blue",
  "bodyType": "sedan",
  "fuelType": "gasoline",
  "transmission": "automatic",
  "engineSize": "2.0L",
  "condition": "good",
  "features": ["AC", "Power Windows"],
  "description": "Well maintained vehicle"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vehicle registered successfully. Awaiting admin verification before blockchain registration.",
  "data": {
    "vehicle": {
      "id": "675a123...",
      "vin": "1HGCM82633A123456",
      "vehicleNumber": "ABC1234",
      "make": "Honda",
      "model": "Civic",
      "year": 2023,
      "color": "Blue",
      "currentMileage": 50000,
      "verificationStatus": "pending",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 2. Get Pending Vehicles (Admin)
**Endpoint:** `GET /api/admin/vehicles/pending`

**Authentication:** Required (Admin role)

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)

**Response:**
```json
{
  "status": "success",
  "message": "Pending vehicles retrieved successfully",
  "data": {
    "vehicles": [
      {
        "_id": "675a123...",
        "vin": "1HGCM82633A123456",
        "vehicleNumber": "ABC1234",
        "make": "Honda",
        "vehicleModel": "Civic",
        "year": 2023,
        "currentMileage": 50000,
        "verificationStatus": "pending",
        "ownerId": {
          "_id": "675a456...",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "phoneNumber": "+1234567890"
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalPending": 1,
      "limit": 10,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

### 3. Approve Vehicle (Admin)
**Endpoint:** `POST /api/admin/vehicles/:vehicleId/approve`

**Authentication:** Required (Admin role)

**Prerequisites:**
- Owner must have a blockchain wallet created
- Vehicle must be in 'pending' status

**Response:**
```json
{
  "status": "success",
  "message": "Vehicle approved and registered on blockchain successfully",
  "data": {
    "vehicle": {
      "id": "675a123...",
      "vin": "1HGCM82633A123456",
      "vehicleNumber": "ABC1234",
      "make": "Honda",
      "model": "Civic",
      "year": 2023,
      "verificationStatus": "verified",
      "blockchainHash": "5ekCVGsXeD3EBj1ciHo1hRfs7yaQFrSqyqiGYBBAGLQfeCiCV5Vn3hrMwZ2zi89JHkwgAfn4xoyUENHkbotaUxxf",
      "blockchainAddress": "8x7JKL...",
      "explorerUrl": "https://explorer.solana.com/tx/5ekCVGsXeD3E...?cluster=devnet"
    },
    "owner": {
      "id": "675a456...",
      "name": "John Doe",
      "email": "john@example.com",
      "walletAddress": "8x7JKL..."
    }
  }
}
```

### 4. Reject Vehicle (Admin)
**Endpoint:** `POST /api/admin/vehicles/:vehicleId/reject`

**Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "reason": "Invalid VIN or documentation incomplete"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Vehicle registration rejected",
  "data": {
    "vehicle": {
      "id": "675a123...",
      "vin": "1HGCM82633A123456",
      "vehicleNumber": "ABC1234",
      "make": "Honda",
      "model": "Civic",
      "year": 2023,
      "verificationStatus": "rejected",
      "rejectionReason": "Invalid VIN or documentation incomplete"
    }
  }
}
```

### 5. View Wallet Transactions (Owner)
**Endpoint:** `GET /api/blockchain/wallet/transactions`

**Authentication:** Required (Owner role)

**Query Parameters:**
- `limit` (optional, default: 50)

**Response:**
```json
{
  "success": true,
  "message": "Wallet transactions retrieved successfully",
  "data": {
    "transactions": [
      {
        "signature": "5ekCVGsXeD3EBj1ciHo1hRfs7yaQFrSqyqiGYBBAGLQfeCiCV5Vn3hrMwZ2zi89JHkwgAfn4xoyUENHkbotaUxxf",
        "slot": 123456789,
        "blockTime": 1705315800,
        "confirmationStatus": "finalized",
        "err": null,
        "memoData": {
          "vehicleId": "675a123...",
          "vin": "1HGCM82633A123456",
          "action": "REGISTER_VEHICLE",
          "mileage": 50000,
          "timestamp": 1705315800000
        },
        "fee": 5000,
        "explorerUrl": "https://explorer.solana.com/tx/5ekCVGsXeD3E...?cluster=devnet"
      }
    ],
    "total": 1,
    "walletAddress": "8x7JKL...",
    "network": "devnet"
  }
}
```

## Testing the Complete Flow

### Step 1: Create User Account (Owner)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "role": "owner",
    "roleData": {
      "trackingConsent": true
    }
  }'
```

### Step 2: Login as Owner
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "SecurePass123!"
  }'
```
Save the `accessToken` from the response.

### Step 3: Create Blockchain Wallet (Owner)
```bash
curl -X POST http://localhost:5000/api/blockchain/wallet/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OWNER_ACCESS_TOKEN"
```

### Step 4: Register Vehicle (Owner)
```bash
curl -X POST http://localhost:5000/api/vehicles/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OWNER_ACCESS_TOKEN" \
  -d '{
    "vin": "1HGCM82633A123456",
    "vehicleNumber": "ABC1234",
    "make": "Honda",
    "model": "Civic",
    "year": 2023,
    "initialMileage": 50000,
    "color": "Blue",
    "bodyType": "sedan",
    "fuelType": "gasoline",
    "transmission": "automatic",
    "condition": "good"
  }'
```
Save the vehicle `id` from the response.

### Step 5: Login as Admin
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPass123!"
  }'
```
Save the `accessToken` from the response.

### Step 6: Get Pending Vehicles (Admin)
```bash
curl -X GET http://localhost:5000/api/admin/vehicles/pending \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

### Step 7: Approve Vehicle (Admin)
```bash
curl -X POST http://localhost:5000/api/admin/vehicles/VEHICLE_ID/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

### Step 8: View Wallet Transactions (Owner)
```bash
curl -X GET http://localhost:5000/api/blockchain/wallet/transactions \
  -H "Authorization: Bearer YOUR_OWNER_ACCESS_TOKEN"
```

This will show all blockchain transactions in the owner's wallet, including the vehicle registration.

### Step 9: View Vehicle Details (Owner)
```bash
curl -X GET http://localhost:5000/api/vehicles/VEHICLE_ID \
  -H "Authorization: Bearer YOUR_OWNER_ACCESS_TOKEN"
```

Verify that:
- `verificationStatus` is now `"verified"`
- `blockchainHash` contains the transaction hash
- `blockchainAddress` contains the blockchain address

## Database Changes

### Vehicle Model Updates
Added new fields to the Vehicle schema:

```typescript
{
  // Existing fields...
  verificationStatus: 'pending' | 'verified' | 'flagged' | 'rejected' | 'expired',
  
  // New rejection tracking fields
  rejectionReason?: string,
  rejectedBy?: ObjectId,
  rejectedAt?: Date,
  
  // Blockchain tracking fields
  blockchainHash?: string,
  blockchainAddress?: string
}
```

## Benefits of New Flow

1. **Admin Verification**: Ensures all vehicles are verified before blockchain registration
2. **Owner's Wallet**: All transactions use the owner's wallet, making them visible to the owner
3. **Fraud Prevention**: Admin can reject suspicious registrations before they reach the blockchain
4. **Audit Trail**: Complete history of approval/rejection with reasons
5. **Cost Control**: Prevents unnecessary blockchain transactions for invalid vehicles

## Important Notes

- Owners must create a blockchain wallet BEFORE registering vehicles
- Admin approval is REQUIRED before blockchain registration
- All blockchain transactions appear in the owner's wallet
- Rejected vehicles can be modified and resubmitted by creating a new registration
- The old direct blockchain registration endpoint is now admin-only and deprecated


