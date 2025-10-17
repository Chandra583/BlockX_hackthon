const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

// Import models
const Vehicle = require('../backend/src/models/core/Vehicle.model').default;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blockx');

const migrateTrustScores = async () => {
  try {
    console.log('Starting trustScore migration...');
    
    // Find all vehicles without trustScore or with null trustScore
    const vehicles = await Vehicle.find({
      $or: [
        { trustScore: { $exists: false } },
        { trustScore: null }
      ]
    });
    
    console.log(`Found ${vehicles.length} vehicles to update`);
    
    // Update each vehicle with default trustScore of 100
    for (const vehicle of vehicles) {
      await Vehicle.findByIdAndUpdate(vehicle._id, {
        trustScore: 100
      });
      console.log(`Updated vehicle ${vehicle.vin} with trustScore 100`);
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateTrustScores();