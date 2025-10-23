const axios = require('axios');

const DEVICE_ID = 'OBD30011';
const VIN = '1HGCM82633A12DSKL';
const BASE_URL = 'http://localhost:3000/api';

// Quick test scenarios for 3 days
const quickTestData = [
  // Day 1 - Installation day
  {
    day: 1,
    date: '2025-01-12',
    trips: [
      { startMileage: 40, endMileage: 42, hour: 10, minute: 0, description: "Test drive after installation" },
      { startMileage: 42, endMileage: 45, hour: 14, minute: 30, description: "Drive to gas station" }
    ]
  },
  // Day 2 - Daily commute
  {
    day: 2,
    date: '2025-01-13',
    trips: [
      { startMileage: 45, endMileage: 52, hour: 8, minute: 0, description: "Morning commute" },
      { startMileage: 52, endMileage: 58, hour: 12, minute: 0, description: "Lunch break" },
      { startMileage: 58, endMileage: 65, hour: 17, minute: 30, description: "Evening commute" }
    ]
  },
  // Day 3 - Weekend trip
  {
    day: 3,
    date: '2025-01-14',
    trips: [
      { startMileage: 65, endMileage: 85, hour: 9, minute: 0, description: "Weekend shopping trip" },
      { startMileage: 85, endMileage: 90, hour: 15, minute: 0, description: "Return home" }
    ]
  }
];

function createTimestamp(dateString, hour, minute) {
  const date = new Date(dateString);
  date.setHours(hour, minute, 0, 0);
  return date.getTime();
}

function generateTelemetryData(deviceId, vin, mileage, timestamp, isTripEnd = false) {
  return {
    deviceID: deviceId,
    status: 'obd_connected',
    vin: vin,
    mileage: mileage,
    rpm: Math.floor(Math.random() * 2000) + 1500,
    speed: Math.floor(Math.random() * 60) + 30,
    engineTemp: Math.floor(Math.random() * 15) + 85,
    fuelLevel: Math.floor(Math.random() * 20) + 60,
    batteryVoltage: (Math.random() * 1 + 12.2).toFixed(1),
    dataQuality: Math.floor(Math.random() * 5) + 95,
    odometerPID: '0x201C',
    dataSource: 'veepeak_obd',
    timestamp: timestamp,
    ...(isTripEnd ? { tripEnd: true, engineOff: true } : { tripStart: true, engineOn: true })
  };
}

async function sendTelemetryData(data) {
  try {
    const response = await axios.post(`${BASE_URL}/device/status`, data);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
}

async function triggerConsolidation(vehicleId, date) {
  try {
    const response = await axios.post(`${BASE_URL}/vehicles/${vehicleId}/consolidate-batch`, {
      date: date
    });
    return response.data;
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
}

async function runQuickTest() {
  console.log('🚀 Starting quick 3-day test data injection...');
  console.log(`📱 Device: ${DEVICE_ID}`);
  console.log(`🚗 VIN: ${VIN}`);
  console.log(`🌐 API: ${BASE_URL}\n`);

  for (const day of quickTestData) {
    console.log(`📅 Day ${day.day} - ${day.date}`);
    console.log(`   Trips: ${day.trips.length}`);
    
    for (let i = 0; i < day.trips.length; i++) {
      const trip = day.trips[i];
      console.log(`   🚗 Trip ${i + 1}: ${trip.description}`);
      console.log(`      Mileage: ${trip.startMileage}km → ${trip.endMileage}km`);
      
      // Trip start
      const startTime = createTimestamp(day.date, trip.hour, trip.minute);
      const startData = generateTelemetryData(DEVICE_ID, VIN, trip.startMileage, startTime, false);
      
      console.log(`      📤 Sending trip start...`);
      const startResult = await sendTelemetryData(startData);
      if (startResult.success) {
        console.log(`      ✅ Trip start sent`);
      } else {
        console.log(`      ❌ Trip start failed:`, startResult.error);
      }
      
      // Trip end
      const endTime = startTime + (30 * 60 * 1000); // 30 minutes later
      const endData = generateTelemetryData(DEVICE_ID, VIN, trip.endMileage, endTime, true);
      
      console.log(`      📤 Sending trip end...`);
      const endResult = await sendTelemetryData(endData);
      if (endResult.success) {
        console.log(`      ✅ Trip end sent`);
      } else {
        console.log(`      ❌ Trip end failed:`, endResult.error);
      }
      
      // Small delay between trips
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Trigger consolidation for this day
    console.log(`   🔄 Triggering consolidation for ${day.date}...`);
    const consolidateResult = await triggerConsolidation('68f76921df4eb8fa3db14d34', day.date);
    
    if (consolidateResult.success) {
      console.log(`   ✅ Consolidation successful`);
      if (consolidateResult.data?.solanaTx) {
        console.log(`   🔗 Solana TX: ${consolidateResult.data.solanaTx}`);
      }
    } else {
      console.log(`   ❌ Consolidation failed:`, consolidateResult.error);
    }
    
    console.log(`   ✅ Day ${day.day} completed\n`);
    
    // Delay between days
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🎉 Quick test data injection completed!');
  console.log('\n📊 Summary:');
  console.log(`   - Days: ${quickTestData.length}`);
  console.log(`   - Total trips: ${quickTestData.reduce((sum, day) => sum + day.trips.length, 0)}`);
  console.log(`   - Final mileage: ${quickTestData[quickTestData.length - 1].trips[quickTestData[quickTestData.length - 1].trips.length - 1].endMileage}km`);
  
  console.log('\n🔍 Next steps:');
  console.log('   1. Check Daily Telemetry Batches UI');
  console.log('   2. Verify Solana transaction hashes');
  console.log('   3. Check backend logs for consolidation status');
}

// Run the test
runQuickTest().catch(console.error);
