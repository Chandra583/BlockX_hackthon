#!/usr/bin/env node

/**
 * Script to create test installations for development/testing
 * This script creates sample installations assigned to service providers
 * to verify that the service provider installations endpoint works correctly.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blockx';

console.log('🔄 Creating test installations...');
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
    const hasUsers = collections.some(c => c.name === 'users');
    const hasVehicles = collections.some(c => c.name === 'vehicles');
    const hasInstalls = collections.some(c => c.name === 'installs');
    
    console.log(`📊 Collections status: Users=${hasUsers}, Vehicles=${hasVehicles}, Installs=${hasInstalls}`);
    
    // Find a service provider user (or create one if none exists)
    const usersCollection = mongoose.connection.db.collection('users');
    let serviceProvider = await usersCollection.findOne({ role: 'service' });
    
    if (!serviceProvider) {
      console.log('📝 Creating service provider user...');
      serviceProvider = {
        email: 'test-service@example.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', // TestPass123!
        firstName: 'Test',
        lastName: 'ServiceProvider',
        role: 'service',
        accountStatus: 'active',
        emailVerified: true,
        roleData: {
          businessName: 'Test Service Provider',
          businessType: 'mechanic',
          licenseNumber: 'TEST123',
          licenseExpiry: new Date('2025-12-31'),
          serviceCategories: ['maintenance'],
          serviceRadius: 50
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await usersCollection.insertOne(serviceProvider);
      serviceProvider._id = result.insertedId;
      console.log('✅ Service provider user created');
    } else {
      console.log('✅ Found existing service provider user');
    }
    
    // Find an owner user (or create one if none exists)
    let owner = await usersCollection.findOne({ role: 'owner' });
    
    if (!owner) {
      console.log('📝 Creating owner user...');
      owner = {
        email: 'test-owner@example.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', // TestPass123!
        firstName: 'Test',
        lastName: 'Owner',
        role: 'owner',
        accountStatus: 'active',
        emailVerified: true,
        roleData: {
          trackingConsent: true,
          verificationLevel: 'basic'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await usersCollection.insertOne(owner);
      owner._id = result.insertedId;
      console.log('✅ Owner user created');
    } else {
      console.log('✅ Found existing owner user');
    }
    
    // Find or create a vehicle
    const vehiclesCollection = mongoose.connection.db.collection('vehicles');
    let vehicle = await vehiclesCollection.findOne({ vin: '1HGBH41JXMN109186' });
    
    if (!vehicle) {
      console.log('📝 Creating test vehicle...');
      vehicle = {
        vin: '1HGBH41JXMN109186',
        vehicleNumber: 'TEST123',
        ownerId: owner._id,
        make: 'Honda',
        vehicleModel: 'Civic',
        year: 2020,
        color: 'White',
        bodyType: 'sedan',
        fuelType: 'gasoline',
        transmission: 'automatic',
        currentMileage: 15000,
        lastMileageUpdate: new Date(),
        mileageHistory: [],
        verificationStatus: 'verified',
        trustScore: 95,
        fraudAlerts: [],
        isForSale: false,
        listingStatus: 'not_listed',
        features: [],
        condition: 'good',
        accidentHistory: [],
        serviceHistory: [],
        lastVerifiedMileage: 15000,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await vehiclesCollection.insertOne(vehicle);
      vehicle._id = result.insertedId;
      console.log('✅ Test vehicle created');
    } else {
      console.log('✅ Found existing test vehicle');
    }
    
    // Create assigned installations
    console.log('📝 Creating assigned installations...');
    const installsCollection = mongoose.connection.db.collection('installs');
    
    // Create 3 assigned installations
    for (let i = 1; i <= 3; i++) {
      const existingInstall = await installsCollection.findOne({ 
        vehicleId: vehicle._id,
        serviceProviderId: serviceProvider._id,
        status: 'assigned'
      });
      
      if (!existingInstall) {
        const install = {
          vehicleId: vehicle._id,
          ownerId: owner._id,
          serviceProviderId: serviceProvider._id,
          status: 'assigned',
          priority: 'medium',
          requestedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // Different days
          assignedAt: new Date(Date.now() - (i * 12 * 60 * 60 * 1000)), // Assigned 12 hours after request
          notes: `Test installation ${i}`,
          history: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await installsCollection.insertOne(install);
        console.log(`✅ Created assigned installation ${i}`);
      } else {
        console.log(`✅ Assigned installation ${i} already exists`);
      }
    }
    
    // Create 1 in-progress installation
    const inProgressInstall = await installsCollection.findOne({ 
      vehicleId: vehicle._id,
      serviceProviderId: serviceProvider._id,
      status: 'in_progress'
    });
    
    if (!inProgressInstall) {
      const install = {
        vehicleId: vehicle._id,
        ownerId: owner._id,
        serviceProviderId: serviceProvider._id,
        status: 'in_progress',
        priority: 'high',
        requestedAt: new Date(Date.now() - (5 * 24 * 60 * 60 * 1000)),
        assignedAt: new Date(Date.now() - (4 * 24 * 60 * 60 * 1000)),
        startedAt: new Date(Date.now() - (3 * 24 * 60 * 60 * 1000)),
        deviceId: 'ESP32_TEST123',
        initialMileage: 15500,
        notes: 'Test in-progress installation',
        history: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await installsCollection.insertOne(install);
      console.log('✅ Created in-progress installation');
    } else {
      console.log('✅ In-progress installation already exists');
    }
    
    // Summary
    const totalInstalls = await installsCollection.countDocuments({
      serviceProviderId: serviceProvider._id
    });
    
    const assignedInstalls = await installsCollection.countDocuments({
      serviceProviderId: serviceProvider._id,
      status: 'assigned'
    });
    
    const inProgressInstalls = await installsCollection.countDocuments({
      serviceProviderId: serviceProvider._id,
      status: 'in_progress'
    });
    
    console.log('\n📊 Test Data Summary:');
    console.log(`  - Service Provider: ${serviceProvider.email} (${serviceProvider._id})`);
    console.log(`  - Owner: ${owner.email} (${owner._id})`);
    console.log(`  - Vehicle: ${vehicle.vin} (${vehicle._id})`);
    console.log(`  - Total Installations: ${totalInstalls}`);
    console.log(`  - Assigned Installations: ${assignedInstalls}`);
    console.log(`  - In-Progress Installations: ${inProgressInstalls}`);
    
    console.log('\n✅ Test installations created successfully!');
    console.log('You can now test the service provider installations endpoint.');
    
  } catch (error) {
    console.error('❌ Failed to create test installations:', error);
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