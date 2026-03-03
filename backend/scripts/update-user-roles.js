/**
 * Migration script to update user roles
 * Updates buyer@Trivexachain.com to have both "buyer" and "owner" roles
 * 
 * Usage: node scripts/update-user-roles.js (from backend directory)
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Trivexachain';

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
    console.log(`📍 URI: ${MONGODB_URI.substring(0, 30)}...`);
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
    });
    console.log('✅ Connected to MongoDB');

    const userId = '69011a631b343666ffd406b0';
    const targetEmail = 'buyer@Trivexachain.com';
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
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

updateUserRoles();

