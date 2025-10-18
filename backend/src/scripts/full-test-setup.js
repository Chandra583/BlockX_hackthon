const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function fullTestSetup() {
  console.log('🔍 Setting up complete test scenario for service@veridrive2.com...');
  
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
          vin: '1HGBH41JXMN109188',
          vehicleNumber: 'TEST125',
          make: 'Honda',
          model: 'Accord',
          year: 2022,
          color: 'Red',
          initialMileage: 12000
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
        { notes: 'Test installation for service@veridrive2.com' },
        { headers: { 'Authorization': `Bearer ${adminToken}` } }
      );
      
      installId = createResponse.data.data.installId;
      console.log(`✅ Created installation request: ${installId}`);
    } catch (error) {
      console.log('❌ Failed to create installation request:', error.response?.data || error.message);
      return;
    }
    
    // Assign the installation to the service provider
    console.log('📌 Assigning installation to service provider...');
    try {
      const assignResponse = await axios.post(
        'http://localhost:3000/api/service/admin/assign-install',
        { 
          installId: installId,
          serviceProviderId: serviceProvider._id.toString()
        },
        { headers: { 'Authorization': `Bearer ${adminToken}` } }
      );
      
      console.log(`✅ Assigned installation ${installId} to service provider ${serviceProvider._id}`);
      console.log(`   Status: ${assignResponse.data.data.status}`);
      
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
      
      // Test the API endpoint
      const response = await axios.get(
        'http://localhost:3000/api/service/installs/assigned',
        { 
          headers: { 
            'Authorization': `Bearer ${spToken}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );
      
      console.log(`✅ API Response Status: ${response.status}`);
      console.log(`✅ Total Installations: ${response.data.data.total}`);
      console.log(`✅ Installations Array Length: ${response.data.data.installations.length}`);
      
      if (response.data.data.installations.length > 0) {
        console.log('✅ SUCCESS! Service provider can now see assigned installations:');
        response.data.data.installations.forEach((install, index) => {
          console.log(`   ${index + 1}. ID: ${install.id}, Status: ${install.status}`);
        });
      } else {
        console.log('❌ Service provider still cannot see assigned installations');
      }
      
      console.log('\n🎉 Test setup complete! Your service provider should now see the assigned installation.');
      
    } catch (error) {
      console.log('❌ Failed to assign installation:', error.response?.data || error.message);
      return;
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

fullTestSetup();