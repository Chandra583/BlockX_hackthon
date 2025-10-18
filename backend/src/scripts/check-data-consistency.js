#!/usr/bin/env node

/**
 * Script to check data consistency for installation assignments
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkDataConsistency() {
  console.log('🔍 Checking data consistency for installation assignments...');
  
  try {
    // Database connection
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blockx';
    console.log(`🔗 Connecting to database: ${MONGODB_URI}`);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Database connected successfully');
    
    const installsCollection = mongoose.connection.db.collection('installs');
    
    // Check for installations with serviceProviderId as string
    console.log('\n🔍 Checking for installations with string serviceProviderId...');
    const stringSpIdInstalls = await installsCollection.find({ 
      serviceProviderId: { $type: 'string' }
    }).toArray();
    
    console.log(`   Found ${stringSpIdInstalls.length} installations with string serviceProviderId`);
    
    if (stringSpIdInstalls.length > 0) {
      console.log('   These installations need to be fixed:');
      stringSpIdInstalls.forEach(install => {
        console.log(`     - ID: ${install._id}, Status: ${install.status}, SP ID: ${install.serviceProviderId}`);
      });
    }
    
    // Check for installations with serviceProviderId as ObjectId
    console.log('\n🔍 Checking for installations with ObjectId serviceProviderId...');
    const objectIdSpIdInstalls = await installsCollection.find({ 
      serviceProviderId: { $type: 'objectId' }
    }).toArray();
    
    console.log(`   Found ${objectIdSpIdInstalls.length} installations with ObjectId serviceProviderId`);
    
    // Check for installations with assigned status but no serviceProviderId
    console.log('\n🔍 Checking for assigned installations without serviceProviderId...');
    const assignedWithoutSp = await installsCollection.find({ 
      status: 'assigned',
      serviceProviderId: { $exists: false }
    }).toArray();
    
    console.log(`   Found ${assignedWithoutSp.length} assigned installations without serviceProviderId`);
    
    if (assignedWithoutSp.length > 0) {
      console.log('   These installations are problematic:');
      assignedWithoutSp.forEach(install => {
        console.log(`     - ID: ${install._id}, Status: ${install.status}`);
      });
    }
    
    // Check installations with in_progress status
    console.log('\n🔍 Checking for in_progress installations...');
    const inProgressInstalls = await installsCollection.find({ 
      status: 'in_progress'
    }).toArray();
    
    console.log(`   Found ${inProgressInstalls.length} in_progress installations`);
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`   - String serviceProviderId: ${stringSpIdInstalls.length}`);
    console.log(`   - ObjectId serviceProviderId: ${objectIdSpIdInstalls.length}`);
    console.log(`   - Assigned without SP ID: ${assignedWithoutSp.length}`);
    console.log(`   - In progress: ${inProgressInstalls.length}`);
    
    // Check a few sample installations in detail
    console.log('\n🔍 Detailed sample check...');
    const sampleInstalls = await installsCollection.find({ 
      status: { $in: ['assigned', 'in_progress'] }
    }).limit(5).toArray();
    
    if (sampleInstalls.length > 0) {
      console.log(`   Checking ${sampleInstalls.length} sample installations:`);
      sampleInstalls.forEach(install => {
        console.log(`     - ID: ${install._id}`);
        console.log(`       Status: ${install.status}`);
        console.log(`       Service Provider ID: ${install.serviceProviderId}`);
        console.log(`       Service Provider ID Type: ${typeof install.serviceProviderId}`);
        console.log(`       Service Provider ID Constructor: ${install.serviceProviderId?.constructor?.name || 'undefined'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Consistency check failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

checkDataConsistency();