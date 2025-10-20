/**
 * Create comprehensive test data for OBD Device Integration
 * This script creates users, vehicles, and installations for testing
 */

const mongoose = require('mongoose');
const { User } = require('./dist/models');
const { default: Vehicle } = require('./dist/models/core/Vehicle.model');
const { InstallationRequest } = require('./dist/models');

// Test data
const testData = {
  owner: {
    firstName: 'Test',
    lastName: 'Owner',
    email: 'testowner@example.com',
    password: 'password123',
    role: 'owner'
  },
  serviceProvider: {
    firstName: 'Test',
    lastName: 'ServiceProvider',
    email: 'testsp@example.com',
    password: 'password123',
    role: 'service_provider'
  },
  vehicle: {
    vin: '1HGCM82633A123411',
    vehicleNumber: 'KA09JS1288',
    make: 'Hyundai',
    vehicleModel: 'i20',
    year: 2020,
    color: 'White',
    bodyType: 'sedan',
    fuelType: 'gasoline',
    transmission: 'automatic',
    currentMileage: 200,
    condition: 'good'
  },
  installation: {
    deviceId: 'OBD3211',
    status: 'in_progress',
    initialMileage: 200,
    notes: 'Test installation for OBD device integration'
  }
};

async function createTestData() {
  try {
    console.log('🔧 Creating test data for OBD Device Integration...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/veridrive');
    console.log('✅ Connected to MongoDB');

    // Create test owner
    console.log('👤 Creating test owner...');
    const owner = await User.create({
      ...testData.owner,
      isEmailVerified: true,
      isActive: true
    });
    console.log('✅ Owner created:', owner._id);

    // Create test service provider
    console.log('🔧 Creating test service provider...');
    const serviceProvider = await User.create({
      ...testData.serviceProvider,
      isEmailVerified: true,
      isActive: true
    });
    console.log('✅ Service provider created:', serviceProvider._id);

    // Create test vehicle
    console.log('🚗 Creating test vehicle...');
    const vehicle = await Vehicle.create({
      ...testData.vehicle,
      ownerId: owner._id,
      verificationStatus: 'verified',
      trustScore: 100,
      lastMileageUpdate: new Date(),
      mileageHistory: [{
        mileage: testData.vehicle.currentMileage,
        recordedBy: owner._id,
        recordedAt: new Date(),
        source: 'owner',
        verified: true
      }]
    });
    console.log('✅ Vehicle created:', vehicle._id);

    // Create test installation request
    console.log('📋 Creating test installation request...');
    const installation = await InstallationRequest.create({
      ownerId: owner._id,
      vehicleId: vehicle._id,
      requestedBy: owner._id,
      deviceId: testData.installation.deviceId,
      serviceProviderId: serviceProvider._id,
      status: testData.installation.status,
      initialMileage: testData.installation.initialMileage,
      notes: testData.installation.notes,
      requestedAt: new Date(),
      assignedAt: new Date(),
      startedAt: new Date(),
      history: [
        {
          action: 'created',
          by: owner._id,
          at: new Date()
        },
        {
          action: 'assigned',
          by: serviceProvider._id,
          at: new Date(),
          meta: { serviceProviderId: serviceProvider._id }
        },
        {
          action: 'started',
          by: serviceProvider._id,
          at: new Date()
        }
      ]
    });
    console.log('✅ Installation request created:', installation._id);

    console.log('\n🎉 Test data created successfully!');
    console.log('\n📋 Test Data Summary:');
    console.log('Owner ID:', owner._id);
    console.log('Service Provider ID:', serviceProvider._id);
    console.log('Vehicle ID:', vehicle._id);
    console.log('Installation ID:', installation._id);
    console.log('Device ID:', testData.installation.deviceId);
    console.log('Vehicle VIN:', testData.vehicle.vin);
    console.log('Current Mileage:', testData.vehicle.currentMileage);

    console.log('\n🧪 Ready for testing!');
    console.log('Run: node test-obd-device-integration.js');

    return {
      owner,
      serviceProvider,
      vehicle,
      installation
    };

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  createTestData()
    .then(() => {
      console.log('\n✅ Test data creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test data creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createTestData, testData };
