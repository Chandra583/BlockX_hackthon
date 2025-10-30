# API Testing Guide - Postman & cURL

**Production URL:** https://veridrive-x-hackthon.vercel.app

---

## 🔍 Health & Info Checks

### 1. Health Check (No Auth Required)
```bash
curl https://veridrive-x-hackthon.vercel.app/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "db": "connected",
  "ts": "2025-10-30T09:22:39.285Z"
}
```

### 2. API Info (No Auth Required)
```bash
curl https://veridrive-x-hackthon.vercel.app/api/info
```

**Expected Response:**
```json
{
  "message": "Welcome to BlockX Anti-Fraud Vehicle Marketplace API",
  "version": "1.0.0",
  "environment": "production",
  "documentation": "/api/docs",
  "health": "/api/health",
  "info": "/api/info",
  "endpoints": {
    "auth": "/api/auth",
    "health": "/api/health",
    "info": "/api/info"
  },
  "cors": {
    "frontendUrl": "https://blockx.netlify.app",
    "corsOrigin": "https://blockx.netlify.app",
    "allowedOrigins": [...]
  },
  "timestamp": "2025-10-30T09:22:39.285Z"
}
```

### 3. Root Endpoint (No Auth Required)
```bash
curl https://veridrive-x-hackthon.vercel.app/
```

---

## 🔐 Authentication Endpoints

### 1. Register User
```bash
curl -X POST https://veridrive-x-hackthon.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+1234567890",
    "role": "owner"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "..."
  }
}
```

### 2. Login
```bash
curl -X POST https://veridrive-x-hackthon.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:** Returns access token and refresh token

### 3. Get Current User Profile
```bash
curl https://veridrive-x-hackthon.vercel.app/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🚗 Vehicle Endpoints

### 1. Get All Vehicles
```bash
curl https://veridrive-x-hackthon.vercel.app/api/vehicles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Get Vehicle by ID
```bash
curl https://veridrive-x-hackthon.vercel.app/api/vehicles/VEHICLE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Create Vehicle
```bash
curl -X POST https://veridrive-x-hackthon.vercel.app/api/vehicles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vin": "1HGBH41JXMN109186",
    "vehicleNumber": "KA01AB1234",
    "make": "Toyota",
    "vehicleModel": "Camry",
    "year": 2022,
    "color": "Silver",
    "currentMileage": 15000,
    "fuelType": "Petrol",
    "transmissionType": "Automatic"
  }'
```

### 4. Update Vehicle
```bash
curl -X PUT https://veridrive-x-hackthon.vercel.app/api/vehicles/VEHICLE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentMileage": 16000,
    "color": "Blue"
  }'
```

### 5. Delete Vehicle
```bash
curl -X DELETE https://veridrive-x-hackthon.vercel.app/api/vehicles/VEHICLE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📊 Telemetry Endpoints

### 1. Get Latest OBD Data for Vehicle
```bash
curl https://veridrive-x-hackthon.vercel.app/api/telemetry/latest-obd/VEHICLE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Submit Telemetry Data
```bash
curl -X POST https://veridrive-x-hackthon.vercel.app/api/telemetry \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "VEHICLE_ID",
    "deviceId": "DEVICE_ID",
    "speed": 65,
    "rpm": 2500,
    "fuelLevel": 75,
    "engineTemp": 90,
    "mileage": 15100,
    "location": {
      "type": "Point",
      "coordinates": [77.5946, 12.9716]
    }
  }'
```

---

## 📄 Document Upload Endpoints

### 1. Upload Vehicle Document
```bash
curl -X POST https://veridrive-x-hackthon.vercel.app/api/vehicles/VEHICLE_ID/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "document=@/path/to/document.pdf" \
  -F "documentType=registration" \
  -F "description=Vehicle Registration Certificate"
```

### 2. Get Vehicle Documents
```bash
curl https://veridrive-x-hackthon.vercel.app/api/vehicles/VEHICLE_ID/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🛒 Marketplace Endpoints

### 1. List Vehicle for Sale
```bash
curl -X POST https://veridrive-x-hackthon.vercel.app/api/marketplace/list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "VEHICLE_ID",
    "price": 250000,
    "description": "Well maintained vehicle with full service history",
    "negotiable": true
  }'
```

### 2. Get All Listings
```bash
curl https://veridrive-x-hackthon.vercel.app/api/marketplace/listings
```

### 3. Get Listing by ID
```bash
curl https://veridrive-x-hackthon.vercel.app/api/marketplace/listings/LISTING_ID
```

### 4. Create Purchase Request
```bash
curl -X POST https://veridrive-x-hackthon.vercel.app/api/marketplace/purchase-request \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": "LISTING_ID",
    "offeredPrice": 240000,
    "message": "Interested in purchasing this vehicle"
  }'
```

---

## 📜 Mileage History Endpoints

### 1. Get Mileage History for Vehicle
```bash
curl https://veridrive-x-hackthon.vercel.app/api/mileage-history/vehicle/VEHICLE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Record Mileage
```bash
curl -X POST https://veridrive-x-hackthon.vercel.app/api/mileage-history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "VEHICLE_ID",
    "vin": "1HGBH41JXMN109186",
    "currentMileage": 16500,
    "previousMileage": 16000,
    "source": "owner",
    "verified": true
  }'
```

---

## 🔍 Fraud Detection Endpoints

### 1. Check Vehicle Fraud Score
```bash
curl https://veridrive-x-hackthon.vercel.app/api/fraud/check/VEHICLE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Get Fraud Reports
```bash
curl https://veridrive-x-hackthon.vercel.app/api/fraud/reports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔗 Blockchain Endpoints

### 1. Get Blockchain Network Info
```bash
curl https://veridrive-x-hackthon.vercel.app/api/blockchain/network-info \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Get Transaction by Hash
```bash
curl https://veridrive-x-hackthon.vercel.app/api/blockchain/transaction/TRANSACTION_HASH \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Upload to Arweave
```bash
curl -X POST https://veridrive-x-hackthon.vercel.app/api/blockchain/arweave/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "vehicleId=VEHICLE_ID" \
  -F "documentType=title"
```

---

## 💰 Wallet Endpoints

### 1. Get User Wallet
```bash
curl https://veridrive-x-hackthon.vercel.app/api/wallet/my-wallet \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Get Wallet Balance
```bash
curl https://veridrive-x-hackthon.vercel.app/api/wallet/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📋 Complete Test Flow Example

```bash
# 1. Register a new user
TOKEN=$(curl -s -X POST https://veridrive-x-hackthon.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@test.com",
    "password": "TestPass123!",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "role": "owner"
  }' | jq -r '.data.token')

echo "Token: $TOKEN"

# 2. Get user profile
curl https://veridrive-x-hackthon.vercel.app/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 3. Create a vehicle
VEHICLE_ID=$(curl -s -X POST https://veridrive-x-hackthon.vercel.app/api/vehicles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vin": "1HGBH41JXMN109186",
    "vehicleNumber": "KA01AB1234",
    "make": "Toyota",
    "vehicleModel": "Camry",
    "year": 2022,
    "color": "Silver",
    "currentMileage": 15000,
    "fuelType": "Petrol",
    "transmissionType": "Automatic"
  }' | jq -r '.data._id')

echo "Vehicle ID: $VEHICLE_ID"

# 4. Get vehicle details
curl https://veridrive-x-hackthon.vercel.app/api/vehicles/$VEHICLE_ID \
  -H "Authorization: Bearer $TOKEN"

# 5. Record mileage
curl -X POST https://veridrive-x-hackthon.vercel.app/api/mileage-history \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"vehicleId\": \"$VEHICLE_ID\",
    \"vin\": \"1HGBH41JXMN109186\",
    \"currentMileage\": 15500,
    \"previousMileage\": 15000,
    \"source\": \"owner\",
    \"verified\": true
  }"
```

---

## 🔧 Important Notes

1. **Replace placeholders:**
   - `YOUR_JWT_TOKEN` - Get from login/register response
   - `VEHICLE_ID` - Get from vehicle creation/list response
   - `LISTING_ID` - Get from marketplace listings
   - `DEVICE_ID` - Get from device registration

2. **Authorization Header:**
   - All protected endpoints require: `Authorization: Bearer YOUR_JWT_TOKEN`

3. **Content-Type:**
   - JSON requests need: `Content-Type: application/json`
   - File uploads need: `Content-Type: multipart/form-data` (automatic with `-F`)

4. **CORS:**
   - The API accepts requests from `https://blockx.netlify.app`
   - For testing with Postman, CORS won't be an issue

5. **Rate Limiting:**
   - Max 1000 requests per 5 minutes per IP
   - Account lockout after 10 failed login attempts

---

## 📱 Import to Postman

1. Create a new Postman Collection
2. Set Base URL as Environment Variable:
   - Key: `BASE_URL`
   - Value: `https://veridrive-x-hackthon.vercel.app`
3. Set Token as Environment Variable:
   - Key: `TOKEN`
   - Value: (get from login response)
4. Use `{{BASE_URL}}` and `{{TOKEN}}` in your requests

**Example Postman Request:**
```
GET {{BASE_URL}}/api/health
```

With Authorization Header:
```
Authorization: Bearer {{TOKEN}}
```

---

## 🐛 Troubleshooting

- **503 Service Unavailable:** Database connection issue, wait ~20s for cold start
- **401 Unauthorized:** Invalid/expired token, login again
- **404 Not Found:** Check endpoint URL and method
- **500 Internal Server Error:** Server error, check logs or contact admin

---

**✅ API is Live:** https://veridrive-x-hackthon.vercel.app

