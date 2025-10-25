const mongoose = require('mongoose');
const { Vehicle } = require('../src/models/core/Vehicle.model');
const { VehicleTelemetry } = require('../src/models/core/VehicleTelemetry.model');

/**
 * Migration script to fix mileage field issues
 * 
 * This script:
 * 1. Ensures all vehicles have lastVerifiedMileage field
 * 2. Identifies telemetry records with potential field swaps
 * 3. Marks ambiguous records for review
 * 4. Does NOT auto-correct owner history
 */

async function migrateMileageFields() {
  try {
    console.log('🔄 Starting mileage fields migration...');

    // 1. Fix vehicles missing lastVerifiedMileage
    console.log('📋 Step 1: Fixing vehicles missing lastVerifiedMileage...');
    const vehiclesWithoutLastVerified = await Vehicle.find({
      $or: [
        { lastVerifiedMileage: { $exists: false } },
        { lastVerifiedMileage: null }
      ]
    });

    console.log(`Found ${vehiclesWithoutLastVerified.length} vehicles without lastVerifiedMileage`);

    for (const vehicle of vehiclesWithoutLastVerified) {
      const lastVerifiedMileage = vehicle.currentMileage || 0;
      
      await Vehicle.updateOne(
        { _id: vehicle._id },
        { 
          $set: { 
            lastVerifiedMileage: lastVerifiedMileage 
          } 
        }
      );
      
      console.log(`✅ Fixed vehicle ${vehicle.vin}: lastVerifiedMileage = ${lastVerifiedMileage}`);
    }

    // 2. Analyze telemetry records for potential issues
    console.log('📋 Step 2: Analyzing telemetry records...');
    const telemetryRecords = await VehicleTelemetry.find({
      'obd.mileage': { $exists: true, $gt: 0 }
    }).sort({ 'rawData.receivedAt': 1 });

    console.log(`Found ${telemetryRecords.length} telemetry records to analyze`);

    let flaggedCount = 0;
    let needsReviewCount = 0;

    for (const record of telemetryRecords) {
      const vehicle = await Vehicle.findById(record.vehicle);
      if (!vehicle) continue;

      const reportedMileage = record.obd.mileage;
      const vehicleMileage = vehicle.lastVerifiedMileage || vehicle.currentMileage || 0;
      const delta = reportedMileage - vehicleMileage;

      // Check for potential rollback
      if (delta < -5) {
        // This is a rollback - mark as flagged
        await VehicleTelemetry.updateOne(
          { _id: record._id },
          {
            $set: {
              'validation.tamperingDetected': true,
              'validation.validationStatus': 'ROLLBACK_DETECTED',
              'validation.lastKnownMileage': vehicleMileage,
              'validation.mileageIncrement': delta,
              needsReview: true,
              flaggedReason: `Potential rollback: ${vehicleMileage} -> ${reportedMileage} (${delta} km)`
            }
          }
        );

        flaggedCount++;
        console.log(`🚨 Flagged rollback: Vehicle ${vehicle.vin} - ${vehicleMileage} -> ${reportedMileage} (${delta} km)`);
      }
      // Check for suspicious large increase
      else if (delta > 1000) {
        await VehicleTelemetry.updateOne(
          { _id: record._id },
          {
            $set: {
              'validation.validationStatus': 'SUSPICIOUS',
              'validation.lastKnownMileage': vehicleMileage,
              'validation.mileageIncrement': delta,
              needsReview: true,
              flaggedReason: `Large increase: ${vehicleMileage} -> ${reportedMileage} (${delta} km)`
            }
          }
        );

        needsReviewCount++;
        console.log(`⚠️ Marked for review: Vehicle ${vehicle.vin} - ${vehicleMileage} -> ${reportedMileage} (${delta} km)`);
      }
      // Valid record
      else {
        await VehicleTelemetry.updateOne(
          { _id: record._id },
          {
            $set: {
              'validation.validationStatus': 'VALID',
              'validation.lastKnownMileage': vehicleMileage,
              'validation.mileageIncrement': delta,
              'validation.tamperingDetected': false
            }
          }
        );
      }
    }

    // 3. Create summary report
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Fixed ${vehiclesWithoutLastVerified.length} vehicles missing lastVerifiedMileage`);
    console.log(`🚨 Flagged ${flaggedCount} telemetry records as rollbacks`);
    console.log(`⚠️ Marked ${needsReviewCount} records for review`);
    console.log(`✅ Processed ${telemetryRecords.length} total telemetry records`);

    // 4. Create admin report
    const flaggedRecords = await VehicleTelemetry.find({ needsReview: true });
    console.log('\n📋 Records requiring admin review:');
    for (const record of flaggedRecords) {
      const vehicle = await Vehicle.findById(record.vehicle);
      console.log(`- Record ${record._id}: Vehicle ${vehicle?.vin} - ${record.flaggedReason}`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('⚠️ Please review flagged records in the admin panel.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blockx')
    .then(() => {
      console.log('Connected to MongoDB');
      return migrateMileageFields();
    })
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateMileageFields };

