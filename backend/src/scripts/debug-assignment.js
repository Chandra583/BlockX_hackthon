const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function debugAssignment() {
  console.log('🔍 Debugging installation assignment issue...');
  
  try {
    // Database connection
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blockx';
    console.log(`🔗 Connecting to database: ${MONGODB_URI}`);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Database connected successfully');
    
    // Find the service provider
    const usersCollection = mongoose.connection.db.collection('users');
    const serviceProvider = await usersCollection.findOne({ 
      email: 'service@veridrive2.com',
      role: 'service'
    });
    
    if (!serviceProvider) {
      console.log('❌ Service provider not found');
      return;
    }
    
    console.log(`✅ Found service provider: ${serviceProvider.email} (ID: ${serviceProvider._id})`);
    
    // Find an admin user to perform the assignment
    const adminUser = await usersCollection.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log(`✅ Found admin: ${adminUser.email}`);
    
    // Generate admin JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.log('❌ JWT_SECRET not found in environment variables');
      return;
    }
    
    const adminPayload = {
      userId: adminUser._id.toString(),
      email: adminUser.email,
      role: adminUser.role
    };
    
    const adminToken = jwt.sign(adminPayload, jwtSecret, {
      expiresIn: '1h',
      issuer: 'veridrive',
      audience: 'veridrive-users'
    });
    
    console.log('✅ Generated admin JWT token');
    
    // Find a vehicle that doesn't have an active installation
    const vehiclesCollection = mongoose.connection.db.collection('vehicles');
    const installsCollection = mongoose.connection.db.collection('installs');
    
    // Find a vehicle that doesn't have an active installation
    let vehicle = await vehiclesCollection.findOne({});
    if (!vehicle) {
      console.log('❌ No vehicles found');
      return;
    }
    
    console.log(`✅ Found vehicle: ${vehicle.vin} (ID: ${vehicle._id})`);
    
    // Check if there's already an active installation for this vehicle
    const existingActiveInstall = await installsCollection.findOne({ 
      vehicleId: vehicle._id,
      status: { $in: ['requested', 'assigned', 'in_progress'] }
    });
    
    let installId;
    if (existingActiveInstall) {
      // Use existing installation
      installId = existingActiveInstall._id.toString();
      console.log(`✅ Using existing installation: ${installId} (Status: ${existingActiveInstall.status})`);
      
      // If it's already assigned, we need to check if it's assigned to our service provider
      if (existingActiveInstall.serviceProviderId) {
        console.log(`   Already assigned to: ${existingActiveInstall.serviceProviderId}`);
        if (existingActiveInstall.serviceProviderId.toString() === serviceProvider._id.toString()) {
          console.log('   This installation is already assigned to our service provider!');
        } else {
          console.log('   This installation is assigned to a different service provider.');
        }
      }
    } else {
      // Create a new installation request
      console.log('📝 Creating new installation request...');
      try {
        const createResponse = await axios.post(
          `http://localhost:3000/api/installs/vehicles/${vehicle._id}/request-install`,
          { notes: 'Debug installation for service@veridrive2.com' },
          { headers: { 'Authorization': `Bearer ${adminToken}` } }
        );
        
        installId = createResponse.data.data.installId;
        console.log(`✅ Created installation request: ${installId}`);
      } catch (error) {
        console.log('❌ Failed to create installation request:', error.response?.data || error.message);
        return;
      }
    }
    
    // Check current state in database before assignment
    console.log('\n🔍 Checking database state before assignment...');
    const installBefore = await installsCollection.findOne({ _id: new mongoose.Types.ObjectId(installId) });
    console.log(`   Status: ${installBefore.status}`);
    console.log(`   Service Provider ID: ${installBefore.serviceProviderId}`);
    
    // Assign the installation to the service provider
    console.log('\n📌 Assigning installation to service provider...');
    try {
      const assignResponse = await axios.post(
        'http://localhost:3000/api/service/admin/assign-install',
        { 
          installId: installId,
          serviceProviderId: serviceProvider._id.toString()
        },
        { headers: { 'Authorization': `Bearer ${adminToken}` } }
      );
      
      console.log(`✅ Assignment response:`);
      console.log(`   Install ID: ${assignResponse.data.data.installId}`);
      console.log(`   Status: ${assignResponse.data.data.status}`);
      console.log(`   Service Provider ID: ${assignResponse.data.data.serviceProviderId}`);
      
      // Check database state after assignment
      console.log('\n🔍 Checking database state after assignment...');
      const installAfter = await installsCollection.findOne({ _id: new mongoose.Types.ObjectId(installId) });
      console.log(`   Status: ${installAfter.status}`);
      console.log(`   Service Provider ID: ${installAfter.serviceProviderId}`);
      console.log(`   Service Provider ID Type: ${typeof installAfter.serviceProviderId}`);
      console.log(`   Service Provider ID Constructor: ${installAfter.serviceProviderId?.constructor?.name || 'undefined'}`);
      
      // Now test that the service provider can see it
      console.log('\n🔍 Testing that service provider can see the assigned installation...');
      
      // Generate service provider JWT token
      const spPayload = {
        userId: serviceProvider._id.toString(),
        email: serviceProvider.email,
        role: serviceProvider.role
      };
      
      const spToken = jwt.sign(spPayload, jwtSecret, {
        expiresIn: '1h',
        issuer: 'veridrive',
        audience: 'veridrive-users'
      });
      
      console.log('✅ Generated service provider JWT token');
      
      // Test the API endpoint with cache headers
      console.log('\n📡 Testing API with cache headers...');
      try {
        const response1 = await axios.get(
          'http://localhost:3000/api/service/installs/assigned',
          { 
            headers: { 
              'Authorization': `Bearer ${spToken}`,
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          }
        );
        
        console.log(`✅ API Response 1 Status: ${response1.status}`);
        console.log(`✅ Total Installations: ${response1.data.data.total}`);
        console.log(`✅ Installations Array Length: ${response1.data.data.installations.length}`);
        
        if (response1.data.data.installations.length > 0) {
          console.log('✅ Installations found with cache headers:');
          response1.data.data.installations.forEach((install, index) => {
            console.log(`   ${index + 1}. ID: ${install.id}, Status: ${install.status}`);
          });
        } else {
          console.log('❌ No installations found even with cache headers');
        }
      } catch (error) {
        console.log('❌ API Test 1 failed:', error.response?.data || error.message);
      }
      
      // Test the API endpoint without cache headers (this might show caching issues)
      console.log('\n📡 Testing API without cache headers...');
      try {
        const response2 = await axios.get(
          'http://localhost:3000/api/service/installs/assigned',
          { 
            headers: { 
              'Authorization': `Bearer ${spToken}`
            }
          }
        );
        
        console.log(`✅ API Response 2 Status: ${response2.status}`);
        console.log(`✅ Total Installations: ${response2.data.data.total}`);
        console.log(`✅ Installations Array Length: ${response2.data.data.installations.length}`);
        
        if (response2.data.data.installations.length > 0) {
          console.log('✅ Installations found without cache headers:');
          response2.data.data.installations.forEach((install, index) => {
            console.log(`   ${index + 1}. ID: ${install.id}, Status: ${install.status}`);
          });
        } else {
          console.log('❌ No installations found without cache headers (possible caching issue)');
        }
      } catch (error) {
        console.log('❌ API Test 2 failed:', error.response?.data || error.message);
      }
      
    } catch (error) {
      console.log('❌ Failed to assign installation:');
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
      } else {
        console.log(`   Error: ${error.message}`);
      }
      
      // Check what's in the database after the failed assignment
      console.log('\n🔍 Checking database state after failed assignment attempt...');
      const installAfterFailed = await installsCollection.findOne({ _id: new mongoose.Types.ObjectId(installId) });
      console.log(`   Status: ${installAfterFailed.status}`);
      console.log(`   Service Provider ID: ${installAfterFailed.serviceProviderId}`);
      
      return;
    }
    
  } catch (error) {
    console.error('❌ Debug process failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

debugAssignment();