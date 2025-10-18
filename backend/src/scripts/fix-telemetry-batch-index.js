const mongoose = require('mongoose');
require('dotenv').config();

async function fixTelemetryBatchIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/veridrive');
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('telemetrybatches');

    // Check existing indexes
    console.log('📋 Checking existing indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Look for the problematic unique index
    const problematicIndex = indexes.find(index => 
      index.key && 
      index.key.deviceID === 1 && 
      index.key.date === 1 && 
      index.unique === true
    );

    if (problematicIndex) {
      console.log('🔧 Found problematic unique index:', problematicIndex.name);
      
      // Drop the problematic index
      await collection.dropIndex(problematicIndex.name);
      console.log('✅ Dropped problematic unique index');
    }

    // Check for any records with null deviceID and date
    console.log('🔍 Checking for records with null deviceID and date...');
    const nullRecords = await collection.find({
      deviceID: null,
      date: null
    }).toArray();

    if (nullRecords.length > 0) {
      console.log(`🗑️ Found ${nullRecords.length} records with null deviceID and date, removing...`);
      await collection.deleteMany({
        deviceID: null,
        date: null
      });
      console.log('✅ Removed null records');
    }

    // Check for any records with null deviceId and recordedAt
    console.log('🔍 Checking for records with null deviceId and recordedAt...');
    const nullDeviceRecords = await collection.find({
      deviceId: null,
      recordedAt: null
    }).toArray();

    if (nullDeviceRecords.length > 0) {
      console.log(`🗑️ Found ${nullDeviceRecords.length} records with null deviceId and recordedAt, removing...`);
      await collection.deleteMany({
        deviceId: null,
        recordedAt: null
      });
      console.log('✅ Removed null deviceId records');
    }

    console.log('✅ TelemetryBatch index fix completed');
    
  } catch (error) {
    console.error('❌ Error fixing TelemetryBatch index:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixTelemetryBatchIndex();
