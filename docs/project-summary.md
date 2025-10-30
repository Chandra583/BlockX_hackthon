# BlockX / VeriDrive - Complete Project Flow Summary

**Generated:** October 30, 2025  
**Purpose:** Comprehensive technical documentation for presentation slides  
**Source:** Complete repository analysis (backend, frontend, IoT, blockchain integration)

---

## 1. PROJECT OVERVIEW

### Problem Statement
Odometer fraud costs the automotive industry billions annually. Traditional vehicle history tracking systems are centralized, easily manipulated, and lack real-time verification. Buyers cannot trust mileage claims, leading to market inefficiency and consumer harm.

### Solution: BlockX/VeriDrive
A decentralized vehicle trust platform combining **IoT hardware**, **blockchain immutability**, and **AI-powered fraud detection** to create tamper-proof vehicle histories. The system captures real-time mileage data directly from vehicle ECUs, validates it cryptographically, and anchors records on Solana blockchain.

### Key Innovation
- **Real-time fraud detection** using cross-PID validation and historical pattern analysis
- **Immutable blockchain records** on Solana with SHA-256 hashing
- **IoT-driven automation** via ESP32 + OBD-II direct vehicle integration
- **Multi-role ecosystem** supporting owners, buyers, service providers, regulators, and admins
- **TrustScore system** providing dynamic vehicle reliability scoring

### Target Users
- **Vehicle Owners:** Monitor vehicle health, prove authenticity, increase resale value
- **Buyers:** Verify vehicle history before purchase, avoid fraud
- **Service Providers:** Record maintenance with blockchain verification
- **Regulators/Government:** Track vehicles for compliance and fraud investigation
- **Insurance Companies:** Usage-based insurance with verified mileage data

---

## 2. ARCHITECTURE OVERVIEW

### System Layers

#### **Layer 1: IoT Hardware (ESP32 + OBD-II)**
- **Hardware:** ESP32 microcontroller + Veepeak WiFi OBD-II adapter + EC200U cellular modem
- **Function:** Direct ECU data extraction (VIN, mileage, RPM, speed, engine temp, fuel level)
- **Communication:** WiFi (OBD) → ESP32 → 4G cellular (EC200U) → Backend API
- **Power Management:** Deep sleep cycles (configurable 2-minute intervals), battery voltage monitoring
- **Data Buffering:** SPIFFS filesystem stores up to 50 records offline, auto-retry on network recovery
- **Anti-Tampering:** Local rollback detection, cross-PID validation, impossible distance algorithms

#### **Layer 2: Backend API (Node.js + Express + MongoDB)**
- **Framework:** Express.js with TypeScript, deployed on Vercel serverless
- **Database:** MongoDB Atlas with Mongoose ODM (19 schemas)
- **Key Services:**
  - Device ingestion endpoint (`/api/device/status`)
  - TrustScore calculation engine (atomic transactions)
  - Fraud detection logic (rollback, impossible distance, PID inconsistency)
  - Blockchain anchoring service (Solana + Arweave)
  - Real-time notifications (Socket.IO)
- **Authentication:** JWT with refresh tokens, role-based access control (RBAC)
- **Deployment:** Vercel serverless functions (cold start <2s), MongoDB connection pooling

#### **Layer 3: Blockchain Layer (Solana + IPFS/Arweave)**
- **Blockchain:** Solana Devnet (production will use Mainnet)
- **Program:** Memo Program (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`)
- **Data Storage:** SHA-256 hash of telemetry → on-chain, raw JSON → IPFS/Arweave
- **Transaction Types:**
  1. Vehicle registration (VIN + initial mileage)
  2. Mileage update (previousMileage + newMileage + timestamp + source)
  3. Ownership transfer (seller wallet → buyer wallet)
- **Verification:** Transaction signature + timestamp stored in MongoDB for indexing
- **RPC Endpoints:** Multiple fallback RPC URLs (Helius, Solana Foundation) for reliability

#### **Layer 4: Frontend (React + TypeScript + Vite)**
- **Framework:** React 19 + TypeScript, Vite build system
- **UI Library:** Tailwind CSS + Framer Motion for animations
- **State Management:** Redux Toolkit + Zustand
- **Routing:** React Router v7 with role-based protected routes
- **Key Pages:**
  - Owner Dashboard (vehicle list, TrustScore, mileage charts, notifications)
  - Marketplace (blockchain-verified listings, fraud alerts, history reports)
  - Wallet Management (Solana wallet creation, transaction history)
  - Admin Panel (user management, fraud monitoring, analytics)
- **Real-Time:** Socket.IO client for live TrustScore updates, fraud alerts
- **Deployment:** Netlify with auto-deploy from Git (`https://blockx.netlify.app`)

### Technology Stack Summary

| Layer | Technologies |
|-------|-------------|
| **IoT Hardware** | ESP32, Veepeak OBD-II (ELM327), EC200U 4G Modem |
| **Protocols** | OBD-II (ISO 15765-4 CAN), MQTT, HTTP/HTTPS, WebSocket |
| **Backend** | Node.js 18+, Express.js, TypeScript, MongoDB (Mongoose) |
| **Blockchain** | Solana (@solana/web3.js), Memo Program, Arweave |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Redux Toolkit |
| **Real-Time** | Socket.IO (WebSocket) |
| **Authentication** | JWT (jsonwebtoken), bcrypt |
| **Deployment** | Vercel (backend), Netlify (frontend), MongoDB Atlas |
| **DevOps** | GitHub, Jest, Supertest, React Testing Library |

---

## 3. CORE WORKFLOWS

### 3.1 Device Data Capture and Validation Flow

**Step 1: OBD-II Connection**
1. ESP32 wakes from deep sleep (timer or manual trigger)
2. Connects to Veepeak WiFi network (`WiFi_OBDII`)
3. Establishes TCP connection to ELM327 adapter (port 35000)
4. Sends initialization commands (ATZ, ATE0, ATSP6 for CAN protocol)

**Step 2: Data Extraction**
1. **VIN Retrieval:** Mode 09 PID 02 (multi-line response parsing)
2. **Mileage Capture:** Intelligent PID discovery (vehicle-specific)
   - Hyundai: UDS Mode 22, PID F190 (0.1 km/bit scale)
   - Maruti: PID 0x22A6 or 0xA6 (standard OBD-II)
   - Discovery Mode: Scans 200+ PIDs, identifies plausible odometer values (1000-999999 km)
3. **Telemetry:** RPM (PID 010C), Speed (010D), Engine Temp (0105), Fuel Level (012F)
4. **Cross-Validation:** Query multiple odometer PIDs simultaneously, flag discrepancies

**Step 3: Local Fraud Detection**
- **Rollback Check:** If mileage < previous reading - 5 km → flag tampering
- **Impossible Distance:** If mileage increase > (time_hours × 120 km/h) → flag tampering
- **Sudden Jump:** If increase > 1000 km in <24 hours → flag suspicious
- **Odometer Stuck:** If no change for >7 days → flag device malfunction

**Step 4: Data Buffering & Transmission**
1. Save JSON to SPIFFS filesystem (`/data_<timestamp>.json`)
2. Disconnect from Veepeak WiFi
3. Connect to cellular network via EC200U (APN: airtelgprs.com)
4. HTTP POST to backend (`https://veridrive-x-hackthon.vercel.app/api/device/status`)
5. Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
6. On success: Delete buffered file; On failure: Keep for next cycle

**Step 5: Deep Sleep**
- Enter deep sleep for 2 minutes (configurable)
- Power down WiFi, cellular, Bluetooth
- GPIO hold to prevent current leakage
- Wake on timer or external interrupt

### 3.2 Mileage Fraud Detection (Backend)

**Trigger:** Device controller receives telemetry data

**Detection Rules:**
1. **Rollback Detection:**
   - Previous: 50,000 km → Current: 48,000 km → **FRAUD ALERT**
   - Action: Create FraudAlert document (type: `odometer_rollback`, severity: `critical`)
   - TrustScore: -15 points

2. **Impossible Distance:**
   - Previous: 50,000 km (2 hours ago) → Current: 50,300 km → Average speed: 150 km/h → **SUSPICIOUS**
   - Action: Flag as `IMPOSSIBLE_DISTANCE`, notify owner
   - TrustScore: -10 points

3. **PID Inconsistency:**
   - Primary PID: 50,000 km → Secondary PID: 55,000 km → Difference: 10% → **WARNING**
   - Action: Mark as `PID_INCONSISTENT`, request service inspection
   - TrustScore: -5 points

4. **Pattern Analysis:**
   - Stagnant odometer (no change for 30 days while vehicle active) → **DEVICE_MALFUNCTION**
   - Extreme variance (readings fluctuate wildly) → **SENSOR_ERROR**
   - TrustScore: No change (data quality issue)

**Fraud Alert Workflow:**
1. Create `FraudAlert` document with evidence (previous mileage, current mileage, time delta)
2. Update vehicle's `fraudAlerts` array
3. Send real-time Socket.IO notification to owner and admins
4. Update TrustScore atomically via `TrustScoreService.updateTrustScore()`
5. If critical: Auto-suspend marketplace listing, require manual verification

### 3.3 Blockchain Anchoring (Hashing + On-Chain Store)

**Step 1: Data Hashing**
```javascript
const recordData = {
  vin: "1HGBH41JXMN109186",
  mileage: 50000,
  timestamp: 1698739200000,
  deviceId: "OBD3001",
  source: "automated"
};
const recordHash = SHA256(JSON.stringify(recordData));
// Output: "a3b2c1d4e5f6..."
```

**Step 2: Solana Transaction Creation**
1. **Wallet:** Load payer keypair from encrypted storage
2. **Instruction:** Create Memo Program instruction with hash
   ```typescript
   const memoInstruction = new TransactionInstruction({
     keys: [],
     programId: MEMO_PROGRAM_ID,
     data: Buffer.from(recordHash)
   });
   ```
3. **Transaction:** Add instruction, set recent blockhash, sign with payer
4. **Submission:** Send to RPC with retry logic (timeout: 60s)

**Step 3: Confirmation & Storage**
1. Wait for transaction confirmation (`confirmed` commitment)
2. Extract transaction signature (e.g., `5Kj3b2N1M...`)
3. Save to MongoDB:
   - `MileageHistory.blockchainHash = signature`
   - `Vehicle.blockchainAddress = payer.publicKey`
   - Create `VehicleBlockchainHistory` document with full tx details
4. Emit Socket.IO event: `blockchainVerified` → Update frontend UI

**Step 4: IPFS/Arweave Storage**
1. Upload raw JSON telemetry to Arweave testnet (`testnet.redstone.tools`)
2. Receive Content ID (CID): `arweave:ABC123...`
3. Link CID to blockchain transaction in MongoDB
4. Store CID in vehicle document for retrieval

**Verification Process (Buyer/Regulator):**
1. Fetch transaction signature from MongoDB
2. Query Solana Explorer: `https://explorer.solana.com/tx/<signature>?cluster=devnet`
3. Verify memo matches stored hash
4. Retrieve raw data from Arweave using CID
5. Recompute hash, compare with on-chain value → Proof of authenticity

### 3.4 Vehicle Registration and Verification Flow

**Owner Registration:**
1. User registers as "owner" role → Creates `User` document
2. Navigate to "Register Vehicle" page
3. Input data:
   - VIN (17-char validation)
   - Make, model, year, color, fuel type, transmission
   - Current mileage (manual entry)
   - Upload photos (optional, stored on S3/Arweave)

**Backend Processing:**
1. Validate VIN format (A-Z excluding I,O,Q + 0-9, length 17)
2. Check for duplicate VIN in database
3. Create `Vehicle` document:
   ```javascript
   {
     vin: "1HGBH41JXMN109186",
     ownerId: userId,
     currentMileage: 50000,
     lastVerifiedMileage: 50000,
     trustScore: 100, // Initial score
     verificationStatus: "pending",
     ownershipHistory: [{
       ownerUserId: userId,
       fromDate: new Date(),
       note: "Initial registration"
     }]
   }
   ```
4. Create initial `MileageHistory` record (source: "owner")
5. Generate Solana wallet for vehicle (custodial)
6. Anchor registration transaction on blockchain

**Verification Status:**
- `pending` → Waiting for first OBD device reading
- `partial` → Has OBD data but no cross-validation
- `verified` → Multiple sources confirm mileage
- `flagged` → Fraud alert detected

**OBD Device Installation:**
1. Owner requests device installation → Creates `InstallationRequest`
2. Admin approves → Assigns available OBD device (status: "available")
3. Device shipped → Status: "shipped"
4. Owner installs → Connects to WiFi_OBDII, device auto-registers
5. First telemetry received → Vehicle status: "partial" → TrustScore: +5
6. After 7 days of consistent data → Status: "verified" → TrustScore: +10

### 3.5 Marketplace Listing, Buyer Request, and Ownership Transfer

**Listing Creation (Owner):**
1. Navigate to "My Vehicles" → Select vehicle → "List for Sale"
2. Input listing details:
   - Price (INR/USD)
   - Description (max 2000 chars)
   - Condition (excellent/good/fair/poor)
   - Features (leather seats, sunroof, etc.)
   - Availability (immediate/scheduled)
3. Backend validation:
   - TrustScore ≥ 50 (minimum for marketplace)
   - No active fraud alerts
   - Vehicle verified by OBD device
4. Create `Listing` document:
   ```javascript
   {
     vehicleId: vehicleId,
     sellerId: userId,
     price: 500000,
     status: "active",
     listingDate: new Date(),
     views: 0,
     inquiries: []
   }
   ```
5. Update `Vehicle.isForSale = true, listingStatus = "active"`
6. Generate marketplace permalink

**Buyer Discovery:**
1. Browse marketplace → Filter by make, model, price, TrustScore
2. View vehicle details:
   - Full mileage history chart (Recharts visualization)
   - TrustScore breakdown (last 7 events)
   - Fraud alerts (if any, with transparency)
   - Blockchain verification status (green badge)
   - Service history (if service providers recorded)
3. Click "View Full Report" → Comprehensive PDF/HTML report
4. Scan QR code → Instant verification via mobile

**Purchase Request:**
1. Buyer clicks "Request to Buy" → Creates `PurchaseRequest`:
   ```javascript
   {
     listingId: listingId,
     buyerId: buyerId,
     offerPrice: 480000, // Optional negotiation
     message: "Interested, can we schedule test drive?",
     status: "pending",
     requestedAt: new Date()
   }
   ```
2. Seller receives real-time Socket.IO notification
3. Seller reviews buyer profile (optional credit check integration)
4. Actions: "Accept", "Counter-Offer", "Reject"

**Ownership Transfer (Blockchain):**
1. Seller accepts purchase request → Status: "accepted"
2. Payment processing (escrow via `Escrow` model):
   - Buyer deposits funds → Escrow account
   - Smart contract locks funds (planned Solana program)
3. Transfer initiation:
   ```javascript
   POST /api/vehicles/:id/transfer-ownership
   Body: {
     newOwnerId: buyerId,
     salePrice: 480000,
     transferDate: "2025-11-01"
   }
   ```
4. Backend creates ownership transfer transaction:
   - Update `Vehicle.ownerId = buyerId`
   - Add to `ownershipHistory` array:
     ```javascript
     {
       ownerUserId: buyerId,
       fromDate: new Date(),
       txHash: "<solana_signature>",
       saleRecordId: saleRecordId,
       note: "Sold via VeriDrive marketplace"
     }
     ```
   - Create `SaleRecord` document with payment details
5. Blockchain transaction:
   - Transfer vehicle wallet custody to new owner
   - Record ownership change on Solana (memo with new owner pubkey)
6. Update OBD device mapping → New owner now receives telemetry
7. Notify both parties → Transfer complete
8. Escrow releases funds to seller

### 3.6 OBD Device Installation and Status Tracking

**Device Lifecycle:**

**Stage 1: Registration (Admin)**
1. Admin adds new device to inventory:
   ```javascript
   POST /api/admin/devices
   Body: {
     deviceID: "OBD4001",
     deviceType: "ESP32_Telematics",
     status: "available",
     hardwareVersion: "v2.1",
     firmwareVersion: "3.0.5"
   }
   ```
2. Device stored with status: `available`

**Stage 2: Installation Request (Owner)**
1. Owner requests installation:
   ```javascript
   POST /api/installation-requests
   Body: {
     vehicleId: vehicleId,
     preferredDate: "2025-11-05",
     installationType: "self_install"
   }
   ```
2. Creates `InstallationRequest` document (status: `pending`)

**Stage 3: Approval & Assignment (Admin)**
1. Admin reviews request → Approves
2. Assigns available device → Update `InstallationRequest.deviceId = "OBD4001"`
3. Device status: `available` → `assigned`
4. Device shipped → Status: `shipped`

**Stage 4: Installation (Owner/Service Provider)**
1. Owner receives device + installation guide
2. Plug device into OBD-II port (under steering wheel)
3. Device powers on → Connects to Veepeak WiFi
4. ESP32 firmware detects first connection → Auto-registers:
   ```javascript
   POST /api/device/status
   Body: {
     deviceID: "OBD4001",
     status: "device_not_connected", // First boot
     message: "Device registered, awaiting vehicle connection"
   }
   ```
5. Device status: `shipped` → `installed`

**Stage 5: Activation & Data Flow**
1. Device connects to vehicle ECU → Captures first telemetry
2. Sends full data payload:
   ```javascript
   {
     deviceID: "OBD4001",
     status: "obd_connected",
     vin: "1HGBH41JXMN109186",
     mileage: 50123,
     rpm: 850,
     speed: 0,
     engineTemp: 92,
     fuelLevel: 75,
     dataQuality: 80,
     odometerPID: "22F190"
   }
   ```
3. Backend links device to vehicle (match by VIN)
4. Device status: `installed` → `active`
5. Vehicle verification status: `pending` → `partial`

**Stage 6: Health Monitoring**
1. Device sends status every 2 minutes (configurable)
2. Backend tracks device health:
   - Last seen timestamp
   - Battery voltage (warning if <3.3V)
   - Boot count (detect repeated crashes)
   - Data quality score (0-100%)
3. Alerts on anomalies:
   - No data for >24 hours → "Device offline" notification
   - Battery low → "Replace device battery soon"
   - Repeated reboots → "Firmware issue detected"

**Stage 7: Maintenance & Deactivation**
1. Owner removes device → No telemetry for 48 hours → Auto-mark `inactive`
2. Admin can manually deactivate → Device status: `active` → `deactivated`
3. Device reassignment: Reset device, clear vehicle mapping, status: `available`

---

## 4. APIS AND DATA FLOW

### 4.1 Authentication APIs (`/api/auth`)

**POST /api/auth/register**
- **Input:** email, password, firstName, lastName, role, roleSpecificData
- **Validation:** Email uniqueness, password strength (8+ chars, uppercase, number, special)
- **Process:** Hash password (bcrypt, 10 rounds), create User document, generate JWT tokens
- **Output:** `{ success: true, tokens: { accessToken, refreshToken }, user: {...} }`

**POST /api/auth/login**
- **Input:** email, password, rememberMe (optional)
- **Validation:** Check email exists, verify password hash
- **Process:** Generate JWT (access: 1h, refresh: 7d if rememberMe), update lastLogin
- **Output:** `{ success: true, tokens: {...}, user: {...} }`

**POST /api/auth/refresh**
- **Input:** refreshToken
- **Validation:** Verify refresh token signature, check expiration
- **Process:** Generate new access token (1h), optionally rotate refresh token
- **Output:** `{ success: true, accessToken: "..." }`

**POST /api/auth/logout**
- **Input:** Authorization header (access token)
- **Process:** Invalidate refresh token (add to blacklist), clear session
- **Output:** `{ success: true, message: "Logged out successfully" }`

### 4.2 Vehicle APIs (`/api/vehicles`)

**GET /api/vehicles**
- **Auth:** Required (all roles)
- **Query Params:** page, limit, search, make, year, minPrice, maxPrice, minTrustScore
- **Process:** Query MongoDB with filters, populate owner details, sort by createdAt
- **Output:** `{ success: true, data: [...], pagination: {...} }`

**POST /api/vehicles**
- **Auth:** Owner role
- **Input:** vin, make, model, year, color, currentMileage, photos
- **Validation:** VIN format, duplicate check, mileage ≥ 0
- **Process:** Create Vehicle document, generate blockchain wallet, anchor registration tx
- **Output:** `{ success: true, vehicle: {...}, blockchainTx: "..." }`

**GET /api/vehicles/:id**
- **Auth:** Required
- **Process:** Fetch vehicle with populated mileage history (last 50 records), fraud alerts
- **Output:** `{ success: true, vehicle: {...}, mileageHistory: [...], fraudAlerts: [...] }`

**PUT /api/vehicles/:id**
- **Auth:** Owner (own vehicle) or Admin
- **Input:** Partial update fields (color, description, price, etc.)
- **Validation:** Cannot update VIN, ownerId (use transfer endpoint)
- **Process:** Update vehicle, log change in audit trail
- **Output:** `{ success: true, vehicle: {...} }`

**POST /api/vehicles/:id/list-for-sale**
- **Auth:** Owner
- **Input:** price, description, condition, features
- **Validation:** TrustScore ≥ 50, no active fraud alerts
- **Process:** Create Listing, update vehicle.isForSale = true
- **Output:** `{ success: true, listing: {...} }`

**POST /api/vehicles/:id/transfer-ownership**
- **Auth:** Owner (current owner) or Admin
- **Input:** newOwnerId, salePrice, transferDate, transferNotes
- **Validation:** New owner exists, not same as current owner
- **Process:**
  1. Update vehicle.ownerId
  2. Close current ownership record (set toDate)
  3. Create new ownership record
  4. Create SaleRecord
  5. Transfer blockchain custody
  6. Update OBD device mapping
  7. Send notifications
- **Output:** `{ success: true, vehicle: {...}, saleRecord: {...}, blockchainTx: "..." }`

### 4.3 Telemetry APIs (`/api/telemetry`)

**POST /api/device/status** (ESP32 endpoint)
- **Auth:** None (device-level authentication via deviceID + checksum)
- **Input:** deviceID, status, vin, mileage, rpm, speed, engineTemp, fuelLevel, dataQuality
- **Validation:** deviceID exists, mileage plausible, VIN format
- **Process:**
  1. Find or create Device document
  2. Create VehicleTelemetry document
  3. Link device to vehicle (by VIN)
  4. Run fraud detection algorithms
  5. Update vehicle.currentMileage if newer
  6. Create MileageHistory record
  7. Update TrustScore (+2 for consistent data, -15 for fraud)
  8. Anchor to blockchain (async job)
  9. Emit Socket.IO events
- **Output:** `{ success: true, telemetry: {...}, fraudAlerts: [...], trustScore: 98 }`

**GET /api/telemetry/latest-obd/:vehicleId**
- **Auth:** Owner (own vehicle), Service Provider, Admin
- **Process:** Fetch latest 1 VehicleTelemetry record for vehicle
- **Output:** `{ success: true, telemetry: {...} }`

**GET /api/telemetry/history/:vehicleId**
- **Auth:** Required
- **Query Params:** startDate, endDate, source, limit
- **Process:** Query VehicleTelemetry, filter by date range, populate recordedBy
- **Output:** `{ success: true, history: [...], stats: {...} }`

### 4.4 Marketplace APIs (`/api/marketplace`)

**GET /api/marketplace/listings**
- **Auth:** Optional (public endpoint)
- **Query Params:** make, model, minPrice, maxPrice, minTrustScore, location, radius
- **Process:** Query active listings, populate vehicle + seller details, filter by criteria
- **Output:** `{ success: true, listings: [...], total: 45 }`

**GET /api/marketplace/listings/:id**
- **Auth:** Optional
- **Process:** Fetch listing with full vehicle history, increment views counter
- **Output:** `{ success: true, listing: {...}, vehicle: {...}, seller: {...} }`

**POST /api/marketplace/purchase-request**
- **Auth:** Buyer role
- **Input:** listingId, offerPrice, message
- **Validation:** Listing active, buyer not seller, offer ≥ minimum price
- **Process:** Create PurchaseRequest, notify seller via Socket.IO + email
- **Output:** `{ success: true, request: {...} }`

**PUT /api/marketplace/purchase-request/:id/respond**
- **Auth:** Seller (listing owner)
- **Input:** action ("accept" | "counter" | "reject"), counterOfferPrice, message
- **Process:** Update PurchaseRequest status, notify buyer
- **Output:** `{ success: true, request: {...} }`

### 4.5 Blockchain APIs (`/api/blockchain`)

**POST /api/blockchain/register-vehicle**
- **Auth:** Owner or Admin
- **Input:** vehicleId
- **Process:**
  1. Fetch vehicle details
  2. Create Solana wallet (custodial)
  3. Request devnet airdrop (0.1 SOL)
  4. Create memo transaction with VIN + initial mileage
  5. Confirm transaction
  6. Save signature to vehicle.blockchainHash
- **Output:** `{ success: true, txSignature: "...", explorerUrl: "..." }`

**POST /api/blockchain/record-mileage**
- **Auth:** System (internal, called by telemetry service)
- **Input:** mileageHistoryId
- **Process:**
  1. Fetch mileage record
  2. Generate SHA-256 hash of record
  3. Create memo transaction
  4. Confirm and save signature
- **Output:** `{ success: true, txSignature: "..." }`

**GET /api/blockchain/verify/:vehicleId**
- **Auth:** Optional (public verification)
- **Process:**
  1. Fetch vehicle.blockchainHash
  2. Query Solana RPC for transaction details
  3. Extract memo data, compare with stored hash
  4. Return verification status
- **Output:** `{ success: true, verified: true, transaction: {...} }`

**GET /api/blockchain/history/:vehicleId**
- **Auth:** Required
- **Process:** Fetch all blockchain transactions for vehicle from MongoDB
- **Output:** `{ success: true, transactions: [...] }`

### 4.6 Admin APIs (`/api/admin`)

**GET /api/admin/users**
- **Auth:** Admin role
- **Query Params:** role, status, search, page, limit
- **Process:** Query users, filter by role/status, paginate
- **Output:** `{ success: true, users: [...], total: 120 }`

**PUT /api/admin/users/:id/status**
- **Auth:** Admin role
- **Input:** status ("active" | "suspended" | "banned")
- **Process:** Update user.status, log action in audit trail, revoke tokens if suspended
- **Output:** `{ success: true, user: {...} }`

**GET /api/admin/fraud-alerts**
- **Auth:** Admin role
- **Query Params:** severity, status, alertType, vehicleId, page
- **Process:** Query FraudAlert, populate vehicle + reporter details
- **Output:** `{ success: true, alerts: [...], total: 23 }`

**PUT /api/admin/fraud-alerts/:id/resolve**
- **Auth:** Admin role
- **Input:** resolution ("resolved" | "false_positive"), investigationNotes
- **Process:** Update FraudAlert status, adjust TrustScore if false positive, notify owner
- **Output:** `{ success: true, alert: {...} }`

**POST /api/admin/trustscore/manual-adjust**
- **Auth:** Admin role
- **Input:** vehicleId, change, reason
- **Validation:** change between -50 and +50
- **Process:** Call TrustScoreService.updateTrustScore with source: "admin"
- **Output:** `{ success: true, newScore: 85, eventId: "..." }`

**GET /api/admin/analytics**
- **Auth:** Admin role
- **Process:** Aggregate stats (total vehicles, active devices, fraud alerts, avg TrustScore)
- **Output:** `{ success: true, stats: {...} }`

---

## 5. DATABASE MODELS (MongoDB/Mongoose)

### 5.1 User Model
```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  firstName: String,
  lastName: String,
  phoneNumber: String,
  role: Enum ["admin", "owner", "buyer", "service", "insurance", "government"],
  roles: Array<String>, // Multi-role support
  status: Enum ["active", "suspended", "banned"],
  isEmailVerified: Boolean,
  termsAccepted: Boolean,
  privacyAccepted: Boolean,
  
  // Role-specific data
  roleSpecificData: {
    // Owner
    licenseNumber: String,
    licenseExpiry: Date,
    vehiclesOwned: Array<ObjectId>,
    devicesRegistered: Array<ObjectId>,
    verificationLevel: Enum ["basic", "verified", "premium"],
    trackingConsent: Boolean,
    
    // Service Provider
    businessName: String,
    businessType: Enum ["mechanic", "dealership", "inspection"],
    licenseNumber: String,
    serviceCategories: Array<String>,
    certificationsHeld: Array<String>,
    serviceRadius: Number,
    
    // Admin
    adminLevel: Enum ["super", "moderator", "support"],
    permissions: Array<String>,
    departments: Array<String>
  },
  
  // Blockchain
  walletAddress: String,
  walletSecretKey: Buffer (encrypted),
  walletBalance: Number,
  
  // Metadata
  lastLogin: Date,
  loginHistory: Array<{timestamp, ipAddress, userAgent}>,
  refreshTokens: Array<String>,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** email (unique), role, status, walletAddress

### 5.2 Vehicle Model
```javascript
{
  vin: String (unique, required, 17 chars),
  vehicleNumber: String (registration plate),
  ownerId: ObjectId → User,
  make: String,
  vehicleModel: String,
  year: Number,
  color: String,
  bodyType: Enum ["sedan", "suv", "hatchback", "truck", "coupe"],
  fuelType: Enum ["petrol", "diesel", "electric", "hybrid"],
  transmission: Enum ["manual", "automatic", "cvt"],
  engineSize: String,
  
  // Mileage tracking
  currentMileage: Number (required, ≥0),
  lastVerifiedMileage: Number,
  lastMileageUpdate: Date,
  mileageHistory: Array<ObjectId> → MileageHistory,
  
  // Trust & verification
  trustScore: Number (0-100, default 100),
  lastTrustScoreUpdate: Date,
  verificationStatus: Enum ["pending", "partial", "verified", "flagged"],
  fraudAlerts: Array<ObjectId> → FraudAlert,
  
  // Marketplace
  isForSale: Boolean,
  listingStatus: Enum ["not_listed", "active", "pending", "sold"],
  price: Number,
  description: String (max 2000 chars),
  features: Array<String>,
  condition: Enum ["excellent", "good", "fair", "poor"],
  
  // Service & history
  accidentHistory: Array<{date, description, severity, repairCost}>,
  serviceHistory: Array<ObjectId> → ServiceRecord,
  lastServiceDate: Date,
  nextServiceDue: Date,
  
  // Documents
  registrationExpiry: Date,
  insuranceExpiry: Date,
  documents: Array<ObjectId> → VehicleDocument,
  
  // Blockchain
  blockchainHash: String (latest transaction signature),
  blockchainAddress: String (Solana wallet pubkey),
  
  // Ownership
  ownershipHistory: Array<{
    ownerUserId: ObjectId,
    ownerWallet: String,
    fromDate: Date,
    toDate: Date (null if current),
    txHash: String,
    saleRecordId: ObjectId,
    note: String
  }>,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** vin (unique), ownerId, make, year, trustScore, isForSale, blockchainAddress

### 5.3 MileageHistory Model
```javascript
{
  vehicleId: ObjectId → Vehicle (required, indexed),
  vin: String (required, indexed),
  mileage: Number (required, 0-9999999),
  recordedBy: ObjectId → User (required),
  recordedAt: Date (required, indexed),
  source: Enum ["owner", "service", "inspection", "government", "automated"],
  
  location: {
    latitude: Number (-90 to 90),
    longitude: Number (-180 to 180),
    accuracy: Number,
    timestamp: Date
  },
  
  notes: String (max 500 chars),
  verified: Boolean (default false),
  blockchainHash: String (Solana tx signature),
  deviceId: String,
  photo: String (URL),
  
  // Anti-fraud fields
  previousMileage: Number,
  mileageIncrease: Number (auto-calculated),
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** 
- Compound: (vehicleId, recordedAt DESC)
- Compound: (vin, recordedAt DESC)
- Compound: (source, verified)
- Single: blockchainHash (sparse)

**Pre-save Middleware:** Auto-capitalize VIN, calculate mileageIncrease, auto-verify government sources

### 5.4 FraudAlert Model
```javascript
{
  vehicleId: ObjectId → Vehicle (required, indexed),
  telemetryId: ObjectId → VehicleTelemetry,
  alertType: Enum [
    "odometer_rollback",
    "title_washing",
    "duplicate_vin",
    "stolen_vehicle",
    "flood_damage",
    "other"
  ],
  severity: Enum ["low", "medium", "high", "critical"],
  description: String (required, max 1000 chars),
  reportedBy: ObjectId → User,
  reportedAt: Date (default now),
  status: Enum ["active", "investigating", "resolved", "false_positive"],
  evidence: Array<String> (URLs),
  investigationNotes: String (max 2000 chars),
  resolvedAt: Date,
  resolvedBy: ObjectId → User,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- Compound: (vehicleId, status)
- Compound: (alertType, severity)
- Single: reportedAt DESC

### 5.5 TrustEvent Model
```javascript
{
  vehicleId: ObjectId → Vehicle (required, indexed),
  change: Number (required, -100 to +100),
  previousScore: Number (0-100),
  newScore: Number (0-100),
  reason: String (required, max 200 chars),
  details: Object (flexible schema for event-specific data),
  source: Enum ["telemetry", "admin", "manual", "fraudEngine", "anchor"],
  createdBy: ObjectId → User,
  
  createdAt: Date (required, indexed)
}
```

**Indexes:**
- Compound: (vehicleId, createdAt DESC)
- Single: source

**Purpose:** Event-sourcing pattern for TrustScore changes, ensures auditability and prevents score manipulation

### 5.6 Device Model
```javascript
{
  deviceID: String (unique, required),
  deviceType: Enum ["ESP32_Telematics", "OBD_Dongle", "Custom"],
  status: Enum ["available", "assigned", "shipped", "installed", "active", "inactive", "deactivated"],
  vehicleId: ObjectId → Vehicle,
  assignedTo: ObjectId → User,
  
  configuration: {
    selectedVehicle: Number (1=Hyundai, 2=Maruti, 3=Manual, 4=Auto, 99=Discovery),
    sleepDurationMinutes: Number,
    maxRetryAttempts: Number,
    enableDataBuffering: Boolean,
    enableSSL: Boolean
  },
  
  health: {
    lastSeen: Date,
    batteryVoltage: Number,
    bootCount: Number,
    dataQuality: Number (0-100),
    firmwareVersion: String
  },
  
  installationRequest: {
    requestedBy: ObjectId → User,
    requestedAt: Date,
    approvedBy: ObjectId → User,
    approvedAt: Date,
    priority: Enum ["low", "medium", "high"]
  },
  
  registeredAt: Date,
  installedAt: Date,
  lastMaintenanceDate: Date,
  isActive: Boolean,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** deviceID (unique), vehicleId, status, assignedTo

### 5.7 VehicleTelemetry Model
```javascript
{
  vehicleId: ObjectId → Vehicle (required, indexed),
  deviceId: String (required, indexed),
  vin: String (indexed),
  
  // OBD-II data
  mileage: Number,
  rpm: Number,
  speed: Number,
  engineTemp: Number,
  fuelLevel: Number,
  batteryVoltage: Number,
  odometerPID: String,
  
  // Quality metrics
  dataQuality: Number (0-100),
  dataSource: Enum ["veepeak_obd", "device_status", "manual"],
  
  // Anti-fraud
  tamperingDetected: Boolean,
  validationStatus: String,
  alternateOdometerReading: Number,
  alternateOdometerPID: String,
  
  // Metadata
  recordedBy: ObjectId → User,
  recordedAt: Date (indexed),
  bootCount: Number,
  
  createdAt: Date
}
```

**Indexes:**
- Compound: (vehicleId, recordedAt DESC)
- Compound: (deviceId, recordedAt DESC)
- Single: vin

### 5.8 Listing Model (Marketplace)
```javascript
{
  vehicleId: ObjectId → Vehicle (required, unique),
  sellerId: ObjectId → User (required),
  price: Number (required, ≥0),
  description: String (max 2000 chars),
  condition: Enum ["excellent", "good", "fair", "poor"],
  features: Array<String>,
  status: Enum ["active", "pending", "sold", "cancelled"],
  listingDate: Date (default now),
  views: Number (default 0),
  inquiries: Array<{userId, message, timestamp}>,
  
  // Availability
  availabilityStatus: Enum ["immediate", "scheduled"],
  availableFrom: Date,
  
  // Metadata
  lastUpdated: Date,
  soldDate: Date,
  soldPrice: Number,
  buyerId: ObjectId → User,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** vehicleId (unique), sellerId, status, price, listingDate DESC

### 5.9 PurchaseRequest Model
```javascript
{
  listingId: ObjectId → Listing (required),
  vehicleId: ObjectId → Vehicle (required),
  buyerId: ObjectId → User (required),
  sellerId: ObjectId → User (required),
  
  offerPrice: Number,
  message: String (max 1000 chars),
  status: Enum ["pending", "accepted", "rejected", "counter_offered", "cancelled"],
  
  counterOfferPrice: Number,
  counterOfferMessage: String,
  
  requestedAt: Date (default now),
  respondedAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** listingId, buyerId, sellerId, status

### 5.10 VehicleBlockchainHistory Model
```javascript
{
  vehicleId: ObjectId → Vehicle (required, indexed),
  transactionType: Enum ["registration", "mileage_update", "ownership_transfer", "verification"],
  transactionHash: String (Solana signature, indexed),
  blockchainNetwork: Enum ["solana_devnet", "solana_mainnet"],
  
  data: {
    vin: String,
    mileage: Number,
    previousMileage: Number,
    previousOwner: String,
    newOwner: String,
    recordHash: String (SHA-256)
  },
  
  status: Enum ["pending", "confirmed", "failed"],
  confirmations: Number,
  blockNumber: Number,
  
  arweaveId: String (CID for raw data),
  explorerUrl: String,
  
  createdAt: Date (transaction timestamp)
}
```

**Indexes:** vehicleId, transactionHash, transactionType, createdAt DESC

---

## 6. BLOCKCHAIN INTERACTION

### 6.1 What Data is Written to Solana

**Transaction Types:**

1. **Vehicle Registration:**
   ```javascript
   Memo: {
     type: "VEHICLE_REGISTRATION",
     vin: "1HGBH41JXMN109186",
     initialMileage: 50000,
     registeredAt: 1698739200000,
     owner: "CtYWVs8w7yJqKnL..." (Solana pubkey)
   }
   ```
   - **When:** First-time vehicle registration on platform
   - **Cost:** ~0.000005 SOL (devnet: free)

2. **Mileage Update:**
   ```javascript
   Memo: {
     type: "MILEAGE_UPDATE",
     vin: "1HGBH41JXMN109186",
     previousMileage: 50000,
     newMileage: 50123,
     timestamp: 1698825600000,
     source: "automated",
     deviceId: "OBD3001",
     recordHash: "a3b2c1d4e5f6..." (SHA-256)
   }
   ```
   - **When:** Every 10th telemetry data point (batching to reduce costs)
   - **Cost:** ~0.000005 SOL per transaction

3. **Ownership Transfer:**
   ```javascript
   Memo: {
     type: "OWNERSHIP_TRANSFER",
     vin: "1HGBH41JXMN109186",
     previousOwner: "CtYWVs8w7yJqKnL...",
     newOwner: "9gZM3k2FwQxY1pN...",
     transferDate: 1698912000000,
     salePrice: 500000,
     saleRecordId: "671abc123..."
   }
   ```
   - **When:** Vehicle ownership changes hands
   - **Cost:** ~0.000005 SOL

4. **Fraud Alert:**
   ```javascript
   Memo: {
     type: "FRAUD_ALERT",
     vin: "1HGBH41JXMN109186",
     alertType: "odometer_rollback",
     severity: "critical",
     detectedAt: 1698998400000,
     evidence: "ipfs://Qm..."
   }
   ```
   - **When:** Critical fraud detection (rollback, stolen vehicle)
   - **Cost:** ~0.000005 SOL

### 6.2 What Hash is Stored

**SHA-256 Hash Generation:**
```javascript
// Canonical data format for hashing
const canonicalData = {
  vin: vehicle.vin,
  mileage: mileageRecord.mileage,
  timestamp: mileageRecord.recordedAt.getTime(),
  deviceId: device.deviceID,
  source: mileageRecord.source,
  previousMileage: mileageRecord.previousMileage
};

// Sort keys for deterministic hashing
const sortedData = JSON.stringify(canonicalData, Object.keys(canonicalData).sort());

// Generate SHA-256 hash
const recordHash = crypto.createHash('sha256').update(sortedData).digest('hex');
// Output: "a3b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"
```

**Storage Locations:**
1. **On-chain (Solana Memo):** Only the hash (32 bytes)
2. **Off-chain (MongoDB):** Full canonical data + hash
3. **Decentralized Storage (Arweave):** Raw telemetry JSON + metadata

**Verification Process:**
1. Retrieve full data from MongoDB
2. Recompute hash using same canonical format
3. Fetch Solana transaction by signature
4. Extract memo data, compare hashes
5. If match → Data integrity confirmed
6. Optionally fetch raw data from Arweave, hash, and triple-verify

### 6.3 How Verification Happens

**Buyer Verification Workflow:**

**Step 1: Access Vehicle Report**
```javascript
GET /api/marketplace/listings/:id
→ Returns vehicle with blockchainHash field
```

**Step 2: Verify on Blockchain**
```javascript
GET /api/blockchain/verify/:vehicleId
```

Backend Process:
1. Fetch `Vehicle.blockchainHash` (latest mileage update signature)
2. Query Solana RPC:
   ```javascript
   const tx = await connection.getTransaction(blockchainHash, {
     commitment: 'confirmed'
   });
   ```
3. Extract memo instruction data from transaction
4. Parse memo JSON, extract stored hash
5. Fetch corresponding `MileageHistory` record from MongoDB
6. Recompute hash from stored data
7. Compare:
   - `recomputedHash === memoHash` → ✅ Verified
   - `recomputedHash !== memoHash` → ❌ Data tampered

**Step 3: Cross-Reference Arweave**
```javascript
GET /api/blockchain/arweave/:vehicleId
```

Backend Process:
1. Fetch `VehicleBlockchainHistory.arweaveId` (CID)
2. Retrieve raw JSON from Arweave:
   ```javascript
   const response = await axios.get(`https://arweave.net/${arweaveId}`);
   ```
3. Hash raw data, compare with on-chain hash
4. Ensures both MongoDB and blockchain records match original telemetry

**Public Verification (QR Code):**
1. Vehicle details page displays QR code
2. Scan QR → Opens `https://blockx.netlify.app/verify?vin=<VIN>`
3. Public verification endpoint (no auth required)
4. Displays:
   - ✅ Verified on Solana (with explorer link)
   - Last verified mileage: 50,123 km
   - Last update: 2025-10-28 14:30 UTC
   - TrustScore: 95/100
   - Fraud alerts: None

### 6.4 How Fraud Detection Integrates with Blockchain

**Integration Points:**

1. **Pre-Blockchain Validation:**
   - Fraud detection runs BEFORE blockchain submission
   - If rollback detected → Do not anchor to blockchain
   - Create FraudAlert, update TrustScore, notify owner
   - Blockchain only stores verified, non-fraudulent data

2. **Blockchain-Based Fraud Detection:**
   - Query historical blockchain transactions for vehicle
   - Compare on-chain mileage progression with current claim
   - Example:
     ```
     Blockchain history: 50,000 → 50,123 → 50,456 km
     New claim: 49,500 km → Rollback detected
     ```
   - Blockchain acts as immutable reference point

3. **TrustScore Blockchain Anchoring:**
   - Major TrustScore changes (≥10 points) are recorded on-chain
   - Creates transparency: Buyers see verified trust history
   - Format:
     ```javascript
     Memo: {
       type: "TRUST_EVENT",
       vin: "1HGBH41JXMN109186",
       change: -15,
       reason: "Odometer rollback detected",
       previousScore: 100,
       newScore: 85,
       timestamp: 1698998400000
     }
     ```

4. **Fraud Alert Blockchain Record:**
   - Critical fraud alerts (rollback, stolen) are written to blockchain
   - Permanent public record visible to all buyers
   - Cannot be deleted or hidden by owner

**Fraud Detection Algorithm (Backend):**
```javascript
// fraud-detection.service.ts
async function detectFraud(vehicleId, newMileage, previousMileage, timeDelta) {
  const fraudAlerts = [];
  
  // 1. Rollback Detection
  if (newMileage < previousMileage - 5) {
    fraudAlerts.push({
      type: "odometer_rollback",
      severity: "critical",
      description: `Mileage decreased from ${previousMileage} to ${newMileage}`,
      evidence: [blockchainTxLink]
    });
    await TrustScoreService.updateTrustScore({
      vehicleId,
      change: -15,
      reason: "Odometer rollback detected",
      source: "fraudEngine"
    });
  }
  
  // 2. Impossible Distance
  const hoursElapsed = timeDelta / (1000 * 60 * 60);
  const distanceIncrease = newMileage - previousMileage;
  const avgSpeed = distanceIncrease / hoursElapsed;
  
  if (avgSpeed > 120) { // Max 120 km/h sustained average
    fraudAlerts.push({
      type: "impossible_distance",
      severity: "high",
      description: `Distance increase of ${distanceIncrease} km in ${hoursElapsed.toFixed(1)} hours (avg ${avgSpeed.toFixed(1)} km/h)`,
      evidence: []
    });
    await TrustScoreService.updateTrustScore({
      vehicleId,
      change: -10,
      reason: "Impossible distance increase",
      source: "fraudEngine"
    });
  }
  
  // 3. PID Inconsistency
  const secondaryMileage = await getAlternateOdometerReading(vehicleId);
  if (secondaryMileage && Math.abs(newMileage - secondaryMileage) / newMileage > 0.05) {
    fraudAlerts.push({
      type: "pid_inconsistency",
      severity: "medium",
      description: `Primary PID: ${newMileage} km, Secondary PID: ${secondaryMileage} km (${((Math.abs(newMileage - secondaryMileage) / newMileage) * 100).toFixed(1)}% difference)`,
      evidence: []
    });
    await TrustScoreService.updateTrustScore({
      vehicleId,
      change: -5,
      reason: "PID inconsistency detected",
      source: "fraudEngine"
    });
  }
  
  // 4. Blockchain History Validation
  const blockchainHistory = await getBlockchainMileageHistory(vehicleId);
  const lastBlockchainMileage = blockchainHistory[0]?.mileage;
  
  if (lastBlockchainMileage && newMileage < lastBlockchainMileage) {
    fraudAlerts.push({
      type: "blockchain_mismatch",
      severity: "critical",
      description: `New mileage (${newMileage} km) is less than last blockchain-verified mileage (${lastBlockchainMileage} km)`,
      evidence: [blockchainHistory[0].explorerUrl]
    });
    await TrustScoreService.updateTrustScore({
      vehicleId,
      change: -20,
      reason: "Blockchain history violation",
      source: "fraudEngine"
    });
  }
  
  return fraudAlerts;
}
```

---

## 7. SECURITY FEATURES

### 7.1 JWT Authentication
- **Algorithm:** HS256 (HMAC SHA-256)
- **Token Types:**
  - Access Token: 1 hour expiry, contains userId, role, email
  - Refresh Token: 7 days expiry (30 days if rememberMe), stored in DB for revocation
- **Secret Rotation:** JWT_SECRET and JWT_REFRESH_SECRET configurable via env
- **Blacklisting:** Refresh tokens invalidated on logout, stored in `User.refreshTokens` array

### 7.2 Cryptographic Validation
- **Password Hashing:** bcrypt with 10 salt rounds
- **Data Hashing:** SHA-256 for blockchain anchoring
- **VIN Validation:** Regex pattern, checksum algorithm (ISO 3779)
- **Device Authentication:** Unique deviceID + checksum verification (planned)

### 7.3 Secure OBD Communication
- **Protocol:** OBD-II over CAN (ISO 15765-4)
- **Transport:** HTTPS for cellular data transmission
- **Encryption:** TLS 1.2+ for all ESP32 → Backend communication
- **Buffering:** Local SPIFFS storage with integrity checks (checksums)
- **Anti-Tampering:** Cross-PID validation, impossible distance algorithms, local rollback detection

### 7.4 Role-Based Access Control (RBAC)
- **Middleware:** `auth.middleware.ts` validates JWT + role
- **Route Protection:**
  - `/api/admin/*` → Admin role only
  - `/api/vehicles/:id` → Owner (self) or Admin
  - `/api/marketplace/*` → Public read, Buyer write
- **Multi-Role Support:** Users can have multiple roles (e.g., `["owner", "buyer"]`)
- **Active Role Header:** `X-Active-Role` header specifies current context

### 7.5 Data Privacy (GDPR Compliance)
- **PII Handling:** No personally identifiable info on blockchain (only hashes)
- **User Consent:** `termsAccepted`, `privacyAccepted` flags required
- **Right to Deletion:** Off-chain data (MongoDB) deletable, blockchain immutable (hash only)
- **Data Minimization:** Only essential data stored on-chain
- **Pseudonymization:** Wallet addresses instead of user names in public records

### 7.6 API Security
- **Rate Limiting:** 100 requests/15 minutes per IP (configurable)
- **Input Validation:** Joi schemas for all endpoints
- **SQL Injection Prevention:** NoSQL injection sanitization via `express-mongo-sanitize`
- **XSS Protection:** Helmet.js CSP headers
- **CORS:** Whitelist-based CORS (only allowed origins)
- **HPP Protection:** HTTP Parameter Pollution prevention via `hpp` middleware

### 7.7 Blockchain Security
- **Custodial Wallets:** Private keys encrypted with AES-256, stored in MongoDB
- **Transaction Signing:** Server-side signing (no client-side private key exposure)
- **Replay Attack Prevention:** Transaction nonce + recent blockhash
- **Front-Running Protection:** Fixed transaction order in batch processing

---

## 8. DEPLOYMENT FLOW

### 8.1 Local Development Setup

**Prerequisites:**
- Node.js 18+ (LTS)
- MongoDB 6.0+ (local or Atlas)
- Git

**Backend Setup:**
```bash
# 1. Clone repository
git clone https://github.com/yourusername/BlockX-Hackathon.git
cd BlockX-Hackathon/backend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
# Edit .env with your configuration:
# MONGODB_URI=mongodb://localhost:27017/veridrive
# JWT_SECRET=your-secret-key
# JWT_REFRESH_SECRET=your-refresh-secret
# PORT=5000
# NODE_ENV=development
# FRONTEND_URL=http://localhost:5173
# CORS_ORIGIN=http://localhost:5173

# 4. Start development server
npm run dev
# Server runs on http://localhost:5000
```

**Frontend Setup:**
```bash
cd ../frontend

# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env
# Edit .env:
# VITE_API_BASE_URL=http://localhost:5000/api
# VITE_SOCKET_URL=http://localhost:5000

# 3. Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

**ESP32 Setup:**
```bash
# 1. Open Arduino IDE
# 2. Install ESP32 board package (Tools → Board Manager → ESP32 by Espressif)
# 3. Install libraries: WiFi, ELMduino, ArduinoJson, SPIFFS
# 4. Open esp32Code/ESP32_EC200U_Backend_TCP/ESP32_EC200U_Backend_TCP.ino
# 5. Configure WiFi + server host in code
# 6. Select board: ESP32 Dev Module
# 7. Upload to device
```

### 8.2 Vercel Deployment (Backend)

**Step 1: Prepare for Serverless**
- Backend uses `serverless-http` wrapper in `api/index.ts`
- `vercel.json` configured:
  ```json
  {
    "version": 2,
    "builds": [{"src": "api/index.ts", "use": "@vercel/node"}],
    "routes": [{"src": "/(.*)", "dest": "/api/index.ts"}]
  }
  ```

**Step 2: Install Vercel CLI**
```bash
npm install -g vercel
vercel login
```

**Step 3: Configure Environment Variables**
- Navigate to Vercel dashboard → Project Settings → Environment Variables
- Add required variables:
  ```
  MONGODB_URI=mongodb+srv://...
  JWT_SECRET=...
  JWT_REFRESH_SECRET=...
  NODE_ENV=production
  FRONTEND_URL=https://blockx.netlify.app
  CORS_ORIGIN=https://blockx.netlify.app
  SOLANA_RPC_URL=https://api.devnet.solana.com
  ```

**Step 4: Deploy**
```bash
cd backend
vercel --prod
# Output: https://block-x-two.vercel.app
```

**Step 5: Verify Deployment**
```bash
curl https://block-x-two.vercel.app/api/health
# Expected: {"status":"success","message":"API is healthy"}
```

### 8.3 Netlify Deployment (Frontend)

**Step 1: Configure Build Settings**
- `netlify.toml` already configured:
  ```toml
  [build]
    command = "npm run build"
    publish = "dist"
  
  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```

**Step 2: Connect to Git**
1. Push code to GitHub
2. Login to Netlify → New Site from Git
3. Select repository: `BlockX-Hackathon`
4. Build command: `npm run build`
5. Publish directory: `dist`

**Step 3: Configure Environment Variables**
- Netlify dashboard → Site Settings → Environment Variables
- Add:
  ```
  VITE_API_BASE_URL=https://block-x-two.vercel.app/api
  VITE_SOCKET_URL=https://block-x-two.vercel.app
  ```

**Step 4: Deploy**
```bash
git push origin main
# Netlify auto-deploys from main branch
# Output: https://blockx.netlify.app
```

**Step 5: Custom Domain (Optional)**
- Netlify dashboard → Domain Settings → Add custom domain
- Configure DNS: CNAME record pointing to Netlify

### 8.4 MongoDB Atlas Setup

**Step 1: Create Cluster**
1. Sign up at mongodb.com/cloud/atlas
2. Create free M0 cluster (512 MB storage)
3. Select cloud provider: AWS (or GCP/Azure)
4. Region: US East (or closest to users)

**Step 2: Configure Network Access**
- IP Whitelist: Add `0.0.0.0/0` (allow from anywhere)
- Or restrict to Vercel IP ranges (recommended for production)

**Step 3: Create Database User**
- Database Access → Add New User
- Username: `veridrive`
- Password: Auto-generate (save securely)
- Privileges: Read and write to any database

**Step 4: Get Connection String**
```
mongodb+srv://veridrive:<password>@cluster0.abc123.mongodb.net/veridrive?retryWrites=true&w=majority
```
- Replace `<password>` with actual password
- Use this as `MONGODB_URI` in Vercel env vars

### 8.5 CORS Configuration

**Backend (app.ts):**
```javascript
const allowedOrigins = [
  'https://blockx.netlify.app',
  'https://block-x-frontend.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Active-Role']
}));
```

**Frontend (services/api.ts):**
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

---

## 9. ERROR HANDLING AND KNOWN ISSUES

### 9.1 Duplicate Mongoose Indexes

**Issue:** MongoDB returns duplicate index errors on startup:
```
MongoServerError: Index with name: blockchainHash_1 already exists with different options
```

**Cause:** Schema index definitions changed, but old indexes remain in MongoDB

**Solution:**
```bash
# Connect to MongoDB
mongo mongodb+srv://...

# Drop old indexes
use veridrive
db.mileagehistory.dropIndex("blockchainHash_1")
db.vehicles.dropIndex("blockchainAddress_1")

# Restart backend → Indexes recreated correctly
```

**Prevention:** Use MongoDB migrations for schema changes (future enhancement)

### 9.2 Solana Payer Balance Insufficient

**Issue:** Blockchain transactions fail with:
```
SendTransactionError: Attempt to debit an account but found no record of a prior credit.
```

**Cause:** Payer wallet has 0 SOL balance (devnet airdrop limits or rate limiting)

**Solution (Devnet):**
```javascript
// Request airdrop programmatically
const airdropSignature = await connection.requestAirdrop(
  payerPublicKey,
  2 * LAMPORTS_PER_SOL // 2 SOL
);
await connection.confirmTransaction(airdropSignature);
```

**Alternative:** Use Solana Faucet (https://faucet.solana.com) for devnet SOL

**Production Fix:** Fund payer wallet with real SOL, implement auto-refill logic

### 9.3 SendTransactionError: Blockhash Not Found

**Issue:** Transaction submission fails:
```
TransactionExpiredBlockheightExceededError: Signature ... has expired: block height exceeded.
```

**Cause:** Blockhash expired before transaction confirmation (150 blocks = ~90 seconds)

**Solution:**
```javascript
// Use recent blockhash with retry logic
async function sendTransactionWithRetry(transaction, connection, signer, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Get fresh blockhash for each attempt
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      
      // Sign and send
      transaction.sign(signer);
      const signature = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: false,
        maxRetries: 3
      });
      
      // Confirm with timeout
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');
      
      return signature;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
}
```

### 9.4 Frontend-Backend URL Mismatch

**Issue:** API calls fail with:
```
AxiosError: Network Error
```

**Cause:** `VITE_API_BASE_URL` in frontend .env doesn't match deployed backend URL

**Check:**
```bash
# Frontend .env
VITE_API_BASE_URL=https://block-x-two.vercel.app/api

# Netlify Environment Variables (Site Settings → Environment Variables)
VITE_API_BASE_URL=https://block-x-two.vercel.app/api
```

**Solution:** Ensure both local .env AND Netlify env vars are correct, redeploy frontend

### 9.5 Socket.IO Connection Refused

**Issue:** Real-time notifications don't work:
```
WebSocket connection to 'wss://...' failed
```

**Cause:** Socket.IO not initialized on Vercel serverless (serverless functions don't support WebSockets)

**Current Limitation:** Vercel serverless functions are stateless, cannot maintain WebSocket connections

**Workaround:**
1. **Use Polling:** Socket.IO falls back to HTTP long-polling (slower but functional)
2. **Deploy on Render.com:** Use traditional server for Socket.IO
3. **Use Pusher/Ably:** Third-party real-time service (paid)

**Future Solution:** Migrate to Vercel Edge Functions (supports WebSockets) or deploy backend on Render

### 9.6 ESP32 WiFi Connection Timeout

**Issue:** ESP32 fails to connect to Veepeak:
```
❌ Failed to connect to WiFi_OBDII
```

**Causes:**
1. Veepeak device not powered on
2. WiFi password incorrect (some Veepeak models require password)
3. ESP32 too far from Veepeak (range: <10 meters)

**Solution:**
```cpp
// ESP32 code: Increase connection timeout
WiFi.begin(config.veepeakSSID, config.veepeakPassword);
unsigned long start = millis();
while (WiFi.status() != WL_CONNECTED && (millis() - start) < 30000) {
  delay(500);
  SerialMon.print(".");
}
```

**Debugging:**
```cpp
// Add WiFi diagnostics
if (WiFi.status() != WL_CONNECTED) {
  SerialMon.println("WiFi Status: " + String(WiFi.status()));
  SerialMon.println("Available networks:");
  int n = WiFi.scanNetworks();
  for (int i = 0; i < n; i++) {
    SerialMon.println("  " + WiFi.SSID(i) + " (" + String(WiFi.RSSI(i)) + " dBm)");
  }
}
```

### 9.7 MongoDB Connection Pooling Issues (Vercel)

**Issue:** Cold start errors:
```
MongooseServerSelectionError: connection timed out
```

**Cause:** Serverless functions don't maintain persistent connections

**Solution:**
```javascript
// backend/src/config/database.ts
let isConnected = false;

export const connectDatabase = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('♻️ Reusing existing MongoDB connection');
    return;
  }
  
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10, // Limit pool size for serverless
    minPoolSize: 1
  });
  
  isConnected = true;
  console.log('✅ MongoDB connected');
};
```

---

## 10. CURRENT FEATURE STATUS

### 10.1 Working Features ✅

**IoT & Hardware:**
- ✅ ESP32 OBD-II connectivity (Veepeak WiFi adapter)
- ✅ VIN extraction (Mode 09 PID 02)
- ✅ Intelligent PID discovery (scans 200+ PIDs, finds odometer)
- ✅ Multi-vehicle support (Hyundai, Maruti, UDS Mode 22)
- ✅ SPIFFS data buffering (offline mode, 50 records)
- ✅ EC200U cellular communication (4G fallback)
- ✅ Deep sleep power management (2-minute cycles)
- ✅ Local fraud detection (rollback, impossible distance)

**Backend API:**
- ✅ User authentication (JWT + refresh tokens)
- ✅ Multi-role RBAC (admin, owner, buyer, service provider)
- ✅ Vehicle registration & CRUD
- ✅ Device ingestion endpoint (`/api/device/status`)
- ✅ Mileage history tracking (with source attribution)
- ✅ Fraud detection engine (4 algorithms)
- ✅ TrustScore calculation (atomic transactions, event sourcing)
- ✅ Marketplace listings (create, browse, filter)
- ✅ Purchase requests (buyer → seller communication)
- ✅ Ownership transfer (blockchain-recorded)
- ✅ Admin panel APIs (user management, fraud monitoring)
- ✅ Real-time notifications (Socket.IO, partial support)

**Blockchain:**
- ✅ Solana Devnet integration
- ✅ Memo Program transactions (vehicle registration, mileage updates)
- ✅ SHA-256 data hashing
- ✅ Transaction signature storage
- ✅ Multi-RPC fallback (Helius, Solana Foundation)
- ✅ Arweave service configuration (testnet ready)
- ✅ Wallet generation (custodial)
- ✅ Balance checking
- ✅ Blockchain verification endpoint

**Frontend:**
- ✅ Owner dashboard (vehicle list, TrustScore cards, mileage charts)
- ✅ Marketplace browse (filters, blockchain badges)
- ✅ Vehicle details page (history, fraud alerts, QR code)
- ✅ Wallet management (Solana wallet creation, transaction history)
- ✅ Admin panel (user management, fraud alerts)
- ✅ Responsive design (mobile + desktop)
- ✅ Role-based routing (protected routes)
- ✅ Real-time updates (Socket.IO client)
- ✅ Toast notifications (react-hot-toast)
- ✅ Dark mode toggle

**DevOps:**
- ✅ Vercel deployment (backend serverless)
- ✅ Netlify deployment (frontend SPA)
- ✅ MongoDB Atlas (cloud database)
- ✅ CI/CD (auto-deploy on Git push)
- ✅ Environment-based configuration
- ✅ Error logging (Winston)

### 10.2 Partially Implemented Features ⚠️

**Blockchain:**
- ⚠️ IPFS/Arweave upload (service configured, not actively used)
- ⚠️ Smart contract (Rust program not deployed, using Memo Program placeholder)
- ⚠️ NFT vehicle certificates (planned, not implemented)
- ⚠️ Escrow mechanism (model exists, no smart contract integration)

**Real-Time Features:**
- ⚠️ Socket.IO (works locally, limited on Vercel serverless)
- ⚠️ Live TrustScore updates (polls backend instead of push notifications)

**IoT:**
- ⚠️ OTA firmware updates (planned, not implemented)
- ⚠️ GPS integration (location field exists, not captured by ESP32)
- ⚠️ Certificate-based device auth (using deviceID only)

**Frontend:**
- ⚠️ Service provider dashboard (routes exist, incomplete UI)
- ⚠️ Government/Insurance dashboards (models exist, no UI)
- ⚠️ Advanced analytics (basic stats only)

### 10.3 Not Yet Implemented Features ❌

**Blockchain:**
- ❌ Custom Solana program in Rust (ownership transfer logic)
- ❌ SPL Token integration (vehicle NFTs)
- ❌ Chainlink oracle (off-chain data verification)
- ❌ DAO governance (dispute resolution)

**AI/ML:**
- ❌ LSTM neural network (anomaly detection)
- ❌ Random Forest classifier (fraud probability scoring)
- ❌ Predictive maintenance (OBD error code analysis)
- ❌ Market price prediction

**Mobile:**
- ❌ React Native app (iOS/Android)
- ❌ Bluetooth OBD-II support
- ❌ Offline mode (local SQLite)
- ❌ Push notifications

**Integrations:**
- ❌ Insurance company API (usage-based insurance)
- ❌ DMV/RTO integration (government vehicle registry)
- ❌ OEM partnerships (Hyundai, Maruti data feeds)
- ❌ Payment gateway (Stripe, Razorpay)

**Enterprise:**
- ❌ Fleet management dashboard
- ❌ Multi-tenant architecture
- ❌ White-label solution

---

## 11. NEXT PRIORITIES (3 KEY TASKS)

### Priority 1: Fix Socket.IO Real-Time Notifications 🔴

**Problem:** WebSocket connections don't work on Vercel serverless

**Impact:** Users don't receive real-time TrustScore updates, fraud alerts, or marketplace notifications

**Solution Options:**
1. **Migrate to Render.com** (traditional server, supports WebSocket)
   - Deploy backend on Render using `render.yaml`
   - Keep Vercel as backup API
   - Update frontend `VITE_SOCKET_URL`
2. **Use Pusher** (third-party real-time service)
   - Sign up: pusher.com (free tier: 100 connections)
   - Replace Socket.IO with Pusher client
   - Backend: `pusher.trigger('vehicle-123', 'trustscore-updated', data)`
3. **Implement HTTP Polling** (fallback)
   - Frontend polls `/api/notifications/latest` every 5 seconds
   - Less efficient but works on serverless

**Estimated Effort:** 4-6 hours  
**Files to Modify:**
- `backend/src/utils/socketEmitter.ts` (switch to Pusher or polling)
- `backend/src/server.ts` (remove Socket.IO initialization if using Pusher)
- `frontend/src/hooks/useSocket.ts` (replace Socket.IO client)
- `backend/render.yaml` (if migrating to Render)

### Priority 2: Deploy Custom Solana Program (Rust Smart Contract) 🟡

**Problem:** Currently using Memo Program (limited functionality), need custom logic for:
- Atomic ownership transfers
- Escrow mechanism
- Vehicle NFT minting
- On-chain fraud flags

**Implementation Plan:**
1. **Write Rust Program** (using Anchor framework)
   ```rust
   // programs/veridrive/src/lib.rs
   #[program]
   pub mod veridrive {
       pub fn register_vehicle(ctx: Context<RegisterVehicle>, vin: String, initial_mileage: u32) -> Result<()> {
           let vehicle = &mut ctx.accounts.vehicle;
           vehicle.vin = vin;
           vehicle.current_mileage = initial_mileage;
           vehicle.owner = ctx.accounts.owner.key();
           vehicle.trust_score = 100;
           Ok(())
       }
       
       pub fn update_mileage(ctx: Context<UpdateMileage>, new_mileage: u32) -> Result<()> {
           let vehicle = &mut ctx.accounts.vehicle;
           require!(new_mileage >= vehicle.current_mileage, ErrorCode::MileageRollback);
           vehicle.current_mileage = new_mileage;
           vehicle.last_update = Clock::get()?.unix_timestamp;
           Ok(())
       }
       
       pub fn transfer_ownership(ctx: Context<TransferOwnership>) -> Result<()> {
           let vehicle = &mut ctx.accounts.vehicle;
           let escrow = &ctx.accounts.escrow;
           require!(escrow.is_funded, ErrorCode::EscrowNotFunded);
           vehicle.owner = ctx.accounts.new_owner.key();
           Ok(())
       }
   }
   ```

2. **Deploy to Devnet**
   ```bash
   anchor build
   anchor deploy --provider.cluster devnet
   # Output: Program ID: 7xK9j2L3m4N...
   ```

3. **Update Backend Service**
   ```javascript
   // backend/src/services/blockchain/solana.service.ts
   const PROGRAM_ID = new PublicKey('7xK9j2L3m4N...');
   
   async registerVehicle(vin, initialMileage, ownerPubkey) {
     const vehiclePDA = await PublicKey.findProgramAddress(
       [Buffer.from('vehicle'), Buffer.from(vin)],
       PROGRAM_ID
     );
     
     const instruction = await program.methods.registerVehicle(vin, initialMileage)
       .accounts({
         vehicle: vehiclePDA,
         owner: ownerPubkey,
         systemProgram: SystemProgram.programId
       })
       .instruction();
     
     // Send transaction...
   }
   ```

**Estimated Effort:** 12-16 hours  
**Files to Create:**
- `blockchain/programs/veridrive/src/lib.rs` (Rust program)
- `blockchain/programs/veridrive/Cargo.toml` (dependencies)
- `blockchain/Anchor.toml` (Anchor config)
- `blockchain/migrations/deploy.ts` (deployment script)

**Files to Modify:**
- `backend/src/services/blockchain/solana.service.ts` (replace Memo Program calls)

### Priority 3: Implement Comprehensive Testing Suite 🟢

**Problem:** No automated tests, manual QA is time-consuming and error-prone

**Impact:** Bugs in production, regression issues, slow feature development

**Implementation Plan:**

**Backend Tests (Jest + Supertest):**
```javascript
// backend/src/__tests__/auth.test.ts
describe('Authentication API', () => {
  it('should register new user with valid data', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@veridrive.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'owner'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.user.email).toBe('test@veridrive.com');
  });
  
  it('should reject duplicate email', async () => {
    // Register first user...
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@veridrive.com', ... });
    
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('already exists');
  });
});

// backend/src/__tests__/fraud-detection.test.ts
describe('Fraud Detection', () => {
  it('should detect odometer rollback', async () => {
    const vehicle = await Vehicle.create({ vin: 'TEST123...', currentMileage: 50000 });
    
    const fraudAlerts = await detectFraud(vehicle._id, 49500, 50000, 3600000);
    
    expect(fraudAlerts).toHaveLength(1);
    expect(fraudAlerts[0].type).toBe('odometer_rollback');
    expect(fraudAlerts[0].severity).toBe('critical');
  });
});
```

**Frontend Tests (React Testing Library):**
```javascript
// frontend/src/__tests__/VehicleList.test.tsx
describe('VehicleList Component', () => {
  it('should render vehicle cards', async () => {
    const mockVehicles = [
      { _id: '1', make: 'Hyundai', model: 'i20', year: 2020, trustScore: 95 },
      { _id: '2', make: 'Maruti', model: 'Brezza', year: 2021, trustScore: 88 }
    ];
    
    jest.spyOn(vehicleService, 'getVehicles').mockResolvedValue(mockVehicles);
    
    render(<VehicleList />);
    
    await waitFor(() => {
      expect(screen.getByText('Hyundai i20')).toBeInTheDocument();
      expect(screen.getByText('Maruti Brezza')).toBeInTheDocument();
    });
  });
});
```

**Integration Tests:**
```javascript
// backend/src/__tests__/integration/device-to-blockchain.test.ts
describe('Device to Blockchain Integration', () => {
  it('should process ESP32 data and anchor to blockchain', async () => {
    const deviceData = {
      deviceID: 'OBD3001',
      status: 'obd_connected',
      vin: 'TEST123...',
      mileage: 50123,
      timestamp: Date.now()
    };
    
    const response = await request(app)
      .post('/api/device/status')
      .send(deviceData);
    
    expect(response.status).toBe(200);
    
    // Wait for async blockchain job
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const vehicle = await Vehicle.findOne({ vin: 'TEST123...' });
    expect(vehicle.blockchainHash).toBeDefined();
    expect(vehicle.currentMileage).toBe(50123);
  });
});
```

**Test Coverage Goals:**
- Backend: 80% coverage (critical paths: auth, fraud detection, blockchain)
- Frontend: 70% coverage (main pages, key components)
- Integration: 60% coverage (API → DB → Blockchain flows)

**Estimated Effort:** 20-24 hours  
**Files to Create:**
- `backend/src/__tests__/auth.test.ts`
- `backend/src/__tests__/vehicle.test.ts`
- `backend/src/__tests__/fraud-detection.test.ts`
- `backend/src/__tests__/integration/device-to-blockchain.test.ts`
- `frontend/src/__tests__/VehicleList.test.tsx`
- `frontend/src/__tests__/MarketplaceBrowse.test.tsx`

---

## APPENDIX: QUICK REFERENCE

### API Base URLs
- **Local Backend:** `http://localhost:5000/api`
- **Production Backend:** `https://block-x-two.vercel.app/api`
- **Local Frontend:** `http://localhost:5173`
- **Production Frontend:** `https://blockx.netlify.app`

### Database Connection
- **Local MongoDB:** `mongodb://localhost:27017/veridrive`
- **MongoDB Atlas:** `mongodb+srv://...` (see .env)

### Blockchain Networks
- **Solana Devnet RPC:** `https://api.devnet.solana.com`
- **Arweave Testnet:** `https://testnet.redstone.tools`
- **Explorer:** `https://explorer.solana.com?cluster=devnet`

### Key Endpoints (Quick Test)
```bash
# Health check
curl https://block-x-two.vercel.app/api/health

# Login
curl -X POST https://block-x-two.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@veridrive.com","password":"SecurePass123!"}'

# Get vehicles (requires token)
curl https://block-x-two.vercel.app/api/vehicles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Repository Structure
```
BlockX-Hackathon/
├── backend/           # Node.js API (Vercel serverless)
├── frontend/          # React SPA (Netlify)
├── esp32Code/         # ESP32 firmware (Arduino)
├── blockchain/        # Solana program (Rust, not deployed yet)
├── docs/              # Documentation
└── ODOCHAIN/          # System diagrams
```

### Key Technologies Summary
- **Backend:** Node.js 18, Express, TypeScript, MongoDB, Mongoose, JWT, Socket.IO, Solana Web3.js
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Redux Toolkit, Framer Motion, Recharts
- **IoT:** ESP32, Arduino, ELM327, EC200U, SPIFFS
- **Blockchain:** Solana (Devnet), Memo Program, Arweave (planned)
- **DevOps:** Vercel, Netlify, MongoDB Atlas, GitHub

---

**END OF SUMMARY**

This comprehensive report covers the entire BlockX/VeriDrive project flow based on the codebase. Ready for conversion to presentation slides.

**Generated from:** Complete repository analysis (backend, frontend, IoT, docs)  
**Date:** October 30, 2025  
**Next Actions:** See Section 11 (Priorities 1-3)

