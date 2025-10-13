const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Mock device storage
const deviceData = [];
const telemetryData = [];

// Mock device status endpoint
app.post('/api/device/status', (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📡 [${timestamp}] Device Status Received`);
  console.log('📄 Request Body:', JSON.stringify(req.body, null, 2));
  
  const devicePayload = req.body;
  
  // Validate required fields
  const requiredFields = ['deviceID', 'status', 'timestamp'];
  const missingFields = requiredFields.filter(field => !devicePayload[field]);
  
  if (missingFields.length > 0) {
    console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(', ')}`,
      timestamp
    });
  }
  
  // Store device data
  const deviceRecord = {
    id: `device_${Date.now()}`,
    deviceID: devicePayload.deviceID,
    status: devicePayload.status,
    lastSeen: timestamp,
    vin: devicePayload.vin || null,
    location: devicePayload.location || null,
    isOnline: devicePayload.status !== 'offline'
  };
  
  // Update or create device record
  const existingDeviceIndex = deviceData.findIndex(d => d.deviceID === devicePayload.deviceID);
  if (existingDeviceIndex >= 0) {
    deviceData[existingDeviceIndex] = { ...deviceData[existingDeviceIndex], ...deviceRecord };
    console.log(`✅ Updated existing device: ${devicePayload.deviceID}`);
  } else {
    deviceData.push(deviceRecord);
    console.log(`✅ Created new device record: ${devicePayload.deviceID}`);
  }
  
  // Store telemetry data if present
  if (devicePayload.mileage || devicePayload.vehicleData) {
    const telemetryRecord = {
      id: `telemetry_${Date.now()}`,
      deviceID: devicePayload.deviceID,
      vin: devicePayload.vin,
      mileage: devicePayload.mileage,
      vehicleData: devicePayload.vehicleData,
      location: devicePayload.location,
      diagnostics: devicePayload.diagnostics,
      timestamp: devicePayload.timestamp,
      receivedAt: timestamp
    };
    
    telemetryData.push(telemetryRecord);
    console.log(`✅ Stored telemetry data - Mileage: ${devicePayload.mileage}`);
  }
  
  // Simulate processing time
  const processingTime = Math.random() * 100 + 50; // 50-150ms
  
  setTimeout(() => {
    res.status(200).json({
      success: true,
      message: 'Device status received and processed successfully',
      data: {
        deviceID: devicePayload.deviceID,
        status: devicePayload.status,
        processed: true,
        processingTime: `${processingTime.toFixed(0)}ms`,
        recordsStored: {
          device: true,
          telemetry: !!(devicePayload.mileage || devicePayload.vehicleData)
        }
      },
      timestamp
    });
  }, processingTime);
});

// Mock simple status endpoint (for ESP32 testing)
app.post('/api/device/simple-status', (req, res) => {
  console.log(`\n📡 Simple Status Received: ${JSON.stringify(req.body)}`);
  res.json({
    success: true,
    message: 'Simple status received',
    timestamp: new Date().toISOString()
  });
});

// Get device statistics
app.get('/api/device/stats', (req, res) => {
  const stats = {
    totalDevices: deviceData.length,
    onlineDevices: deviceData.filter(d => d.isOnline).length,
    totalTelemetryRecords: telemetryData.length,
    recentTelemetry: telemetryData.slice(-5),
    devices: deviceData
  };
  
  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'BlockX Mock Device Server',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Mock Device Server running on port ${PORT}`);
  console.log(`📡 Device Status: POST http://localhost:${PORT}/api/device/status`);
  console.log(`📊 Device Stats: GET http://localhost:${PORT}/api/device/stats`);
  console.log(`❤️ Health Check: GET http://localhost:${PORT}/health`);
  console.log('\n🧪 Ready for IoT testing!');
});
