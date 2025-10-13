// Simple test to check if device endpoint is working
const axios = require('axios');

async function quickDeviceTest() {
  const testData = {
    deviceID: 'ESP32_TEST_001',
    status: 'obd_connected',
    timestamp: Date.now(),
    vin: 'TEST123456789',
    mileage: 50000,
    dataSource: 'test'
  };

  try {
    console.log('🧪 Testing device endpoint...');
    const response = await axios.post('http://localhost:3000/api/device/status', testData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });
    
    console.log(`✅ Success! Status: ${response.status}`);
    console.log(`📄 Response: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Connection refused - Backend server not running');
      console.log('💡 Start the backend server first: npm start');
    } else {
      console.log(`❌ Test failed: ${error.message}`);
    }
    return false;
  }
}

quickDeviceTest();

