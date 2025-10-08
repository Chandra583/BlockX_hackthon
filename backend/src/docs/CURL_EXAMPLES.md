# 🚀 VERIDRIVE API - CURL EXAMPLES

## 📋 **BASE URL**
```bash
BASE_URL="http://localhost:3000/api"
```

---

## 🔍 **HEALTH & INFO ENDPOINTS**

### **Health Check**
```bash
curl -X GET "$BASE_URL/health" \
  -H "Content-Type: application/json"
```

### **API Info**
```bash
curl -X GET "$BASE_URL/info" \
  -H "Content-Type: application/json"
```

### **Auth Service Health**
```bash
curl -X GET "$BASE_URL/auth/health" \
  -H "Content-Type: application/json"
```

---

## 🔐 **AUTHENTICATION ENDPOINTS**

### **1. USER REGISTRATION**

#### **Admin User Registration** 🔴
```bash
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@veridrive.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!",
    "firstName": "John",
    "lastName": "Admin",
    "role": "admin",
    "phoneNumber": "+1-555-0101",
    "termsAccepted": true,
    "privacyAccepted": true,
    "roleSpecificData": {
      "adminLevel": "super",
      "permissions": ["user_management", "fraud_investigation", "system_admin"],
      "departments": ["security", "operations"],
      "accessLevel": 10
    }
  }'
```

#### **Vehicle Owner Registration** 🟣
```bash
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@veridrive.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "owner",
    "phoneNumber": "+1-555-0102",
    "termsAccepted": true,
    "privacyAccepted": true,
    "roleSpecificData": {
      "licenseNumber": "DL123456789",
      "licenseExpiry": "2025-12-31",
      "vehiclesOwned": [],
      "devicesRegistered": [],
      "verificationLevel": "basic",
      "trackingConsent": true
    }
  }'
```

#### **Service Provider Registration** 🟠
```bash
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "service@veridrive.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!",
    "firstName": "Sarah",
    "lastName": "Wilson",
    "role": "service",
    "phoneNumber": "+1-555-0104",
    "termsAccepted": true,
    "privacyAccepted": true,
    "roleSpecificData": {
      "businessName": "Wilson Auto Services",
      "businessType": "mechanic",
      "licenseNumber": "SRV987654321",
      "licenseExpiry": "2025-06-30",
      "serviceCategories": ["maintenance", "inspection"],
      "certificationsHeld": ["ASE_CERTIFIED"],
      "serviceRadius": 25,
      "isAuthorizedDealer": false
    }
  }'
```

---

### **2. USER LOGIN**

#### **Basic Login**
```bash
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@veridrive.com",
    "password": "SecurePass123!"
  }'
```

#### **Login with Remember Me**
```bash
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@veridrive.com",
    "password": "SecurePass123!",
    "rememberMe": true
  }'
```

---

### **3. TOKEN MANAGEMENT**

#### **Refresh Access Token**
```bash
# Replace YOUR_REFRESH_TOKEN with actual refresh token from login response
curl -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

#### **Logout**
```bash
# Replace YOUR_ACCESS_TOKEN with actual access token
curl -X POST "$BASE_URL/auth/logout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### **4. PASSWORD MANAGEMENT**

#### **Forgot Password**
```bash
curl -X POST "$BASE_URL/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer@veridrive.com"
  }'
```

#### **Change Password (Authenticated)**
```bash
# Replace YOUR_ACCESS_TOKEN with actual access token
curl -X POST "$BASE_URL/auth/change-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "currentPassword": "SecurePass123!",
    "newPassword": "NewSecurePass123!",
    "confirmPassword": "NewSecurePass123!"
  }'
```

---

### **5. USER PROFILE**

#### **Get Current User Info**
```bash
# Replace YOUR_ACCESS_TOKEN with actual access token
curl -X GET "$BASE_URL/auth/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🧪 **QUICK TEST COMMANDS**

### **Test Server**
```bash
curl http://localhost:3000/api/health
```

### **Test Registration & Login Flow**
```bash
# 1. Register Admin
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@veridrive.com","password":"SecurePass123!","confirmPassword":"SecurePass123!","firstName":"Test","lastName":"User","role":"admin","termsAccepted":true,"privacyAccepted":true,"roleSpecificData":{"adminLevel":"super","permissions":["user_management"],"departments":["security"],"accessLevel":10}}'

# 2. Login
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@veridrive.com","password":"SecurePass123!"}'
```

---

## 📊 **SUCCESS RESPONSES**

### **Registration Success**
```json
{
  "status": "success",
  "message": "Registration successful. Please verify your email address.",
  "data": {
    "user": {
      "id": "64f8b123c456789012345678",
      "email": "admin@veridrive.com",
      "firstName": "John",
      "lastName": "Admin",
      "fullName": "John Admin",
      "role": "admin",
      "accountStatus": "pending",
      "verificationStatus": "unverified",
      "emailVerified": false
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900,
      "tokenType": "Bearer"
    }
  }
}
```

### **Login Success**
```json
{
  "status": "success", 
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "email": "...", "role": "..." },
    "tokens": { "accessToken": "...", "refreshToken": "..." }
  }
}
```

---

## 🔑 **AUTHENTICATION**

For protected endpoints, include the Bearer token:
```bash
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🚀 **QUICK START**

1. **Start Server**: `npm run dev`
2. **Test Health**: `curl http://localhost:3000/api/health`
3. **Register**: Use registration curl above
4. **Login**: Use login curl
5. **Access Protected Routes**: Include Bearer token

🎉 **Ready to test VERIDRIVE authentication!** 