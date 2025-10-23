const axios = require('axios');

// Configuration
const DEVICE_ID = 'OBD30011';
const VIN = '1HGCM82633A12DSKL';
const BASE_URL = 'http://localhost:3000/api';

// Test scenarios for 10 days
const testScenarios = [
  {
    day: 1,
    name: "Installation Day - Short Test Drive",
    baseMileage: 40,
    trips: [
      { startMileage: 40, endMileage: 42, duration: 15, description: "Test drive after installation" },
      { startMileage: 42, endMileage: 45, duration: 20, description: "Drive to gas station" }
    ]
  },
  {
    day: 2,
    name: "Daily Commute",
    baseMileage: 45,
    trips: [
      { startMileage: 45, endMileage: 52, duration: 25, description: "Morning commute to work" },
      { startMileage: 52, endMileage: 58, duration: 20, description: "Lunch break drive" },
      { startMileage: 58, endMileage: 65, duration: 30, description: "Evening commute home" }
    ]
  },
  {
    day: 3,
    name: "Weekend Shopping",
    baseMileage: 65,
    trips: [
      { startMileage: 65, endMileage: 72, duration: 35, description: "Drive to shopping mall" },
      { startMileage: 72, endMileage: 78, duration: 20, description: "Drive to grocery store" },
      { startMileage: 78, endMileage: 85, duration: 25, description: "Return home" }
    ]
  },
  {
    day: 4,
    name: "Long Highway Trip",
    baseMileage: 85,
    trips: [
      { startMileage: 85, endMileage: 120, duration: 45, description: "Highway trip to nearby city" },
      { startMileage: 120, endMileage: 125, duration: 15, description: "City driving" },
      { startMileage: 125, endMileage: 160, duration: 50, description: "Return highway trip" }
    ]
  },
  {
    day: 5,
    name: "Regular Commute with Traffic",
    baseMileage: 160,
    trips: [
      { startMileage: 160, endMileage: 168, duration: 40, description: "Heavy traffic morning commute" },
      { startMileage: 168, endMileage: 175, duration: 25, description: "Client meeting drive" },
      { startMileage: 175, endMileage: 182, duration: 35, description: "Evening traffic home" }
    ]
  },
  {
    day: 6,
    name: "Service Day - Pre-Service Drive",
    baseMileage: 182,
    trips: [
      { startMileage: 182, endMileage: 185, duration: 10, description: "Short drive before service" }
    ]
  },
  {
    day: 7,
    name: "Post-Service Test Drive",
    baseMileage: 185,
    trips: [
      { startMileage: 185, endMileage: 190, duration: 20, description: "Post-service test drive" },
      { startMileage: 190, endMileage: 195, duration: 15, description: "Additional testing" }
    ]
  },
  {
    day: 8,
    name: "Family Trip",
    baseMileage: 195,
    trips: [
      { startMileage: 195, endMileage: 220, duration: 60, description: "Family trip to park" },
      { startMileage: 220, endMileage: 225, duration: 15, description: "Park exploration" },
      { startMileage: 225, endMileage: 250, duration: 55, description: "Return home" }
    ]
  },
  {
    day: 9,
    name: "Business Meetings",
    baseMileage: 250,
    trips: [
      { startMileage: 250, endMileage: 260, duration: 30, description: "Drive to first meeting" },
      { startMileage: 260, endMileage: 270, duration: 25, description: "Second meeting location" },
      { startMileage: 270, endMileage: 275, duration: 20, description: "Return to office" }
    ]
  },
  {
    day: 10,
    name: "Mixed Usage Day",
    baseMileage: 275,
    trips: [
      { startMileage: 275, endMileage: 280, duration: 15, description: "Morning errand" },
      { startMileage: 280, endMileage: 285, duration: 20, description: "Lunch drive" },
      { startMileage: 285, endMileage: 290, duration: 18, description: "Evening drive" },
      { startMileage: 290, endMileage: 295, duration: 22, description: "Final trip of day" }
    ]
  }
];

// Helper function to generate realistic telemetry data
function generateTelemetryData(deviceId, vin, mileage, timestamp, isTripStart = false) {
  const baseData = {
    deviceID: deviceId,
    status: 'obd_connected',
    vin: vin,
    mileage: mileage,
    rpm: Math.floor(Math.random() * 3000) + 1000,
    speed: Math.floor(Math.random() * 80) + 20,
    engineTemp: Math.floor(Math.random() * 20) + 80,
    fuelLevel: Math.floor(Math.random() * 30) + 50,
    batteryVoltage: (Math.random() * 2 + 12).toFixed(1),
    dataQuality: Math.floor(Math.random() * 10) + 90,
    odometerPID: '0x201C',
    dataSource: 'veepeak_obd',
    timestamp: timestamp
  };

  // Add trip-specific data
  if (isTripStart) {
    baseData.tripStart = true;
    baseData.engineOn = true;
  } else {
    baseData.tripEnd = true;
    baseData.engineOff = true;
  }

  return baseData;
}

// Helper function to create time-based timestamp
function createTimestamp(daysAgo, hour, minute) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.getTime();
}

// Main injection function
async function injectTestData() {
  try {
    console.log('🚀 Starting 10-day test data injection for device OBD30011...');
    console.log('📱 Device:', DEVICE_ID);
    console.log('🚗 VIN:', VIN);
    console.log('🌐 API:', BASE_URL);

    // Process each day
    for (const scenario of testScenarios) {
      console.log(`\n📅 Processing Day ${scenario.day}: ${scenario.name}`);
      
      const dayDate = new Date();
      dayDate.setDate(dayDate.getDate() - (10 - scenario.day));
      const dateString = dayDate.toISOString().split('T')[0];
      
      console.log(`   Date: ${dateString}, Base Mileage: ${scenario.baseMileage}km`);
      
      let currentMileage = scenario.baseMileage;
      let tripNumber = 1;
      
      // Process each trip for the day
      for (const trip of scenario.trips) {
        console.log(`   🚗 Trip ${tripNumber}: ${trip.description}`);
        console.log(`      Mileage: ${trip.startMileage}km → ${trip.endMileage}km (${trip.endMileage - trip.startMileage}km)`);
        
        // Generate trip start data
        const tripStartTime = createTimestamp(10 - scenario.day, 8 + (tripNumber * 2), 0);
        const tripStartData = generateTelemetryData(DEVICE_ID, VIN, trip.startMileage, tripStartTime, true);
        
        // Generate trip end data
        const tripEndTime = tripStartTime + (trip.duration * 60 * 1000);
        const tripEndData = generateTelemetryData(DEVICE_ID, VIN, trip.endMileage, tripEndTime, false);
        
        // Send data via API
        try {
          console.log(`      📤 Sending trip start data...`);
          await axios.post(`${BASE_URL}/device/status`, tripStartData);
          
          console.log(`      📤 Sending trip end data...`);
          await axios.post(`${BASE_URL}/device/status`, tripEndData);
          
          console.log(`      ✅ Trip ${tripNumber} data sent successfully`);
        } catch (error) {
          console.log(`      ❌ Error sending trip ${tripNumber} data:`, error.response?.data || error.message);
        }
        
        currentMileage = trip.endMileage;
        tripNumber++;
        
        // Small delay between trips
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`   ✅ Day ${scenario.day} completed. Final mileage: ${currentMileage}km`);
      
      // Trigger consolidation for this day
      try {
        console.log(`   🔄 Triggering consolidation for ${dateString}...`);
        const consolidateResponse = await axios.post(`${BASE_URL}/vehicles/68f76921df4eb8fa3db14d34/consolidate-batch`, {
          date: dateString
        });
        
        if (consolidateResponse.data.success) {
          console.log(`   ✅ Consolidation successful for ${dateString}`);
          if (consolidateResponse.data.data?.solanaTx) {
            console.log(`   🔗 Solana TX: ${consolidateResponse.data.data.solanaTx}`);
          }
        } else {
          console.log(`   ⚠️ Consolidation failed for ${dateString}: ${consolidateResponse.data.error}`);
        }
      } catch (error) {
        console.log(`   ❌ Consolidation error for ${dateString}:`, error.response?.data || error.message);
      }
      
      // Delay between days
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n🎉 10-day test data injection completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Device: ${DEVICE_ID}`);
    console.log(`   - VIN: ${VIN}`);
    console.log(`   - Days processed: ${testScenarios.length}`);
    console.log(`   - Total trips: ${testScenarios.reduce((sum, day) => sum + day.trips.length, 0)}`);
    console.log(`   - Final mileage: ${testScenarios[testScenarios.length - 1].trips[testScenarios[testScenarios.length - 1].trips.length - 1].endMileage}km`);
    
    console.log('\n🔍 Check the following:');
    console.log('   1. Daily Telemetry Batches UI in frontend');
    console.log('   2. Solana explorer for transaction hashes');
    console.log('   3. Database telemetry_batches collection');
    console.log('   4. Backend logs for consolidation status');
    
  } catch (error) {
    console.error('❌ Error during test data injection:', error);
  }
}

// Run the injection
if (require.main === module) {
  injectTestData().catch(console.error);
}

module.exports = { injectTestData, testScenarios };
