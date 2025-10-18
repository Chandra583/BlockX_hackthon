#!/usr/bin/env node

/**
 * Script to sync InstallationRequest records with Install records
 * This script creates Install records for assigned InstallationRequests
 * to ensure service providers can see their assigned installations
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blockx';

console.log('🔄 Syncing InstallationRequest records with Install records...');
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
    const hasInstallationRequests = collections.some(c => c.name === 'installationrequests');
    const hasInstalls = collections.some(c => c.name === 'installs');
    
    console.log(`📊 Collections status: InstallationRequests=${hasInstallationRequests}, Installs=${hasInstalls}`);
    
    if (!hasInstallationRequests) {
      console.log('❌ InstallationRequests collection not found');
      process.exit(1);
    }
    
    if (!hasInstalls) {
      console.log('❌ Installs collection not found');
      process.exit(1);
    }
    
    // Get collections
    const installationRequestsCollection = mongoose.connection.db.collection('installationrequests');
    const installsCollection = mongoose.connection.db.collection('installs');
    
    // Find assigned InstallationRequests that don't have corresponding Install records
    const assignedRequests = await installationRequestsCollection.find({ 
      status: 'assigned',
      serviceProviderId: { $exists: true, $ne: null }
    }).toArray();
    
    console.log(`📋 Found ${assignedRequests.length} assigned InstallationRequests`);
    
    let createdCount = 0;
    let skippedCount = 0;
    
    // Process each assigned request
    for (const request of assignedRequests) {
      // Check if Install record already exists for this request
      const existingInstall = await installsCollection.findOne({ 
        _id: request._id 
      });
      
      if (existingInstall) {
        console.log(`⏭️  Install record already exists for request ${request._id}`);
        skippedCount++;
        continue;
      }
      
      // Create Install record from InstallationRequest
      const installRecord = {
        _id: request._id,
        vehicleId: request.vehicleId,
        ownerId: request.ownerId,
        serviceProviderId: request.serviceProviderId,
        status: request.status,
        deviceId: request.deviceId,
        requestedAt: request.createdAt,
        assignedAt: request.updatedAt, // Use updatedAt as assignedAt since we don't have a specific assignedAt field
        notes: request.notes,
        priority: 'medium', // Default priority
        history: request.history || [],
        createdAt: request.createdAt,
        updatedAt: request.updatedAt
      };
      
      try {
        await installsCollection.insertOne(installRecord);
        console.log(`✅ Created Install record for request ${request._id}`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Failed to create Install record for request ${request._id}:`, error.message);
      }
    }
    
    console.log(`\n📊 Sync Summary:`);
    console.log(`  - Created: ${createdCount} Install records`);
    console.log(`  - Skipped: ${skippedCount} existing records`);
    
    // Also check for any Install records that are assigned but don't have proper status
    const assignedInstalls = await installsCollection.find({ 
      status: 'assigned',
      serviceProviderId: { $exists: true, $ne: null }
    }).toArray();
    
    console.log(`📋 Found ${assignedInstalls.length} assigned Install records`);
    
    // Summary
    console.log('\n✅ Sync completed successfully!');
    console.log('Service providers should now see their assigned installations.');
    
  } catch (error) {
    console.error('❌ Failed to sync InstallationRequests:', error);
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