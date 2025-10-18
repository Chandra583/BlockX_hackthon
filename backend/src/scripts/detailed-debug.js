const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function detailedDebug() {
  console.log('🔍 Detailed debugging of service provider assignment issue...');
  
  try {
    // Database connection
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blockx';
    console.log(`🔗 Connecting to database: ${MONGODB_URI}`);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Database connected successfully');
    
    // Find a service provider user
    console.log('\n🔍 Finding service provider users...');
    const usersCollection = mongoose.connection.db.collection('users');
    const serviceProviders = await usersCollection.find({ role: 'service' }).toArray();
    
    console.log(`Found ${serviceProviders.length} service providers:`);
    serviceProviders.forEach((sp, index) => {
      console.log(`  ${index + 1}. ID: ${sp._id}, Email: ${sp.email}`);
    });
    
    // Let's use the first service provider for testing
    if (serviceProviders.length === 0) {
      console.log('❌ No service providers found');
      return;
    }
    
    const testSp = serviceProviders[0];
    console.log(`\n🔧 Using service provider: ${testSp.email} (ID: ${testSp._id})`);
    
    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.log('❌ JWT_SECRET not found in environment variables');
      return;
    }
    
    const payload = {
      userId: testSp._id.toString(),
      email: testSp.email,
      role: testSp.role
    };
    
    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: '1h',
      issuer: 'veridrive',
      audience: 'veridrive-users'
    });
    
    console.log('✅ Generated JWT token');
    
    // Check what installations are actually assigned to this service provider in the database
    console.log('\n🔍 Checking database for installations assigned to this service provider...');
    const installsCollection = mongoose.connection.db.collection('installs');
    
    // Query with ObjectId
    const objectIdResults = await installsCollection.find({ 
      serviceProviderId: new mongoose.Types.ObjectId(testSp._id.toString()),
      status: { $in: ['assigned', 'in_progress'] }
    }).toArray();
    
    console.log(`   Query with ObjectId found ${objectIdResults.length} installations`);
    
    // Query with string
    const stringResults = await installsCollection.find({ 
      serviceProviderId: testSp._id.toString(),
      status: { $in: ['assigned', 'in_progress'] }
    }).toArray();
    
    console.log(`   Query with string found ${stringResults.length} installations`);
    
    if (objectIdResults.length > 0) {
      console.log('   Sample installation with ObjectId query:');
      console.log(`     ID: ${objectIdResults[0]._id}`);
      console.log(`     Status: ${objectIdResults[0].status}`);
      console.log(`     Service Provider ID: ${objectIdResults[0].serviceProviderId}`);
      console.log(`     Service Provider ID type: ${typeof objectIdResults[0].serviceProviderId}`);
    }
    
    // Test the actual API endpoint
    console.log('\n🔍 Testing API endpoint...');
    try {
      const response = await axios.get(
        'http://localhost:3000/api/service/installs/assigned',
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );
      
      console.log(`✅ API Response Status: ${response.status}`);
      console.log(`✅ Total Installations: ${response.data.data.total}`);
      console.log(`✅ Installations Array Length: ${response.data.data.installations.length}`);
      
      if (response.data.data.installations.length > 0) {
        console.log('✅ Installations found in API response:');
        response.data.data.installations.forEach((install, index) => {
          console.log(`   ${index + 1}. ID: ${install.id}, Status: ${install.status}, SP ID: ${install.serviceProviderId}`);
        });
      } else {
        console.log('❌ No installations found in API response');
        
        // Let's check what the API thinks the user ID is
        console.log('\n🔍 Debugging user context...');
        console.log(`   Token User ID: ${payload.userId}`);
        console.log(`   Token User ID type: ${typeof payload.userId}`);
      }
      
      // Check response headers
      console.log('\n🔍 Response Headers:');
      console.log(`   Cache-Control: ${response.headers['cache-control']}`);
      console.log(`   Pragma: ${response.headers['pragma']}`);
      console.log(`   Expires: ${response.headers['expires']}`);
      
    } catch (apiError) {
      console.log('❌ API Test failed:');
      if (apiError.response) {
        console.log(`   Status: ${apiError.response.status}`);
        console.log(`   Data: ${JSON.stringify(apiError.response.data, null, 2)}`);
        console.log(`   Headers: ${JSON.stringify(apiError.response.headers, null, 2)}`);
      } else {
        console.log(`   Error: ${apiError.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

detailedDebug();