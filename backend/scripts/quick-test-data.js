const axios = require('axios');

// Quick test data for immediate testing
const DEVICE_ID = 'OBD3001';
const VIN = '1HGCM82633A12DSAA';
const BASE_URL = 'http://localhost:3000';

// Create a single test record
function createTestRecord(mileage, hoursAgo = 0) {
  const timestamp = new Date();
  timestamp.setHours(timestamp.getHours() - hoursAgo);
  
  return {
    deviceID: DEVICE_ID,
    status: 'obd_connected',
    vin: VIN,
    mileage: mileage,
    rpm: Math.floor(Math.random() * 2000) + 800,
    speed: Math.floor(Math.random() * 80) + 10,
    engineTemp: Math.floor(Math.random() * 20) + 85,
    fuelLevel: Math.floor(Math.random() * 80) + 20,
    batteryVoltage: 12.4 + (Math.random() * 1.2),
    dataQuality: 95 + Math.floor(Math.random() * 5),
    odometerPID: '0x201C',
    dataSource: 'veepeak_obd',
    timestamp: timestamp.getTime(),
    message: 'Normal operation',
    bootCount: Math.floor(Math.random() * 10) + 1,
    signalStrength: 'Good',
    networkOperator: 'Verizon',
    freeHeap: Math.floor(Math.random() * 50000) + 100000,
    veepeakConnected: true,
    httpAttempts: 1
  };
}

// Send a single record
async function sendRecord(record) {
  try {
    const response = await axios.post(`${BASE_URL}/api/device/status`, record, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`✅ Sent: ${record.mileage}km at ${new Date(record.timestamp).toLocaleString()}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed:`, error.response?.data || error.message);
    return null;
  }
}

// Generate 5 days of test data
async function generateQuickTest() {
  console.log(`🚀 Generating quick test data for ${DEVICE_ID} (${VIN})`);
  
  const scenarios = [
    // Day 1: Normal operation
    { mileage: 45000, hoursAgo: 24, description: 'Day 1 - Normal' },
    { mileage: 45050, hoursAgo: 20, description: 'Day 1 - Normal' },
    { mileage: 45100, hoursAgo: 16, description: 'Day 1 - Normal' },
    { mileage: 45150, hoursAgo: 12, description: 'Day 1 - Normal' },
    
    // Day 2: Normal operation
    { mileage: 45200, hoursAgo: 8, description: 'Day 2 - Normal' },
    { mileage: 45250, hoursAgo: 4, description: 'Day 2 - Normal' },
    
    // Day 3: FRAUD SCENARIO - Rollback
    { mileage: 82, hoursAgo: 2, description: 'Day 3 - FRAUD ROLLBACK' },
    
    // Day 4: Recovery
    { mileage: 45300, hoursAgo: 1, description: 'Day 4 - Recovery' },
    
    // Day 5: Current
    { mileage: 45350, hoursAgo: 0, description: 'Day 5 - Current' }
  ];
  
  for (const scenario of scenarios) {
    const record = createTestRecord(scenario.mileage, scenario.hoursAgo);
    record.message = scenario.description;
    
    await sendRecord(record);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
  }
  
  console.log(`\n🎉 Quick test data generation completed!`);
  console.log(`📊 Total records: ${scenarios.length}`);
  console.log(`🚨 Fraud scenario included (45,000km → 82km rollback)`);
}

// Run if called directly
if (require.main === module) {
  generateQuickTest();
}

module.exports = { generateQuickTest, createTestRecord };
