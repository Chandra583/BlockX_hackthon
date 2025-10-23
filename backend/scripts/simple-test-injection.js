const axios = require('axios');

const DEVICE_ID = 'OBD30011';
const VIN = '1HGCM82633A12DSKL';
const BASE_URL = 'http://localhost:3000/api';

// Simple 3-day test with realistic scenarios
const testDays = [
  {
    day: 1,
    date: '2025-01-12',
    name: 'Installation Day',
    trips: [
      { start: 40, end: 42, description: 'Test drive after installation' },
      { start: 42, end: 45, description: 'Drive to gas station' }
    ]
  },
  {
    day: 2,
    date: '2025-01-13',
    name: 'Daily Commute',
    trips: [
      { start: 45, end: 52, description: 'Morning commute' },
      { start: 52, end: 58, description: 'Lunch break' },
      { start: 58, end: 65, description: 'Evening commute' }
    ]
  },
  {
    day: 3,
    date: '2025-01-14',
    name: 'Weekend Trip',
    trips: [
      { start: 65, end: 85, description: 'Weekend shopping' },
      { start: 85, end: 90, description: 'Return home' }
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

async function runSimpleTest() {
  console.log('🚀 Starting simple 3-day test data injection...');
  console.log(`📱 Device: ${DEVICE_ID}`);
  console.log(`🚗 VIN: ${VIN}`);
  console.log(`🌐 API: ${BASE_URL}\n`);

  for (const day of testDays) {
    console.log(`📅 Day ${day.day} - ${day.date} (${day.name})`);
    console.log(`   Trips: ${day.trips.length}`);
    
    for (let i = 0; i < day.trips.length; i++) {
      const trip = day.trips[i];
      console.log(`   🚗 Trip ${i + 1}: ${trip.description}`);
      console.log(`      Mileage: ${trip.start}km → ${trip.end}km (${trip.end - trip.start}km)`);
      
      // Trip start
      const startTime = createTimestamp(day.date, 8 + (i * 3), 0);
      const startData = generateTelemetryData(DEVICE_ID, VIN, trip.start, startTime, false);
      
      console.log(`      📤 Sending trip start...`);
      const startResult = await sendTelemetryData(startData);
      if (startResult.success) {
        console.log(`      ✅ Trip start sent`);
      } else {
        console.log(`      ❌ Trip start failed:`, startResult.error);
      }
      
      // Trip end
      const endTime = startTime + (30 * 60 * 1000); // 30 minutes later
      const endData = generateTelemetryData(DEVICE_ID, VIN, trip.end, endTime, true);
      
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
    
    console.log(`   ✅ Day ${day.day} completed. Final mileage: ${day.trips[day.trips.length - 1].end}km\n`);
    
    // Delay between days
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🎉 Simple test data injection completed!');
  console.log('\n📊 Summary:');
  console.log(`   - Days: ${testDays.length}`);
  console.log(`   - Total trips: ${testDays.reduce((sum, day) => sum + day.trips.length, 0)}`);
  console.log(`   - Final mileage: ${testDays[testDays.length - 1].trips[testDays[testDays.length - 1].trips.length - 1].end}km`);
  
  console.log('\n🔍 Next steps:');
  console.log('   1. Check Daily Telemetry Batches UI in frontend');
  console.log('   2. Use the "Consolidate Today" button to trigger consolidation');
  console.log('   3. Verify Solana transaction hashes in explorer');
  console.log('   4. Check backend logs for consolidation status');
}

// Run the test
runSimpleTest().catch(console.error);
