const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkUnassigned() {
  console.log('🔍 Checking for unassigned installations...');
  
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
    
    // Find installations that are requested but not yet assigned
    const unassignedInstalls = await installsCollection.find({ 
      status: 'requested',
      serviceProviderId: { $exists: false }
    }).toArray();
    
    console.log('Unassigned installations (requested status):', unassignedInstalls.length);
    
    if (unassignedInstalls.length > 0) {
      unassignedInstalls.forEach((install, index) => {
        console.log(`  ${index + 1}. ID: ${install._id}, Vehicle: ${install.vehicleId}`);
      });
    } else {
      console.log('No unassigned installations with requested status found');
    }
    
    // Also check for pending installations
    const pendingInstalls = await installsCollection.find({ 
      status: 'pending',
      serviceProviderId: { $exists: false }
    }).toArray();
    
    console.log('Pending installations:', pendingInstalls.length);
    
    if (pendingInstalls.length > 0) {
      pendingInstalls.forEach((install, index) => {
        console.log(`  ${index + 1}. ID: ${install._id}, Vehicle: ${install.vehicleId}`);
      });
    } else {
      console.log('No unassigned installations with pending status found');
    }
    
    // Check for any installations that might be in a state that allows assignment
    const assignableInstalls = await installsCollection.find({ 
      status: { $in: ['requested', 'pending'] },
      serviceProviderId: { $exists: false }
    }).toArray();
    
    console.log('Total assignable installations:', assignableInstalls.length);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

checkUnassigned();