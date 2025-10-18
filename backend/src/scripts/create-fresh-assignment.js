const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function createFreshAssignment() {
  console.log('🔍 Creating fresh installation assignment for service@veridrive2.com...');
  
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
    
    // Create a new vehicle for the admin
    console.log('🚗 Creating new vehicle for admin...');
    let vehicleId;
    try {
      const vehicleResponse = await axios.post(
        'http://localhost:3000/api/vehicles/register',
        {
          vin: '1HGBH41JXMN109189',
          vehicleNumber: 'TEST126',
          make: 'Toyota',
          model: 'Camry',
          year: 2023,
          color: 'Blue',
          initialMileage: 8000
        },
        { headers: { 'Authorization': `Bearer ${adminToken}` } }
      );
      
      vehicleId = vehicleResponse.data.data.vehicle.id;
      console.log(`✅ Created vehicle: ${vehicleId}`);
    } catch (error) {
      console.log('❌ Failed to create vehicle:', error.response?.data || error.message);
      return;
    }
    
    // Create an installation request for this vehicle
    console.log('📝 Creating installation request for new vehicle...');
    let installId;
    try {
      const createResponse = await axios.post(
        `http://localhost:3000/api/installs/vehicles/${vehicleId}/request-install`,
        { notes: 'Fresh installation for service@veridrive2.com' },
        { headers: { 'Authorization': `Bearer ${adminToken}` } }
      );
      
      installId = createResponse.data.data.installId;
      console.log(`✅ Created installation request: ${installId}`);
    } catch (error) {
      console.log('❌ Failed to create installation request:', error.response?.data || error.message);
      return;
    }
    
    // Verify the installation is in a state that allows assignment
    console.log('\n🔍 Checking installation state before assignment...');
    const installsCollection = mongoose.connection.db.collection('installs');
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
      
      console.log(`✅ Assignment successful:`);
      console.log(`   Install ID: ${assignResponse.data.data.installId}`);
      console.log(`   Status: ${assignResponse.data.data.status}`);
      console.log(`   Service Provider ID: ${assignResponse.data.data.serviceProviderId}`);
      
      // Verify the assignment in database
      console.log('\n🔍 Verifying assignment in database...');
      const installAfter = await installsCollection.findOne({ _id: new mongoose.Types.ObjectId(installId) });
      console.log(`   Status: ${installAfter.status}`);
      console.log(`   Service Provider ID: ${installAfter.serviceProviderId}`);
      console.log(`   Service Provider ID Type: ${typeof installAfter.serviceProviderId}`);
      
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
        
        console.log(`✅ API Response Status: ${response1.status}`);
        console.log(`✅ Total Installations: ${response1.data.data.total}`);
        console.log(`✅ Installations Array Length: ${response1.data.data.installations.length}`);
        
        if (response1.data.data.installations.length > 0) {
          console.log('✅ Installations found:');
          response1.data.data.installations.forEach((install, index) => {
            console.log(`   ${index + 1}. ID: ${install.id}, Status: ${install.status}`);
            if (install.id === installId) {
              console.log(`      🎯 This is our newly assigned installation!`);
            }
          });
        } else {
          console.log('❌ No installations found');
        }
      } catch (error) {
        console.log('❌ API Test failed:', error.response?.data || error.message);
      }
      
      console.log('\n🎉 Fresh assignment completed successfully!');
      
    } catch (error) {
      console.log('❌ Failed to assign installation:');
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
      } else {
        console.log(`   Error: ${error.message}`);
      }
      return;
    }
    
  } catch (error) {
    console.error('❌ Process failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

createFreshAssignment();