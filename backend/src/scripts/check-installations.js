#!/usr/bin/env node

/**
 * Script to check all installations in the database
 * This script shows all installations and their service provider assignments
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blockx';

console.log('🔍 Checking all installations in the database...');
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
    // Get collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Available collections:', collections.map(c => c.name));
    
    // Check if we have the required collections
    const hasInstalls = collections.some(c => c.name === 'installs');
    
    console.log(`📊 Collections status: Installs=${hasInstalls}`);
    
    if (!hasInstalls) {
      console.log('❌ Installs collection not found');
      process.exit(1);
    }
    
    // Get collections
    const installsCollection = mongoose.connection.db.collection('installs');
    
    // Find all installations
    const allInstalls = await installsCollection.find({}).toArray();
    
    console.log(`\n📋 Found ${allInstalls.length} total installations:`);
    
    for (const install of allInstalls) {
      console.log(`\n--- Installation ${install._id} ---`);
      console.log(`  Status: ${install.status}`);
      console.log(`  Service Provider ID: ${install.serviceProviderId}`);
      console.log(`  Vehicle ID: ${install.vehicleId}`);
      console.log(`  Owner ID: ${install.ownerId}`);
      console.log(`  Requested At: ${install.requestedAt}`);
      console.log(`  Assigned At: ${install.assignedAt}`);
    }
    
    // Find assigned installations for our test service provider
    const testServiceProviderId = '68f0d839858841d5bbf28ade';
    const assignedToTestProvider = await installsCollection.find({ 
      serviceProviderId: testServiceProviderId,
      status: 'assigned'
    }).toArray();
    
    console.log(`\n📋 Found ${assignedToTestProvider.length} installations assigned to test service provider (${testServiceProviderId}):`);
    
    for (const install of assignedToTestProvider) {
      console.log(`\n--- Assigned Installation ${install._id} ---`);
      console.log(`  Status: ${install.status}`);
      console.log(`  Service Provider ID: ${install.serviceProviderId}`);
      console.log(`  Vehicle ID: ${install.vehicleId}`);
      console.log(`  Owner ID: ${install.ownerId}`);
      console.log(`  Requested At: ${install.requestedAt}`);
      console.log(`  Assigned At: ${install.assignedAt}`);
    }
    
    // Summary
    console.log('\n✅ Check completed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to check installations:', error);
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
  console.log('\n🛑 Script interrupted by user');
  await mongoose.connection.close();
  console.log('🔒 Database connection closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Script terminated');
  await mongoose.connection.close();
  console.log('🔒 Database connection closed');
  process.exit(0);
});