#!/usr/bin/env node

/**
 * Script to generate a test JWT token for the service provider user
 * This script creates a valid token that can be used to test the API endpoint
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blockx';

console.log('🔄 Connecting to database...');
console.log(`🔗 Database: ${MONGODB_URI}`);

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
    // Find the service provider user we created
    const usersCollection = mongoose.connection.db.collection('users');
    const serviceProvider = await usersCollection.findOne({ email: 'test-service@example.com' });
    
    if (!serviceProvider) {
      console.log('❌ Service provider user not found');
      process.exit(1);
    }
    
    console.log('✅ Found service provider user');
    
    // Get JWT secret from environment
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.log('❌ JWT_SECRET not found in environment variables');
      process.exit(1);
    }
    
    // Generate access token
    const payload = {
      userId: serviceProvider._id.toString(),
      email: serviceProvider.email,
      role: serviceProvider.role
    };
    
    const accessToken = jwt.sign(payload, jwtSecret, {
      expiresIn: '1h',
      issuer: 'Trivexachain',
      audience: 'Trivexachain-users'
    });
    
    console.log('\n🔐 Generated JWT Token:');
    console.log(accessToken);
    
    console.log('\n📋 To test the API endpoint, use this curl command:');
    console.log(`curl -H "Authorization: Bearer ${accessToken}" http://localhost:3000/api/service/installs/assigned`);
    
    console.log('\n📋 Or use this in Postman:');
    console.log('- Set Authorization header to:');
    console.log(`  Bearer ${accessToken}`);
    console.log('- Make GET request to:');
    console.log('  http://localhost:3000/api/service/installs/assigned');
    
  } catch (error) {
    console.error('❌ Failed to generate token:', error);
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