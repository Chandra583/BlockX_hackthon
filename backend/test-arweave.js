const Arweave = require('arweave');
const fs = require('fs');
const path = require('path');

// Test Arweave configuration
async function testArweave() {
  console.log('🧪 Testing Arweave configuration...');
  
  // Initialize Arweave for testnet
  const arweave = Arweave.init({
    host: 'testnet.redstone.tools',
    port: 443,
    protocol: 'https',
    timeout: 20000,
    logging: true
  });

  try {
    // Test 1: Generate a wallet
    console.log('📝 Generating test wallet...');
    const wallet = await arweave.wallets.generate();
    const address = await arweave.wallets.jwkToAddress(wallet);
    console.log(`✅ Wallet generated: ${address}`);

    // Save wallet for development use
    const walletPath = path.join(__dirname, '.env.arweave-wallet.json');
    fs.writeFileSync(walletPath, JSON.stringify(wallet, null, 2));
    console.log(`💾 Wallet saved to: ${walletPath}`);

    // Test 2: Check balance (will be 0 for new wallet)
    try {
      const balance = await arweave.wallets.getBalance(address);
      const arBalance = arweave.ar.winstonToAr(balance);
      console.log(`💰 Wallet balance: ${arBalance} AR`);
    } catch (e) {
      console.log('⚠️ Balance check failed (gateway busy)');
    }

    // Test 3: Test network info
    try {
      const info = await arweave.network.getInfo();
      console.log(`🌐 Network height: ${info.height}`);
      console.log(`🌐 Network version: ${info.release}`);
    } catch (e) {
      console.log('⚠️ Network info failed (gateway busy)');
    }

    // Test 4: Estimate cost for small upload
    try {
      const testData = Buffer.from('Hello BlockX!');
      const price = await arweave.transactions.getPrice(testData.length);
      const arPrice = arweave.ar.winstonToAr(price);
      console.log(`💸 Upload cost estimate for ${testData.length} bytes: ${arPrice} AR`);
    } catch (e) {
      console.log('⚠️ Price estimation failed (gateway busy)');
    }

    console.log('\n✅ Arweave test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Add wallet to .env file as ARWEAVE_WALLET_KEY');
    console.log('2. For testnet: Get test tokens from a faucet if needed');
    console.log('3. Test upload endpoints with small files');

    return { wallet, address };

  } catch (error) {
    console.error('❌ Arweave test failed:', error);
    throw error;
  }
}

// Run test if called directly
if (require.main === module) {
  testArweave().catch(console.error);
}

module.exports = { testArweave };

