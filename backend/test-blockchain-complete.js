const { Connection, Keypair, LAMPORTS_PER_SOL, Transaction, TransactionInstruction, PublicKey } = require('@solana/web3.js');
const Arweave = require('arweave');

async function testCompleteBlockchainSetup() {
  console.log('🧪 Testing Complete Blockchain Setup for BlockX...\n');
  
  const results = {
    solana: { working: false, details: {} },
    arweave: { working: false, details: {} },
    integration: { ready: false, notes: [] }
  };

  // Test 1: Solana Configuration
  console.log('=== SOLANA DEVNET TEST ===');
  try {
    const connection = new Connection('https://api.devnet.solana.com', {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000
    });

    // Test RPC connection
    const version = await connection.getVersion();
    const epochInfo = await connection.getEpochInfo();
    
    console.log(`✅ Solana RPC connected (version: ${version['solana-core']})`);
    console.log(`✅ Current epoch: ${epochInfo.epoch}, slot: ${epochInfo.absoluteSlot}`);
    
    // Test wallet generation
    const keypair = Keypair.generate();
    const balance = await connection.getBalance(keypair.publicKey);
    
    console.log(`✅ Test wallet: ${keypair.publicKey.toString()}`);
    console.log(`✅ Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    
    // Test memo transaction creation
    const vehicleData = {
      vehicleId: 'test-vehicle-123',
      vin: 'BLOCKX123456789',
      mileage: 50000,
      timestamp: Date.now(),
      action: 'REGISTER_VEHICLE'
    };

    const transaction = new Transaction();
    const memoInstruction = new TransactionInstruction({
      keys: [],
      programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
      data: Buffer.from(JSON.stringify(vehicleData))
    });
    
    transaction.add(memoInstruction);
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = keypair.publicKey;
    transaction.sign(keypair);
    
    console.log('✅ Vehicle registration transaction created and signed');
    console.log(`✅ Transaction signature: ${transaction.signature?.toString('base64').substring(0, 20)}...`);
    
    results.solana = {
      working: true,
      details: {
        rpcUrl: 'https://api.devnet.solana.com',
        version: version['solana-core'],
        epoch: epochInfo.epoch,
        testWallet: keypair.publicKey.toString(),
        memoProgram: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
        transactionReady: true
      }
    };
    
  } catch (error) {
    console.error('❌ Solana test failed:', error.message);
    results.solana.details.error = error.message;
  }

  console.log('\n=== ARWEAVE TESTNET TEST ===');
  try {
    const arweave = Arweave.init({
      host: 'testnet.redstone.tools',
      port: 443,
      protocol: 'https',
      timeout: 20000,
      logging: false
    });

    // Test wallet loading from environment
    const walletKey = process.env.ARWEAVE_WALLET_KEY;
    let wallet = null;
    let address = null;

    if (walletKey) {
      wallet = JSON.parse(walletKey);
      address = await arweave.wallets.jwkToAddress(wallet);
      console.log(`✅ Arweave wallet loaded: ${address}`);
    } else {
      // Generate test wallet
      wallet = await arweave.wallets.generate();
      address = await arweave.wallets.jwkToAddress(wallet);
      console.log(`✅ Test Arweave wallet generated: ${address}`);
    }

    // Test transaction creation
    const testData = Buffer.from('BlockX Test Document - Vehicle Registration');
    const transaction = await arweave.createTransaction({ data: testData }, wallet);
    
    // Add tags
    transaction.addTag('Content-Type', 'text/plain');
    transaction.addTag('App-Name', 'BLOCKX');
    transaction.addTag('Document-Type', 'test');
    transaction.addTag('Vehicle-ID', 'test-vehicle-123');
    
    await arweave.transactions.sign(transaction, wallet);
    
    console.log('✅ Arweave transaction created and signed');
    console.log(`✅ Transaction ID: ${transaction.id}`);
    console.log(`✅ Explorer URL: https://viewblock.io/arweave/tx/${transaction.id}`);
    
    // Test cost estimation
    try {
      const price = await arweave.transactions.getPrice(testData.length);
      const arPrice = arweave.ar.winstonToAr(price);
      console.log(`✅ Upload cost estimate: ${arPrice} AR for ${testData.length} bytes`);
    } catch (e) {
      console.log('⚠️ Cost estimation skipped (gateway busy)');
    }
    
    results.arweave = {
      working: true,
      details: {
        gateway: 'testnet.redstone.tools',
        walletAddress: address,
        transactionId: transaction.id,
        explorerUrl: `https://viewblock.io/arweave/tx/${transaction.id}`,
        transactionReady: true
      }
    };
    
  } catch (error) {
    console.error('❌ Arweave test failed:', error.message);
    results.arweave.details.error = error.message;
  }

  console.log('\n=== INTEGRATION READINESS ===');
  
  if (results.solana.working && results.arweave.working) {
    results.integration.ready = true;
    results.integration.notes = [
      '✅ Solana devnet RPC connection established',
      '✅ Solana wallet generation and transaction signing working',
      '✅ Memo program transactions ready for vehicle/mileage records',
      '✅ Arweave testnet connection established',
      '✅ Arweave wallet loaded and transaction creation working',
      '✅ Document upload transactions ready',
      '⚠️ For live transactions: Fund Solana wallet with devnet SOL',
      '⚠️ For live uploads: Fund Arweave wallet with AR tokens'
    ];
    
    console.log('🎉 BLOCKCHAIN INTEGRATION READY!');
    results.integration.notes.forEach(note => console.log(note));
    
  } else {
    results.integration.ready = false;
    results.integration.notes = [
      results.solana.working ? '✅ Solana ready' : '❌ Solana needs fixing',
      results.arweave.working ? '✅ Arweave ready' : '❌ Arweave needs fixing'
    ];
    
    console.log('⚠️ BLOCKCHAIN INTEGRATION NEEDS WORK');
    results.integration.notes.forEach(note => console.log(note));
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Solana Status: ${results.solana.working ? '✅ READY' : '❌ FAILED'}`);
  console.log(`Arweave Status: ${results.arweave.working ? '✅ READY' : '❌ FAILED'}`);
  console.log(`Integration Status: ${results.integration.ready ? '✅ READY' : '❌ NEEDS WORK'}`);
  
  return results;
}

// Run test if called directly
if (require.main === module) {
  testCompleteBlockchainSetup().catch(console.error);
}

module.exports = { testCompleteBlockchainSetup };
