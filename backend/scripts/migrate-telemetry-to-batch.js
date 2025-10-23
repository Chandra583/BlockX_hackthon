const mongoose = require('mongoose');
const { TelemetryBatch } = require('../dist/models/TelemetryBatch.model');
const { VehicleTelemetry } = require('../dist/models/core/VehicleTelemetry.model');
const { Vehicle } = require('../dist/models/core/Vehicle.model');
const { Device } = require('../dist/models/core/Device.model');

/**
 * Migration script to convert existing telemetry data to new batch format
 * This script safely migrates existing telemetry records to the new batch anchoring system
 */

async function migrateTelemetryToBatch() {
  try {
    console.log('🔄 Starting telemetry to batch migration...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blockx');
    console.log('✅ Connected to database');
    
    // Get all vehicles with telemetry data
    const vehicles = await Vehicle.find({}).lean();
    console.log(`📊 Found ${vehicles.length} vehicles to process`);
    
    let totalBatches = 0;
    let totalErrors = 0;
    
    for (const vehicle of vehicles) {
      try {
        console.log(`\n🚗 Processing vehicle ${vehicle.vin} (${vehicle._id})`);
        
        // Get all telemetry records for this vehicle, grouped by date
        const telemetryRecords = await VehicleTelemetry.find({
          vehicle: vehicle._id,
          'rawData.timestamp': { $exists: true }
        }).sort({ 'rawData.timestamp': 1 }).lean();
        
        if (telemetryRecords.length === 0) {
          console.log(`📭 No telemetry data found for vehicle ${vehicle.vin}`);
          continue;
        }
        
        // Group records by date
        const recordsByDate = {};
        telemetryRecords.forEach(record => {
          const date = new Date(record.rawData.timestamp).toISOString().split('T')[0];
          if (!recordsByDate[date]) {
            recordsByDate[date] = [];
          }
          recordsByDate[date].push(record);
        });
        
        console.log(`📅 Found telemetry data for ${Object.keys(recordsByDate).length} dates`);
        
        // Process each date
        for (const [date, records] of Object.entries(recordsByDate)) {
          try {
            // Check if batch already exists
            const existingBatch = await TelemetryBatch.findOne({
              vehicleId: vehicle._id,
              date: date
            });
            
            if (existingBatch) {
              console.log(`⏭️  Batch already exists for ${date}, skipping`);
              continue;
            }
            
            // Get device for this vehicle
            const device = await Device.findOne({ vehicle: vehicle._id }).lean();
            if (!device) {
              console.log(`⚠️  No device found for vehicle ${vehicle.vin}, skipping date ${date}`);
              continue;
            }
            
            // Process segments from telemetry records
            const segments = processTelemetrySegments(records);
            const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);
            
            // Create batch record
            const batch = new TelemetryBatch({
              installId: vehicle.ownerId, // Use owner as install ID for existing data
              vehicleId: vehicle._id,
              deviceId: device.deviceID,
              date: date,
              segments: segments,
              totalDistance: totalDistance,
              segmentsCount: segments.length,
              status: 'pending', // Will be processed by consolidation service
              lastRecordedMileage: vehicle.mileage,
              distanceDelta: totalDistance,
              batchData: records.map(r => ({
                timestamp: new Date(r.rawData.timestamp),
                mileage: r.obd?.mileage || 0,
                rpm: r.obd?.rpm || 0,
                speed: r.obd?.speed || 0,
                engineTemp: r.obd?.engineTemp || 0,
                fuelLevel: r.obd?.fuelLevel || 0,
                batteryVoltage: r.deviceHealth?.batteryVoltage || 0,
                dataQuality: r.dataQuality || 0,
                location: r.location || null,
                tamperingDetected: r.validation?.tamperingDetected || false,
                validationStatus: r.validation?.validationStatus || 'pending'
              })),
              recordedAt: new Date(records[records.length - 1].rawData.timestamp)
            });
            
            await batch.save();
            totalBatches++;
            console.log(`✅ Created batch for ${date} with ${segments.length} segments, ${totalDistance}km total`);
            
          } catch (dateError) {
            console.error(`❌ Error processing date ${date} for vehicle ${vehicle.vin}:`, dateError.message);
            totalErrors++;
          }
        }
        
      } catch (vehicleError) {
        console.error(`❌ Error processing vehicle ${vehicle.vin}:`, vehicleError.message);
        totalErrors++;
      }
    }
    
    console.log(`\n📊 Migration completed:`);
    console.log(`✅ Total batches created: ${totalBatches}`);
    console.log(`❌ Total errors: ${totalErrors}`);
    console.log(`\n💡 Next steps:`);
    console.log(`1. Run the consolidation service to anchor existing batches`);
    console.log(`2. Verify batch data in the database`);
    console.log(`3. Test the frontend display`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Disconnected from database');
  }
}

/**
 * Process telemetry records into segments
 */
function processTelemetrySegments(records) {
  const segments = [];
  let currentSegment = null;
  
  for (const record of records) {
    const timestamp = new Date(record.rawData.timestamp);
    const mileage = record.obd?.mileage || 0;
    
    if (!currentSegment) {
      // Start new segment
      currentSegment = {
        startTime: timestamp,
        endTime: timestamp,
        startMileage: mileage,
        endMileage: mileage,
        distance: 0
      };
    } else {
      // Update segment
      currentSegment.endTime = timestamp;
      currentSegment.endMileage = mileage;
      currentSegment.distance = Math.max(0, mileage - currentSegment.startMileage);
    }
    
    // Check if segment should be closed (gap > 30 minutes)
    const timeDiff = timestamp.getTime() - currentSegment.endTime.getTime();
    if (timeDiff > 30 * 60 * 1000) {
      // Close current segment
      segments.push({
        startTime: currentSegment.startTime,
        endTime: currentSegment.endTime,
        distance: currentSegment.distance
      });
      
      // Start new segment
      currentSegment = {
        startTime: timestamp,
        endTime: timestamp,
        startMileage: mileage,
        endMileage: mileage,
        distance: 0
      };
    }
  }
  
  // Close final segment
  if (currentSegment) {
    segments.push({
      startTime: currentSegment.startTime,
      endTime: currentSegment.endTime,
      distance: currentSegment.distance
    });
  }
  
  return segments;
}

// Run migration if called directly
if (require.main === module) {
  migrateTelemetryToBatch()
    .then(() => {
      console.log('🎉 Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateTelemetryToBatch };
