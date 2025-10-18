const mongoose = require('mongoose');
require('dotenv').config();

async function checkWallets() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const users = await User.find({}).select('firstName lastName email walletAddress walletSecret role');
    
    console.log('Users with wallets:');
    users.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.role}): wallet=${user.walletAddress ? 'YES' : 'NO'}, secret=${user.walletSecret ? 'YES' : 'NO'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkWallets();
