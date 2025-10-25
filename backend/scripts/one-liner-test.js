// One-liner test script for OBD3001 device
// Usage: node scripts/one-liner-test.js

const axios = require('axios');

async function quickTest() {
  const BASE_URL = 'http://localhost:3000';
  
  console.log('🚀 Quick test for OBD3001 device...');
  
  // Test 1: Normal operation
  console.log('📊 Test 1: Normal operation (45,100km)');
  try {
    const normalResponse = await axios.post(`${BASE_URL}/api/device/status`, {
      deviceID: 'OBD3001',
      status: 'obd_connected',
      vin: '1HGCM82633A12DSAA',
      mileage: 45100,
      rpm: 1500,
      speed: 45,
      engineTemp: 90,
      fuelLevel: 75,
      batteryVoltage: 12.6,
      dataQuality: 98,
      odometerPID: '0x201C',
      dataSource: 'veepeak_obd',
      timestamp: Date.now(),
      message: 'Normal operation test',
      bootCount: 5,
      signalStrength: 'Good',
      networkOperator: 'Verizon',
      freeHeap: 150000,
      veepeakConnected: true,
      httpAttempts: 1,
      // FIXED: Add required mileageValidation fields
      mileageValidation: {
        reportedMileage: 45100,
        previousMileage: 45000,
        newMileage: 45100,
        delta: 100,
        flagged: false,
        validationStatus: 'VALID',
        reason: 'Normal mileage increase'
      }
    });
    console.log('✅ Normal operation: SUCCESS');
    console.log('   Response:', normalResponse.data);
  } catch (error) {
    console.log('❌ Normal operation: FAILED');
    console.log('   Error:', error.response?.data || error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Fraud detection
  console.log('\n🚨 Test 2: Fraud detection (45,200km → 82km rollback)');
  try {
    const fraudResponse = await axios.post(`${BASE_URL}/api/device/status`, {
      deviceID: 'OBD3001',
      status: 'obd_connected',
      vin: '1HGCM82633A12DSAA',
      mileage: 82,
      rpm: 1200,
      speed: 25,
      engineTemp: 85,
      fuelLevel: 50,
      batteryVoltage: 12.3,
      dataQuality: 95,
      odometerPID: '0x201C',
      dataSource: 'veepeak_obd',
      timestamp: Date.now(),
      message: 'FRAUD ROLLBACK DETECTED',
      bootCount: 10,
      signalStrength: 'Good',
      networkOperator: 'Verizon',
      freeHeap: 125000,
      veepeakConnected: true,
      httpAttempts: 1,
      // FIXED: Add required mileageValidation fields for fraud scenario
      mileageValidation: {
        reportedMileage: 82,
        previousMileage: 45200,
        newMileage: 82,
        delta: -45118,
        flagged: true,
        validationStatus: 'ROLLBACK_DETECTED',
        reason: 'Reported mileage (82 km) is significantly lower than last verified mileage (45200 km).'
      }
    });
    console.log('❌ Fraud detection: SHOULD HAVE FAILED');
    console.log('   Response:', fraudResponse.data);
  } catch (error) {
    if (error.response?.status === 422) {
      console.log('✅ Fraud detection: SUCCESS (HTTP 422 as expected)');
      console.log('   Response:', error.response.data);
    } else {
      console.log('❌ Fraud detection: UNEXPECTED ERROR');
      console.log('   Error:', error.response?.data || error.message);
    }
  }
  
  console.log('\n🎉 Quick test completed!');
  console.log('📱 Check frontend at: http://localhost:5173/test/mileage-history');
}

quickTest().catch(console.error);
