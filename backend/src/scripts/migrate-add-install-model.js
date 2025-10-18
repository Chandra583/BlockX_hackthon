#!/usr/bin/env node

/**
 * Migration script to add install model fields and indexes
 * This script ensures all existing install documents have the required fields
 * and creates necessary database indexes for optimal performance.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
const { Install } = require('../models/Install.model');
const Vehicle = require('../models/core/Vehicle.model');

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blockx';

console.log('🔄 Starting Install Model Migration...');
console.log(`🔗 Connecting to database: ${MONGODB_URI}`);

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', (error) => {
  console.error('❌ Database connection error:', error);
  process.exit(1);
});

db.once('open', async () => {
  console.log('✅ Database connected successfully');
  
  try {
    // 1. Add missing fields to existing Install documents
    console.log('📝 Updating existing Install documents...');
    
    const updateResult = await Install.updateMany(
      { 
        $or: [
          { status: { $exists: false } },
          { history: { $exists: false } },
          { solanaTx: { $exists: false } },
          { arweaveTx: { $exists: false } },
          { initialMileage: { $exists: false } },
          { startedAt: { $exists: false } }
        ]
      },
      {
        $set: {
          status: 'requested',
          history: [],
          solanaTx: null,
          arweaveTx: null,
          initialMileage: null,
          startedAt: null
        }
      },
      { multi: true }
    );
    
    console.log(`✅ Updated ${updateResult.modifiedCount} Install documents`);
    
    // 2. Ensure all vehicles have lastVerifiedMileage field
    console.log('📝 Updating Vehicle documents with lastVerifiedMileage...');
    
    const vehicleUpdateResult = await Vehicle.updateMany(
      { lastVerifiedMileage: { $exists: false } },
      { $set: { lastVerifiedMileage: 0 } },
      { multi: true }
    );
    
    console.log(`✅ Updated ${vehicleUpdateResult.modifiedCount} Vehicle documents`);
    
    // 3. Create database indexes
    console.log('.CreateIndexing database...');
    
    // Install model indexes
    await Install.collection.createIndexes([
      { key: { solanaTx: 1 } },
      { key: { arweaveTx: 1 } }
    ]);
    
    // Vehicle model indexes (if not already created)
    await Vehicle.collection.createIndexes([
      { key: { lastVerifiedMileage: 1 } }
    ]);
    
    console.log('✅ Database indexes created successfully');
    
    // 4. Migration summary
    const totalInstalls = await Install.countDocuments();
    const totalVehicles = await Vehicle.countDocuments();
    
    console.log('\n📊 Migration Summary:');
    console.log(`  - Total Install documents: ${totalInstalls}`);
    console.log(`  - Total Vehicle documents: ${totalVehicles}`);
    console.log(`  - Updated Install documents: ${updateResult.modifiedCount}`);
    console.log(`  - Updated Vehicle documents: ${vehicleUpdateResult.modifiedCount}`);
    
    console.log('\n✅ Install Model Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔒 Database connection closed');
    process.exit(0);
  }
});

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Migration interrupted by user');
  await mongoose.connection.close();
  console.log('🔒 Database connection closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Migration terminated');
  await mongoose.connection.close();
  console.log('🔒 Database connection closed');
  process.exit(0);
});