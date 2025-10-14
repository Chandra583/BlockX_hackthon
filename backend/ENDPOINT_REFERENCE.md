# Endpoint Reference - Vehicle Registration

## 🎯 Quick Answer

**If you're getting: "Access denied. Required roles: admin"**

You're using the WRONG endpoint! Use the table below:

| Your Role | What You Want | Endpoint to Use | ❌ Don't Use |
|-----------|---------------|-----------------|-------------|
| **Owner** | Register vehicle | `POST /api/vehicles/register` | ❌ `/api/blockchain/vehicle/register` |
| **Owner** | View my vehicles | `GET /api/vehicles` | |
| **Owner** | View transactions | `GET /api/blockchain/wallet/transactions` | |
| **Admin** | View pending | `GET /api/admin/vehicles/pending` | |
| **Admin** | Approve vehicle | `POST /api/admin/vehicles/:id/approve` | |
| **Admin** | Reject vehicle | `POST /api/admin/vehicles/:id/reject` | |

---

## 📊 Visual Flow

```
┌────────────────────────────────────────────────────────────┐
│                    OWNER'S ACTIONS                         │
└────────────────────────────────────────────────────────────┘

Step 1: Create Wallet (First Time)
┌─────────────────────────────────────────┐
│ POST /api/blockchain/wallet/create      │
│ Authorization: Bearer <OWNER_TOKEN>     │
└─────────────────────────────────────────┘
                    ↓
        Wallet Created ✅
                    ↓
Step 2: Register Vehicle
┌─────────────────────────────────────────┐
│ ✅ POST /api/vehicles/register          │  <-- USE THIS!
│ Authorization: Bearer <OWNER_TOKEN>     │
│                                         │
│ Body: {                                 │
│   vin, vehicleNumber, make, model,     │
│   year, initialMileage, etc.           │
│ }                                       │
└─────────────────────────────────────────┘
                    ↓
        Status: "pending" ⏳
        (Waiting for admin)
                    ↓
Step 3: Check Status
┌─────────────────────────────────────────┐
│ GET /api/vehicles                       │
│ Authorization: Bearer <OWNER_TOKEN>     │
└─────────────────────────────────────────┘
                    ↓
        View: verificationStatus

┌────────────────────────────────────────────────────────────┐
│                    ADMIN'S ACTIONS                         │
└────────────────────────────────────────────────────────────┘

Step 1: View Pending Vehicles
┌─────────────────────────────────────────┐
│ GET /api/admin/vehicles/pending         │
│ Authorization: Bearer <ADMIN_TOKEN>     │
└─────────────────────────────────────────┘
                    ↓
        List of pending vehicles
                    ↓
Step 2a: Approve                Step 2b: Reject
┌─────────────────────────┐    ┌─────────────────────────┐
│ POST /api/admin/        │    │ POST /api/admin/        │
│ vehicles/:id/approve    │    │ vehicles/:id/reject     │
│                         │    │                         │
│ Uses Owner's Wallet! 🔑 │    │ Body: { reason }        │
└─────────────────────────┘    └─────────────────────────┘
            ↓                              ↓
    Registered on                  Status: "rejected"
    Solana Blockchain              With reason
            ↓
    Status: "verified" ✅
    + blockchainHash
            ↓
┌────────────────────────────────────────┐
│ Transaction visible in                 │
│ OWNER'S wallet                         │
│ (Not admin's wallet!)                  │
└────────────────────────────────────────┘

```

---

## 🔄 Complete Registration Flow

### Owner's Perspective

```
1. I create a wallet
   └─> POST /api/blockchain/wallet/create

2. I register my vehicle
   └─> POST /api/vehicles/register
       Response: { verificationStatus: "pending" }

3. I wait for admin approval
   └─> Status remains "pending"

4. I check my vehicles periodically
   └─> GET /api/vehicles
       Look for verificationStatus

5. After admin approves:
   └─> Status changes to "verified"
   └─> I can see blockchain transaction
       GET /api/blockchain/wallet/transactions
```

### Admin's Perspective

```
1. I check pending vehicles
   └─> GET /api/admin/vehicles/pending

2. I review vehicle details
   └─> Check VIN, owner info, etc.

3a. If valid - I approve
    └─> POST /api/admin/vehicles/:id/approve
        System registers on blockchain using owner's wallet
        Transaction appears in owner's wallet

3b. If invalid - I reject
    └─> POST /api/admin/vehicles/:id/reject
        Provide reason for rejection
```

---

## 🔑 Status Values Explained

| Status | Meaning | Who Can See | Next Action |
|--------|---------|-------------|-------------|
| `pending` | Waiting for admin review | Owner & Admin | Admin needs to approve/reject |
| `verified` | Approved & on blockchain | Everyone | None - Complete! |
| `rejected` | Admin rejected registration | Owner & Admin | Owner can fix issues and re-register |
| `flagged` | Suspicious activity detected | Admin | Admin investigation |

---

## 📝 Example Requests

### Owner Registration (CORRECT ✅)

```javascript
// Frontend/Postman/cURL
const response = await fetch('http://localhost:5000/api/vehicles/register', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + ownerToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    vin: "1HGCM82633A123456",
    vehicleNumber: "ABC1234",
    make: "Honda",
    model: "Civic",
    year: 2023,
    initialMileage: 50000,
    color: "Blue",
    bodyType: "sedan",
    fuelType: "gasoline",
    transmission: "automatic",
    condition: "good"
  })
});

// Expected Response:
{
  "success": true,
  "message": "Vehicle registered successfully. Awaiting admin verification before blockchain registration.",
  "data": {
    "vehicle": {
      "id": "675a123...",
      "vin": "1HGCM82633A123456",
      "verificationStatus": "pending",  // <-- Status is PENDING
      "createdAt": "2025-10-13T12:30:00.000Z"
    }
  }
}
```

### Owner Registration (WRONG ❌)

```javascript
// DON'T DO THIS - This will give "Access denied" error!
const response = await fetch('http://localhost:5000/api/blockchain/vehicle/register', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + ownerToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ /* ... */ })
});

// Error Response:
{
  "status": "error",
  "message": "Access denied. Required roles: admin",
  "errorCode": "AUTHORIZATION_ERROR"
}
```

### Admin Approval

```javascript
// Admin approves the vehicle
const response = await fetch('http://localhost:5000/api/admin/vehicles/675a123.../approve', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + adminToken,
    'Content-Type': 'application/json'
  }
});

// Expected Response:
{
  "status": "success",
  "message": "Vehicle approved and registered on blockchain successfully",
  "data": {
    "vehicle": {
      "id": "675a123...",
      "vin": "1HGCM82633A123456",
      "verificationStatus": "verified",  // <-- Status now VERIFIED
      "blockchainHash": "5ekCVGsXeD3EBj1ciHo1hRfs7...",
      "explorerUrl": "https://explorer.solana.com/tx/..."
    },
    "owner": {
      "walletAddress": "8x7JKL..."  // <-- Owner's wallet was used
    }
  }
}
```

---

## 🎨 Frontend Integration Example

```typescript
// VehicleRegistration.tsx

const registerVehicle = async (vehicleData) => {
  try {
    // ✅ CORRECT ENDPOINT
    const response = await fetch('/api/vehicles/register', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(vehicleData)
    });

    const result = await response.json();

    if (result.success) {
      // Show success message
      alert(`Vehicle registered! Status: ${result.data.vehicle.verificationStatus}`);
      // Status will be "pending" - waiting for admin
      
      // Redirect to "My Vehicles" page where they can track status
      navigate('/my-vehicles');
    }
  } catch (error) {
    console.error('Registration failed:', error);
  }
};

// Display vehicle status
const VehicleStatusBadge = ({ status }) => {
  const badges = {
    'pending': { color: 'yellow', text: '⏳ Pending Admin Review' },
    'verified': { color: 'green', text: '✅ Verified & On Blockchain' },
    'rejected': { color: 'red', text: '❌ Rejected' }
  };
  
  const badge = badges[status] || badges.pending;
  
  return (
    <span className={`badge-${badge.color}`}>
      {badge.text}
    </span>
  );
};
```

---

## 🐛 Troubleshooting

### Error: "Access denied. Required roles: admin"

**Cause:** You're using `/api/blockchain/vehicle/register` (admin-only)

**Fix:** Use `/api/vehicles/register` instead

### Error: "Owner does not have a blockchain wallet"

**Cause:** Owner hasn't created a wallet yet

**Fix:** Owner must call `POST /api/blockchain/wallet/create` first

### Error: "Vehicle with this VIN already exists"

**Cause:** VIN is already registered

**Fix:** Check if you already registered this vehicle, or use a different VIN

### Vehicle status stuck on "pending"

**Cause:** Admin hasn't reviewed yet

**Fix:** Wait for admin approval, or contact admin

---

## 📞 Support

If you're still having issues:
1. Check which endpoint you're using
2. Verify your token is for the correct role (owner vs admin)
3. Check the response status and error message
4. Review the logs at `backend/logs/error-*.log`


