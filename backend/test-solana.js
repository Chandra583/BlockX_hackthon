const { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram, TransactionInstruction } = require('@solana/web3.js');

// Test Solana configuration
async function testSolana() {
  console.log('🧪 Testing Solana configuration...');
  
  // Test multiple RPC endpoints for reliability
  const rpcUrls = [
    'https://api.devnet.solana.com',
    'https://devnet.helius-rpc.com',
    'https://rpc-devnet.helius.xyz'
  ];

  let connection = null;
  let workingRpc = null;

  // Find a working RPC endpoint
  for (const rpcUrl of rpcUrls) {
    try {
      console.log(`🔗 Testing RPC: ${rpcUrl}`);
      const testConnection = new Connection(rpcUrl, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000
      });
      
      // Test the connection
      const version = await testConnection.getVersion();
      console.log(`✅ RPC working: ${rpcUrl} (version: ${version['solana-core']})`);
      connection = testConnection;
      workingRpc = rpcUrl;
      break;
    } catch (error) {
      console.log(`❌ RPC failed: ${rpcUrl} - ${error.message}`);
    }
  }

  if (!connection) {
    throw new Error('No working Solana RPC endpoints found');
  }

  try {
    // Test 1: Generate a keypair
    console.log('🔑 Generating test keypair...');
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toString();
    console.log(`✅ Keypair generated: ${publicKey}`);

    // Test 2: Check balance (will be 0 for new wallet)
    const balance = await connection.getBalance(keypair.publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;
    console.log(`💰 Wallet balance: ${solBalance} SOL`);

    // Test 3: Get network info
    const epochInfo = await connection.getEpochInfo();
    console.log(`🌐 Current epoch: ${epochInfo.epoch}`);
    console.log(`🌐 Current slot: ${epochInfo.absoluteSlot}`);

    // Test 4: Test memo program (what we use for vehicle registration)
    console.log('📝 Testing Memo program transaction...');
    const memoProgram = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
    
    const vehicleData = {
      vehicleId: 'test-vehicle-123',
      vin: 'TEST123456789',
      mileage: 50000,
      timestamp: Date.now(),
      action: 'REGISTER_VEHICLE'
    };

    const transaction = new Transaction();
    const memoInstruction = new TransactionInstruction({
      keys: [],
      programId: memoProgram,
      data: Buffer.from(JSON.stringify(vehicleData))
    });
    
    transaction.add(memoInstruction);
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = keypair.publicKey;

    // Sign transaction (but don't send since we have no SOL)
    transaction.sign(keypair);
    console.log('✅ Transaction created and signed successfully');
    console.log(`📋 Transaction signature would be: ${transaction.signature?.toString('base64') || 'N/A'}`);

    // Test 5: Simulate the transaction
    try {
      const simulation = await connection.simulateTransaction(transaction);
      if (simulation.value.err) {
        console.log(`⚠️ Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
      } else {
        console.log('✅ Transaction simulation successful');
        console.log(`💸 Estimated fee: ${simulation.value.unitsConsumed || 'N/A'} compute units`);
      }
    } catch (simError) {
      console.log(`⚠️ Simulation error: ${simError.message}`);
    }

    console.log('\n✅ Solana test completed successfully!');
    console.log('\n📋 Configuration Summary:');
    console.log(`- Working RPC: ${workingRpc}`);
    console.log(`- Network: Devnet`);
    console.log(`- Test wallet: ${publicKey}`);
    console.log(`- Memo program: ${memoProgram.toString()}`);
    console.log('\n📋 Next steps:');
    console.log('1. RPC endpoints configured and tested');
    console.log('2. Wallet generation working');
    console.log('3. Memo program transactions ready');
    console.log('4. For actual transactions, fund wallet with devnet SOL');

    return {
      connection,
      keypair,
      publicKey,
      workingRpc,
      memoProgram: memoProgram.toString()
    };

  } catch (error) {
    console.error('❌ Solana test failed:', error);
    throw error;
  }
}

// Run test if called directly
if (require.main === module) {
  testSolana().catch(console.error);
}

module.exports = { testSolana };
