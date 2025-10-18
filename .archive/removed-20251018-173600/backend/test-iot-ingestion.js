const axios = require('axios');

// Test IoT device data ingestion
async function testIoTIngestion() {
  console.log('🧪 Testing IoT Device Data Ingestion...\n');
  
  // Backend API endpoint (assuming it's running on port 3000)
  const backendUrl = 'http://localhost:3000';
  const deviceEndpoint = `${backendUrl}/api/device/status`;
  
  // Test data samples mimicking ESP32 device payloads
  const testPayloads = [
    {
      name: 'Vehicle Startup',
      data: {
        deviceID: 'ESP32_BLOCKX_001',
        status: 'obd_connected',
        timestamp: Date.now(),
        vin: 'BLOCKX123456789',
        mileage: 50125,
        dataSource: 'obd_port',
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 5
        },
        vehicleData: {
          speed: 0,
          rpm: 800,
          fuelLevel: 75,
          engineTemp: 90,
          batteryVoltage: 12.6
        },
        diagnostics: {
          dtcCodes: [],
          engineStatus: 'normal',
          transmissionStatus: 'normal'
        }
      }
    },
    {
      name: 'Driving Data',
      data: {
        deviceID: 'ESP32_BLOCKX_001',
        status: 'driving',
        timestamp: Date.now() + 60000,
        vin: 'BLOCKX123456789',
        mileage: 50127,
        dataSource: 'obd_port',
        location: {
          latitude: 37.7849,
          longitude: -122.4094,
          accuracy: 3
        },
        vehicleData: {
          speed: 35,
          rpm: 2200,
          fuelLevel: 74,
          engineTemp: 95,
          batteryVoltage: 13.8
        },
        diagnostics: {
          dtcCodes: [],
          engineStatus: 'normal',
          transmissionStatus: 'normal'
        }
      }
    },
    {
      name: 'Parking/Shutdown',
      data: {
        deviceID: 'ESP32_BLOCKX_001',
        status: 'parked',
        timestamp: Date.now() + 120000,
        vin: 'BLOCKX123456789',
        mileage: 50135,
        dataSource: 'obd_port',
        location: {
          latitude: 37.7949,
          longitude: -122.3994,
          accuracy: 8
        },
        vehicleData: {
          speed: 0,
          rpm: 0,
          fuelLevel: 72,
          engineTemp: 85,
          batteryVoltage: 12.4
        },
        diagnostics: {
          dtcCodes: [],
          engineStatus: 'off',
          transmissionStatus: 'parked'
        }
      }
    },
    {
      name: 'Error Condition',
      data: {
        deviceID: 'ESP32_BLOCKX_002',
        status: 'error',
        timestamp: Date.now() + 180000,
        vin: 'BLOCKX987654321',
        mileage: 75420,
        dataSource: 'obd_port',
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10
        },
        vehicleData: {
          speed: 0,
          rpm: 0,
          fuelLevel: 15,
          engineTemp: 110,
          batteryVoltage: 11.8
        },
        diagnostics: {
          dtcCodes: ['P0301', 'P0420'],
          engineStatus: 'check_engine',
          transmissionStatus: 'normal'
        },
        errorDetails: {
          errorCode: 'OBD_CONNECTION_LOST',
          errorMessage: 'Lost connection to OBD port',
          severity: 'medium'
        }
      }
    }
  ];

  const results = {
    totalTests: testPayloads.length,
    passed: 0,
    failed: 0,
    details: []
  };

  console.log(`📊 Running ${testPayloads.length} IoT ingestion tests...\n`);

  for (let i = 0; i < testPayloads.length; i++) {
    const test = testPayloads[i];
    console.log(`🧪 Test ${i + 1}: ${test.name}`);
    
    try {
      // Send POST request to device endpoint
      const response = await axios.post(deviceEndpoint, test.data, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ESP32-BlockX-Device/1.0'
        },
        timeout: 10000
      });

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Test ${i + 1} PASSED - Status: ${response.status}`);
        console.log(`📄 Response: ${JSON.stringify(response.data, null, 2)}`);
        results.passed++;
        results.details.push({
          test: test.name,
          status: 'PASSED',
          httpStatus: response.status,
          response: response.data
        });
      } else {
        console.log(`⚠️ Test ${i + 1} UNEXPECTED STATUS - Status: ${response.status}`);
        results.failed++;
        results.details.push({
          test: test.name,
          status: 'UNEXPECTED_STATUS',
          httpStatus: response.status,
          response: response.data
        });
      }

    } catch (error) {
      console.log(`❌ Test ${i + 1} FAILED - ${error.message}`);
      
      if (error.response) {
        console.log(`📄 Error Response: ${JSON.stringify(error.response.data, null, 2)}`);
        results.details.push({
          test: test.name,
          status: 'FAILED',
          httpStatus: error.response.status,
          error: error.response.data
        });
      } else {
        results.details.push({
          test: test.name,
          status: 'FAILED',
          error: error.message
        });
      }
      
      results.failed++;
    }

    console.log(''); // Empty line for readability
    
    // Wait between tests
    if (i < testPayloads.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('=== TEST SUMMARY ===');
  console.log(`Total Tests: ${results.totalTests}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Success Rate: ${((results.passed / results.totalTests) * 100).toFixed(1)}%`);

  if (results.passed === results.totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! IoT ingestion is working correctly.');
  } else if (results.passed > 0) {
    console.log('\n⚠️ PARTIAL SUCCESS - Some tests failed, check backend logs.');
  } else {
    console.log('\n❌ ALL TESTS FAILED - Backend may not be running or endpoint is broken.');
  }

  return results;
}

// Test with ESP32 server.js simulator
async function testWithESP32Simulator() {
  console.log('🧪 Testing with ESP32 Simulator...\n');
  
  // This would simulate the esp32Code/server.js sending data
  const esp32SimulatorUrl = 'http://localhost:3000'; // Assuming ESP32 simulator runs on 3000
  const esp32Endpoint = `${esp32SimulatorUrl}/esp32-status`;
  
  const simulatedESP32Data = {
    deviceID: 'ESP32_SIM_001',
    status: 'obd_connected',
    timestamp: Date.now(),
    vin: 'SIM123456789',
    mileage: 25000,
    dataSource: 'simulation',
    location: {
      latitude: 34.0522,
      longitude: -118.2437,
      accuracy: 5
    },
    vehicleData: {
      speed: 25,
      rpm: 1800,
      fuelLevel: 60,
      engineTemp: 88,
      batteryVoltage: 13.2
    }
  };

  try {
    console.log('📤 Sending data to ESP32 simulator endpoint...');
    const response = await axios.post(esp32Endpoint, simulatedESP32Data, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    console.log(`✅ ESP32 Simulator Response: ${response.status}`);
    console.log(`📄 Response Data: ${JSON.stringify(response.data, null, 2)}`);
    return true;

  } catch (error) {
    console.log(`❌ ESP32 Simulator Test Failed: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Tip: Make sure esp32Code/server.js is running on port 3000');
    }
    return false;
  }
}

// Main test function
async function runAllIoTTests() {
  console.log('🚀 Starting Complete IoT Ingestion Tests\n');
  
  // Test 1: Direct backend API testing
  console.log('=== BACKEND API TESTS ===');
  const backendResults = await testIoTIngestion();
  
  console.log('\n=== ESP32 SIMULATOR TESTS ===');
  const simulatorResults = await testWithESP32Simulator();
  
  console.log('\n=== OVERALL RESULTS ===');
  console.log(`Backend API Tests: ${backendResults.passed}/${backendResults.totalTests} passed`);
  console.log(`ESP32 Simulator Test: ${simulatorResults ? 'PASSED' : 'FAILED'}`);
  
  const overallSuccess = (backendResults.passed === backendResults.totalTests) && simulatorResults;
  console.log(`Overall Status: ${overallSuccess ? '✅ ALL SYSTEMS GO' : '⚠️ NEEDS ATTENTION'}`);
  
  return {
    backend: backendResults,
    simulator: simulatorResults,
    overall: overallSuccess
  };
}

// Run tests if called directly
if (require.main === module) {
  runAllIoTTests().catch(console.error);
}

module.exports = { testIoTIngestion, testWithESP32Simulator, runAllIoTTests };
