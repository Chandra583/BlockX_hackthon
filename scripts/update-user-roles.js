/**
 * Migration script to update user roles
 * Updates buyer@veridrive.com to have both "buyer" and "owner" roles
 * 
 * Usage: cd backend && node ../scripts/update-user-roles.js
 */

const path = require('path');
const fs = require('fs');

// Try to load .env from backend directory (optional)
try {
  const envPath = path.resolve(__dirname, '../backend/.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  } else {
    // Fallback: try loading from root
    const rootEnvPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(rootEnvPath)) {
      require('dotenv').config({ path: rootEnvPath });
    }
  }
} catch (e) {
  // dotenv not available, use environment variables directly
  console.log('⚠️  dotenv not found, using environment variables directly');
}

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/veridrive';

const UserSchema = new mongoose.Schema({
  email: String,
  role: String,
  roles: [String],
  firstName: String,
  lastName: String,
}, { collection: 'users', strict: false });

const User = mongoose.model('User', UserSchema);

async function updateUserRoles() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
    });
    console.log('✅ Connected to MongoDB');

    const userId = '69011a631b343666ffd406b0';
    const targetEmail = 'buyer@veridrive.com';
    const newRoles = ['buyer', 'owner'];

    // Find user by ID or email
    const user = await User.findOne({
      $or: [
        { _id: new mongoose.Types.ObjectId(userId) },
        { email: targetEmail }
      ]
    });

    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log(`📋 Found user: ${user.email} (${user.firstName} ${user.lastName})`);
    console.log(`   Current role: ${user.role}`);
    console.log(`   Current roles array: ${JSON.stringify(user.roles || [])}`);

    // Update roles
    user.roles = newRoles;
    await user.save();

    console.log(`✅ Updated user roles to: ${JSON.stringify(newRoles)}`);
    console.log(`   User ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);

    await mongoose.disconnect();
    console.log('📴 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating user roles:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

updateUserRoles();

