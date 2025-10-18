const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkSp2() {
  console.log('🔍 Checking installations for service@veridrive2.com...');
  
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
    const spId = '68f36794f717ef8f49ecbedd';
    
    // Check all installations for this SP regardless of status
    const allResult = await installsCollection.find({ 
      serviceProviderId: new mongoose.Types.ObjectId(spId)
    }).toArray();
    
    console.log('All installations for service@veridrive2.com:', allResult.length, 'results');
    
    if (allResult.length > 0) {
      allResult.forEach((install, index) => {
        console.log(`  ${index + 1}. ID: ${install._id}, Status: ${install.status}`);
      });
    } else {
      console.log('No installations found for this service provider');
    }
    
    // Also check with the status filter that the API uses
    const assignedResult = await installsCollection.find({ 
      serviceProviderId: new mongoose.Types.ObjectId(spId),
      status: { $in: ['assigned', 'in_progress'] }
    }).toArray();
    
    console.log('\nInstallations with assigned/in_progress status:', assignedResult.length, 'results');
    
    if (assignedResult.length > 0) {
      assignedResult.forEach((install, index) => {
        console.log(`  ${index + 1}. ID: ${install._id}, Status: ${install.status}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

checkSp2();