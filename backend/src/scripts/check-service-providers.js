#!/usr/bin/env node

/**
 * Script to check service providers in the database
 * This script shows all service providers and their IDs
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blockx';

console.log('🔍 Checking service providers in the database...');
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
    // Get users collection
    const usersCollection = mongoose.connection.db.collection('users');
    
    // Find all service providers
    const serviceProviders = await usersCollection.find({ 
      role: 'service'
    }).toArray();
    
    console.log(`\n📋 Found ${serviceProviders.length} service providers:`);
    
    for (const provider of serviceProviders) {
      console.log(`\n--- Service Provider ---`);
      console.log(`  ID: ${provider._id}`);
      console.log(`  Email: ${provider.email}`);
      console.log(`  Name: ${provider.firstName} ${provider.lastName}`);
    }
    
    // Summary
    console.log('\n✅ Check completed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to check service providers:', error);
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