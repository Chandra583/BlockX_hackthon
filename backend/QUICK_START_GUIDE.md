# Quick Start Guide - Vehicle Registration Flow

## ⚠️ Important: Use the Correct Endpoints!

### For Vehicle Owners (NOT Admin)

**✅ CORRECT Endpoint:** `POST /api/vehicles/register`

This is the endpoint where owners submit their vehicle information for admin review.

### For Admins Only

**Admin Endpoints:**
- `GET /api/admin/vehicles/pending` - View pending registrations
- `POST /api/admin/vehicles/:vehicleId/approve` - Approve and register on blockchain
- `POST /api/admin/vehicles/:vehicleId/reject` - Reject with reason

---

## Step-by-Step: Owner Registration

### 1️⃣ Owner Creates Wallet (First Time Only)

```bash
POST /api/blockchain/wallet/create
Authorization: Bearer <OWNER_TOKEN>
```

### 2️⃣ Owner Submits Vehicle Information

**✅ Use this endpoint:**
```bash
POST /api/vehicles/register
Authorization: Bearer <OWNER_TOKEN>
Content-Type: application/json

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
  "condition": "good"
}
```

**Response (Success):**
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
      "verificationStatus": "pending",
      "createdAt": "2025-10-13T12:30:00.000Z"
    }
  }
}
```

**Status = "pending"** means waiting for admin approval!

### 3️⃣ Owner Checks Vehicle Status

```bash
GET /api/vehicles
Authorization: Bearer <OWNER_TOKEN>
```

This shows all your vehicles with their current status:
- `"verificationStatus": "pending"` - Waiting for admin
- `"verificationStatus": "verified"` - Approved & on blockchain
- `"verificationStatus": "rejected"` - Rejected (check rejectionReason)

---

## Step-by-Step: Admin Approval

### 1️⃣ Admin Views Pending Vehicles

```bash
GET /api/admin/vehicles/pending
Authorization: Bearer <ADMIN_TOKEN>
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "vehicles": [
      {
        "_id": "675a123...",
        "vin": "1HGCM82633A123456",
        "vehicleNumber": "ABC1234",
        "make": "Honda",
        "vehicleModel": "Civic",
        "year": 2023,
        "verificationStatus": "pending",
        "ownerId": {
          "firstName": "John",
          "lastName": "Doe",
          "email": "owner@example.com"
        }
      }
    ]
  }
}
```

### 2️⃣ Admin Approves Vehicle

```bash
POST /api/admin/vehicles/675a123.../approve
Authorization: Bearer <ADMIN_TOKEN>
```

**What happens:**
1. ✅ System uses **owner's wallet** (not admin's)
2. ✅ Registers vehicle on Solana blockchain
3. ✅ Transaction visible in **owner's wallet**
4. ✅ Vehicle status changes to "verified"

**Response:**
```json
{
  "status": "success",
  "message": "Vehicle approved and registered on blockchain successfully",
  "data": {
    "vehicle": {
      "id": "675a123...",
      "verificationStatus": "verified",
      "blockchainHash": "5ekCVGsXeD3...",
      "explorerUrl": "https://explorer.solana.com/tx/5ekCVGsXeD3...?cluster=devnet"
    },
    "owner": {
      "name": "John Doe",
      "email": "owner@example.com",
      "walletAddress": "8x7JKL..."
    }
  }
}
```

### 3️⃣ Admin Rejects Vehicle (Optional)

```bash
POST /api/admin/vehicles/675a123.../reject
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "reason": "Invalid VIN or incomplete documentation"
}
```

---

## Owner Views Blockchain Transactions

After admin approval, owner can see the transaction:

```bash
GET /api/blockchain/wallet/transactions
Authorization: Bearer <OWNER_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "signature": "5ekCVGsXeD3...",
        "memoData": {
          "vehicleId": "675a123...",
          "vin": "1HGCM82633A123456",
          "action": "REGISTER_VEHICLE",
          "mileage": 50000
        },
        "explorerUrl": "https://explorer.solana.com/tx/5ekCVGsXeD3...?cluster=devnet"
      }
    ],
    "walletAddress": "8x7JKL...",
    "network": "devnet"
  }
}
```

---

## 🔑 Key Points

1. **Owners use:** `/api/vehicles/register` (NOT `/api/blockchain/vehicle/register`)
2. **Initial status:** `pending` - waiting for admin review
3. **Admin approves:** Uses owner's wallet for blockchain transaction
4. **Transaction visibility:** Owner can see all transactions in their wallet
5. **Final status:** `verified` - vehicle is on blockchain

---

## ⚠️ Common Mistakes

### ❌ WRONG - Don't use this as owner:
```bash
POST /api/blockchain/vehicle/register  # This is admin-only!
```

### ✅ CORRECT - Use this as owner:
```bash
POST /api/vehicles/register  # This is for owners!
```

---

## Testing Script

### Complete Flow Test:

```bash
# 1. Owner creates wallet
curl -X POST http://localhost:5000/api/blockchain/wallet/create \
  -H "Authorization: Bearer <OWNER_TOKEN>"

# 2. Owner registers vehicle (CORRECT ENDPOINT!)
curl -X POST http://localhost:5000/api/vehicles/register \
  -H "Authorization: Bearer <OWNER_TOKEN>" \
  -H "Content-Type: application/json" \
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

# 3. Admin views pending
curl -X GET http://localhost:5000/api/admin/vehicles/pending \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# 4. Admin approves (replace VEHICLE_ID)
curl -X POST http://localhost:5000/api/admin/vehicles/VEHICLE_ID/approve \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# 5. Owner views transactions
curl -X GET http://localhost:5000/api/blockchain/wallet/transactions \
  -H "Authorization: Bearer <OWNER_TOKEN>"
```

---

## Need Help?

- **Pending Status Not Changing?** Check if admin has approved
- **Authorization Error?** Make sure you're using the correct endpoint for your role
- **Wallet Required Error?** Owner must create wallet before admin can approve
- **VIN Already Exists?** Each VIN can only be registered once


