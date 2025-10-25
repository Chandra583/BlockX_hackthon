const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const DEVICE_ID = 'OBD3001';
const VIN = '1HGCM82633A12DSAA';

// Test data configuration
const DAYS_TO_GENERATE = 7;
const RECORDS_PER_DAY = 8; // Every 3 hours
const STARTING_MILEAGE = 45000;
const DAILY_MILEAGE_INCREASE = 50; // 50km per day average

// Vehicle details for context
const VEHICLE_INFO = {
  make: 'Honda',
  model: 'Civic',
  year: 2020,
  color: 'Silver',
  bodyType: 'sedan',
  fuelType: 'gasoline',
  transmission: 'automatic'
};

// Generate realistic OBD data
function generateOBDData(baseMileage, hourOffset = 0) {
  const currentHour = new Date().getHours() + hourOffset;
  const isDayTime = currentHour >= 6 && currentHour <= 22;
  
  return {
    mileage: baseMileage + Math.floor(Math.random() * 5), // Small random variation
    rpm: isDayTime ? Math.floor(Math.random() * 2000) + 800 : 0, // Engine off at night
    speed: isDayTime ? Math.floor(Math.random() * 80) + 10 : 0, // Driving during day
    engineTemp: isDayTime ? Math.floor(Math.random() * 20) + 85 : 20, // Cool when off
    fuelLevel: Math.max(10, Math.floor(Math.random() * 80) + 20), // 20-100%
    batteryVoltage: 12.4 + (Math.random() * 1.2), // 12.4-13.6V
    dataQuality: 95 + Math.floor(Math.random() * 5), // 95-100%
    odometerPID: '0x201C',
    dataSource: 'veepeak_obd'
  };
}

// Generate device health data
function generateDeviceHealth() {
  return {
    batteryVoltage: 12.4 + (Math.random() * 1.2),
    bootCount: Math.floor(Math.random() * 10) + 1,
    signalStrength: ['Excellent', 'Good', 'Fair'][Math.floor(Math.random() * 3)],
    networkOperator: 'Verizon',
    freeHeap: Math.floor(Math.random() * 50000) + 100000
  };
}

// Generate location data (simulate driving around a city)
function generateLocation() {
  // Simulate driving around a city center
  const baseLat = 40.7128; // NYC coordinates
  const baseLng = -74.0060;
  
  return {
    latitude: baseLat + (Math.random() - 0.5) * 0.1, // ±0.05 degrees
    longitude: baseLng + (Math.random() - 0.5) * 0.1,
    accuracy: Math.floor(Math.random() * 10) + 5, // 5-15 meters
    altitude: Math.floor(Math.random() * 50) + 10, // 10-60 meters
    heading: Math.floor(Math.random() * 360), // 0-359 degrees
    timestamp: new Date()
  };
}

// Create a single telemetry record
function createTelemetryRecord(deviceId, vin, mileage, timestamp, hourOffset = 0) {
  const obdData = generateOBDData(mileage, hourOffset);
  const deviceHealth = generateDeviceHealth();
  const location = generateLocation();
  
  return {
    deviceID: deviceId,
    status: 'obd_connected',
    vin: vin,
    mileage: obdData.mileage,
    rpm: obdData.rpm,
    speed: obdData.speed,
    engineTemp: obdData.engineTemp,
    fuelLevel: obdData.fuelLevel,
    batteryVoltage: obdData.batteryVoltage,
    dataQuality: obdData.dataQuality,
    odometerPID: obdData.odometerPID,
    dataSource: obdData.dataSource,
    timestamp: timestamp,
    message: 'Normal operation',
    bootCount: deviceHealth.bootCount,
    signalStrength: deviceHealth.signalStrength,
    networkOperator: deviceHealth.networkOperator,
    freeHeap: deviceHealth.freeHeap,
    veepeakConnected: true,
    httpAttempts: 1
  };
}

// Send data to the API
async function sendTelemetryData(record) {
  try {
    const response = await axios.post(`${BASE_URL}/api/device/status`, record, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Record sent: ${record.mileage}km at ${new Date(record.timestamp).toLocaleString()}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to send record:`, error.response?.data || error.message);
    return null;
  }
}

// Generate data for a specific day
async function generateDayData(dayOffset) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - dayOffset);
  
  const baseMileage = STARTING_MILEAGE + (DAYS_TO_GENERATE - dayOffset) * DAILY_MILEAGE_INCREASE;
  
  console.log(`\n📅 Generating data for ${targetDate.toDateString()}`);
  console.log(`🚗 Base mileage: ${baseMileage}km`);
  
  const records = [];
  
  // Generate records throughout the day
  for (let hour = 0; hour < 24; hour += 3) { // Every 3 hours
    const recordTime = new Date(targetDate);
    recordTime.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
    
    const mileage = baseMileage + Math.floor(Math.random() * 10); // Small daily variation
    const record = createTelemetryRecord(DEVICE_ID, VIN, mileage, recordTime.getTime(), hour);
    
    records.push(record);
  }
  
  // Send records with delays
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    await sendTelemetryData(record);
    
    // Add delay between records to simulate real-world timing
    if (i < records.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
  }
  
  return records;
}

// Generate fraud scenario (rollback)
async function generateFraudScenario() {
  console.log(`\n🚨 Generating fraud scenario - Odometer rollback`);
  
  const fraudDate = new Date();
  fraudDate.setDate(fraudDate.getDate() - 1); // Yesterday
  
  // Create a rollback scenario: 45,000km -> 82km
  const rollbackRecord = createTelemetryRecord(
    DEVICE_ID, 
    VIN, 
    82, // Massive rollback
    fraudDate.getTime()
  );
  
  rollbackRecord.message = 'Suspicious mileage reading detected';
  
  const result = await sendTelemetryData(rollbackRecord);
  
  if (result) {
    console.log(`🚨 Fraud record sent: ${rollbackRecord.mileage}km (should be flagged)`);
  }
  
  return rollbackRecord;
}

// Generate valid scenario (normal increase)
async function generateValidScenario() {
  console.log(`\n✅ Generating valid scenario - Normal mileage increase`);
  
  const validDate = new Date();
  const validMileage = 45100; // Normal increase
  
  const validRecord = createTelemetryRecord(
    DEVICE_ID, 
    VIN, 
    validMileage,
    validDate.getTime()
  );
  
  validRecord.message = 'Normal operation - mileage increase';
  
  const result = await sendTelemetryData(validRecord);
  
  if (result) {
    console.log(`✅ Valid record sent: ${validRecord.mileage}km (should be accepted)`);
  }
  
  return validRecord;
}

// Main function
async function generateTestData() {
  console.log(`🚀 Starting test data generation for ${DAYS_TO_GENERATE} days`);
  console.log(`📱 Device: ${DEVICE_ID}`);
  console.log(`🚗 VIN: ${VIN}`);
  console.log(`📊 Records per day: ${RECORDS_PER_DAY}`);
  console.log(`📈 Daily mileage increase: ${DAILY_MILEAGE_INCREASE}km`);
  
  try {
    // Generate historical data (past days)
    for (let day = DAYS_TO_GENERATE; day > 0; day--) {
      await generateDayData(day);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between days
    }
    
    // Generate today's data
    await generateDayData(0);
    
    // Generate fraud scenario
    await new Promise(resolve => setTimeout(resolve, 3000));
    await generateFraudScenario();
    
    // Generate valid scenario
    await new Promise(resolve => setTimeout(resolve, 3000));
    await generateValidScenario();
    
    console.log(`\n🎉 Test data generation completed!`);
    console.log(`📊 Total records generated: ${DAYS_TO_GENERATE * RECORDS_PER_DAY + 2}`);
    console.log(`🚨 Fraud scenario included for testing`);
    console.log(`✅ Valid scenario included for testing`);
    
  } catch (error) {
    console.error(`❌ Error generating test data:`, error);
  }
}

// Run the script
if (require.main === module) {
  generateTestData();
}

module.exports = { generateTestData, createTelemetryRecord };
