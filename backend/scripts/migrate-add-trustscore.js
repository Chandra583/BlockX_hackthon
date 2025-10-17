const mongoose = require('mongoose');
const Vehicle = require('../dist/models/core/Vehicle.model').default;
require('dotenv').config();

/**
 * Migration script to add trustScore field to existing vehicles
 * This script will:
 * 1. Add trustScore field to all existing vehicles (default: 100)
 * 2. Create index on trustScore field
 * 3. Update vehicles with calculated trust scores based on existing data
 */

async function migrateAddTrustScore() {
  try {
    console.log('🚀 Starting trustScore migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/veridrive', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Get all vehicles
    const vehicles = await Vehicle.find({});
    console.log(`📊 Found ${vehicles.length} vehicles to migrate`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const vehicle of vehicles) {
      try {
        // Check if trustScore already exists
        if (vehicle.trustScore !== undefined) {
          console.log(`⏭️  Skipping vehicle ${vehicle.vin} - trustScore already exists`);
          skippedCount++;
          continue;
        }

        // Calculate initial trust score based on existing data
        let trustScore = 100; // Start with perfect score

        // Reduce score based on fraud alerts
        if (vehicle.fraudAlerts && vehicle.fraudAlerts.length > 0) {
          const activeAlerts = vehicle.fraudAlerts.filter(alert => alert.status === 'active');
          trustScore -= activeAlerts.length * 10;
          
          const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');
          trustScore -= criticalAlerts.length * 20;
        }

        // Adjust based on verification status
        if (vehicle.verificationStatus === 'verified') {
          trustScore += 10;
        } else if (vehicle.verificationStatus === 'flagged') {
          trustScore -= 20;
        } else if (vehicle.verificationStatus === 'rejected') {
          trustScore -= 30;
        }

        // Adjust based on service history
        if (vehicle.serviceHistory && vehicle.serviceHistory.length > 0) {
          const recentServices = vehicle.serviceHistory.filter(
            service => service.verified && 
            service.serviceDate > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
          );
          trustScore += Math.min(recentServices.length * 2, 10);
        }

        // Ensure score is within bounds
        trustScore = Math.max(0, Math.min(100, trustScore));

        // Update vehicle with trustScore
        await Vehicle.findByIdAndUpdate(vehicle._id, {
          $set: { trustScore }
        });

        console.log(`✅ Updated vehicle ${vehicle.vin} with trustScore: ${trustScore}`);
        updatedCount++;

      } catch (error) {
        console.error(`❌ Failed to update vehicle ${vehicle.vin}:`, error.message);
      }
    }

    // Create index on trustScore field
    try {
      await Vehicle.collection.createIndex({ trustScore: -1 });
      console.log('✅ Created index on trustScore field');
    } catch (error) {
      console.warn('⚠️  Failed to create trustScore index:', error.message);
    }

    // Create compound indexes for better performance
    try {
      await Vehicle.collection.createIndex({ ownerId: 1, trustScore: -1 });
      await Vehicle.collection.createIndex({ isForSale: 1, trustScore: -1 });
      await Vehicle.collection.createIndex({ verificationStatus: 1, trustScore: -1 });
      console.log('✅ Created compound indexes');
    } catch (error) {
      console.warn('⚠️  Failed to create compound indexes:', error.message);
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Updated vehicles: ${updatedCount}`);
    console.log(`⏭️  Skipped vehicles: ${skippedCount}`);
    console.log(`📈 Total vehicles processed: ${vehicles.length}`);

    // Verify migration
    const vehiclesWithTrustScore = await Vehicle.countDocuments({ trustScore: { $exists: true } });
    console.log(`🔍 Vehicles with trustScore: ${vehiclesWithTrustScore}`);

    // Show trust score distribution
    const trustScoreStats = await Vehicle.aggregate([
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $gte: ['$trustScore', 90] }, then: 'Excellent (90-100)' },
                { case: { $gte: ['$trustScore', 70] }, then: 'Good (70-89)' },
                { case: { $gte: ['$trustScore', 50] }, then: 'Fair (50-69)' },
                { case: { $gte: ['$trustScore', 0] }, then: 'Poor (0-49)' }
              ],
              default: 'Unknown'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n📊 Trust Score Distribution:');
    trustScoreStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} vehicles`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateAddTrustScore()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateAddTrustScore };



