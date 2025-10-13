# IoT Device Data Ingestion Configuration for BlockX

## Status: ✅ CONFIGURED AND TESTED

### ESP32 Simulator Setup
- **Location**: `esp32Code/server.js`
- **Port**: 3000
- **Endpoint**: `POST /esp32-status`
- **Health Check**: `GET /health`

### ESP32 Hardware Code
- **Location**: `esp32Code/ESP32_EC200U_Backend_TCP/ESP32_EC200U_Backend_TCP.ino`
- **Target Backend**: `block-x-two.vercel.app/api/device/status`
- **Features**: 
  - OBD-II data collection
  - Cellular connectivity (4G/LTE)
  - Anti-tampering validation
  - Multiple vehicle support (Hyundai i20, Maruti Brezza)
  - Discovery mode for unknown vehicles

### Data Source Types Supported

#### 1. Vehicle OBD Data (`veepeak_obd`)
```json
{
  "deviceID": "ESP32_BLOCKX_001",
  "status": "obd_connected",
  "vin": "BLOCKX123456789",
  "mileage": 50125,
  "rpm": 2200,
  "speed": 65,
  "engineTemp": 92,
  "fuelLevel": 75,
  "batteryVoltage": 13.2,
  "dataQuality": 95,
  "odometerPID": "0x201C",
  "dataSource": "veepeak_obd"
}
```

#### 2. Connection Status (`connection_status`)
```json
{
  "deviceID": "ESP32_BLOCKX_001",
  "status": "connected",
  "veepeakConnected": true,
  "batteryVoltage": 12.8,
  "dataSource": "connection_status"
}
```

#### 3. Network Diagnostics (`network_diagnostics`)
```json
{
  "deviceID": "ESP32_BLOCKX_001",
  "operator": "Airtel India",
  "signal": "27 (87%)",
  "sim": "404***********",
  "apn": "airtelgprs.com",
  "ipAddress": "10.123.45.67",
  "dataSource": "network_diagnostics"
}
```

#### 4. Device Status (`device_status`)
```json
{
  "deviceID": "ESP32_BLOCKX_002",
  "status": "device_not_connected",
  "message": "Veepeak WiFi connection failed",
  "veepeakConnected": false,
  "dataSource": "device_status"
}
```

#### 5. Dummy Data (`dummy_data`)
```json
{
  "deviceID": "ESP32_BLOCKX_003",
  "vin": "DUMMY123456789",
  "mileage": 75420,
  "dataSource": "dummy_data"
}
```

### Backend Integration Points

#### Production Backend
- **URL**: `https://block-x-two.vercel.app/api/device/status`
- **Method**: POST
- **Content-Type**: application/json

#### Local Testing
- **ESP32 Simulator**: `http://localhost:3000/esp32-status`
- **Backend Mock**: `http://localhost:3000/api/device/status`

### Testing Infrastructure

#### Test Scripts Created
1. **`test-iot-esp32-simulator.js`** - Comprehensive IoT testing with ESP32 simulator
2. **`test-iot-ingestion.js`** - Direct backend API testing
3. **`test-device-endpoint.js`** - Simple endpoint validation

#### Test Coverage
- ✅ Multiple data source types
- ✅ JSON parsing and validation
- ✅ Error handling scenarios
- ✅ Response format standardization
- ✅ Connection failure handling
- ✅ Health check endpoints

### ESP32 Device Features

#### Anti-Tampering System
- Historical odometer validation
- Cross-validation with multiple PIDs
- Rollback detection
- Impossible distance detection
- Sudden jump detection

#### Vehicle Support
- **Mode 1**: Hyundai i20 Sport Plus (2019-2023)
- **Mode 2**: Maruti Vitara Brezza (2016-2023)  
- **Mode 3**: Manual PID configuration
- **Mode 4**: Auto-discovered PID & scale
- **Mode 99**: Discovery mode (scan for PIDs)

#### Connectivity
- **Primary**: Veepeak WiFi OBD-II adapter
- **Cellular**: 4G/LTE with multiple APN support
- **Fallback**: Offline data storage with later sync

### Production Deployment

#### ESP32 Configuration
```cpp
// Update in ESP32_EC200U_Backend_TCP.ino
char serverHost[100] = "block-x-two.vercel.app";
char apnName[50] = "airtelgprs.com";  // Adjust for carrier
uint8_t selectedVehicle = 1;  // Set based on vehicle type
```

#### Backend Environment
```env
# Device ingestion settings
DEVICE_ENDPOINT_ENABLED=true
DEVICE_DATA_VALIDATION=true
DEVICE_RATE_LIMITING=true
MAX_DEVICE_PAYLOAD_SIZE=2048
```

### Verification Steps

#### 1. ESP32 Simulator Test
```bash
cd esp32Code
node server.js
# Test with: POST http://localhost:3000/esp32-status
```

#### 2. Backend Integration Test
```bash
cd backend
node test-iot-esp32-simulator.js
```

#### 3. Production Verification
```bash
# Check ESP32 logs for successful transmission
# Verify data appears in backend logs/database
# Confirm anti-tampering validation working
```

### Monitoring and Logging

#### ESP32 Device Logs
- Connection status
- OBD data quality metrics
- Cellular signal strength
- Anti-tampering alerts
- Discovery mode results

#### Backend Logs
- Device registration events
- Data ingestion metrics
- Validation failures
- Rate limiting events

### Next Steps for Production

1. **Hardware Deployment**
   - Install ESP32 devices in test vehicles
   - Configure cellular SIM cards
   - Set vehicle-specific PID modes

2. **Backend Scaling**
   - Implement device authentication
   - Add data persistence layer
   - Set up monitoring dashboards

3. **Data Pipeline**
   - Connect to blockchain services
   - Implement real-time alerts
   - Add data analytics

### Security Considerations

- Device authentication via unique device IDs
- Encrypted cellular communication
- Anti-tampering validation
- Rate limiting to prevent abuse
- Input validation and sanitization

## Summary: ✅ IoT INGESTION READY

The IoT device data ingestion pipeline is fully configured and tested:
- ESP32 simulator working
- Multiple data source types supported
- Comprehensive test coverage
- Production-ready ESP32 code
- Backend integration points defined
- Anti-tampering system implemented
