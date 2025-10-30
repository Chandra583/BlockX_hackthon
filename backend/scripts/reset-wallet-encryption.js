/**
 * Wallet Encryption Reset Script
 * 
 * This script resets corrupted wallet encryption by:
 * 1. Backing up the current encrypted data
 * 2. Deleting the old wallet data
 * 3. Allowing the user to create a fresh wallet
 * 
 * USE WITH CAUTION: This will remove the old wallet permanently
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

// User schema (minimal for this script)
const UserSchema = new mongoose.Schema({
  email: String,
  blockchainWallet: {
    walletAddress: String,
    encryptedPrivateKey: String,
    balance: Number,
    isActive: Boolean,
    createdAt: Date,
    lastUsed: Date
  }
}, { collection: 'users' });

const User = mongoose.model('User', UserSchema);

async function resetWalletForUser(userIdOrEmail) {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user
    const query = userIdOrEmail.includes('@') 
      ? { email: userIdOrEmail }
      : { _id: mongoose.Types.ObjectId(userIdOrEmail) };

    const user = await User.findOne(query);

    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log(`\n📋 User: ${user.email}`);
    
    if (!user.blockchainWallet) {
      console.log('ℹ️  No wallet found for this user');
      process.exit(0);
    }

    console.log(`📍 Current Wallet Address: ${user.blockchainWallet.walletAddress}`);
    console.log(`🔐 Encrypted Key Length: ${user.blockchainWallet.encryptedPrivateKey?.length || 0}`);
    console.log(`🔍 Has Colon: ${user.blockchainWallet.encryptedPrivateKey?.includes(':')}`);
    
    // Backup
    const backup = {
      email: user.email,
      userId: user._id.toString(),
      walletAddress: user.blockchainWallet.walletAddress,
      encryptedPrivateKey: user.blockchainWallet.encryptedPrivateKey,
      balance: user.blockchainWallet.balance,
      timestamp: new Date().toISOString()
    };

    console.log('\n💾 Backup Data:');
    console.log(JSON.stringify(backup, null, 2));

    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will delete the wallet data permanently!');
    console.log('The user will need to create a new wallet.');
    console.log('\nTo proceed, set CONFIRM=true environment variable and re-run.');

    if (process.env.CONFIRM !== 'true') {
      console.log('\n❌ Aborted (set CONFIRM=true to proceed)');
      process.exit(0);
    }

    // Delete wallet
    user.blockchainWallet = undefined;
    await user.save();

    console.log('\n✅ Wallet data reset successfully');
    console.log('👉 User can now create a new wallet via: POST /api/blockchain/wallet/create');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get user ID/email from command line
const userIdOrEmail = process.argv[2];

if (!userIdOrEmail) {
  console.log('Usage: node reset-wallet-encryption.js <userId|email>');
  console.log('Example: node reset-wallet-encryption.js manojkumar@gmail.com');
  console.log('Example: CONFIRM=true node reset-wallet-encryption.js manojkumar@gmail.com');
  process.exit(1);
}

resetWalletForUser(userIdOrEmail);

