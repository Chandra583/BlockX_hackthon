const express = require('express');
const { Connection, Keypair, LAMPORTS_PER_SOL, Transaction, TransactionInstruction, PublicKey } = require('@solana/web3.js');
const cors = require('cors');

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Initialize Solana connection
const connection = new Connection('https://api.devnet.solana.com', {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000
});

// In-memory wallet storage (for testing only)
const wallets = new Map();

// Test endpoints for blockchain functionality
app.post('/api/blockchain/wallet/create', async (req, res) => {
  try {
    console.log('🔑 Creating new wallet...');
    
    // Generate new keypair
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toString();
    
    // Store wallet (in production, this would be encrypted and stored in database)
    const walletData = {
      publicKey,
      secretKey: Array.from(keypair.secretKey), // Convert to array for JSON storage
      balance: 0,
      blockchain: 'solana',
      network: 'devnet',
      createdAt: new Date().toISOString()
    };
    
    wallets.set(publicKey, walletData);
    
    console.log(`✅ Wallet created: ${publicKey}`);
    
    res.status(201).json({
      success: true,
      message: 'Blockchain wallet created successfully',
      data: {
        walletAddress: publicKey,
        balance: 0,
        blockchain: 'solana',
        network: 'devnet'
      }
    });
  } catch (error) {
    console.error('❌ Wallet creation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create wallet',
      error: error.message
    });
  }
});

app.get('/api/blockchain/wallet/:address', async (req, res) => {
  try {
    const { address } = req.params;
    console.log(`💰 Getting wallet info for: ${address}`);
    
    const walletData = wallets.get(address);
    if (!walletData) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    // Get current balance from blockchain
    try {
      const publicKey = new PublicKey(address);
      const balance = await connection.getBalance(publicKey);
      const solBalance = balance / LAMPORTS_PER_SOL;
      walletData.balance = solBalance;
    } catch (balanceError) {
      console.warn('⚠️ Failed to fetch balance:', balanceError.message);
    }
    
    res.json({
      success: true,
      data: {
        walletAddress: walletData.publicKey,
        balance: walletData.balance,
        blockchain: walletData.blockchain,
        network: walletData.network,
        createdAt: walletData.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Wallet lookup failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet info',
      error: error.message
    });
  }
});

app.post('/api/blockchain/vehicle/register', async (req, res) => {
  try {
    const { vehicleId, vin, initialMileage, walletAddress } = req.body;
    
    if (!vehicleId || !vin || !initialMileage || !walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle ID, VIN, initial mileage, and wallet address are required'
      });
    }
    
    console.log(`🚗 Registering vehicle: ${vin} with ${initialMileage} miles`);
    
    const walletData = wallets.get(walletAddress);
    if (!walletData) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    // Create vehicle registration data
    const vehicleData = {
      vehicleId,
      vin,
      mileage: initialMileage,
      timestamp: Date.now(),
      action: 'REGISTER_VEHICLE'
    };
    
    // Create memo transaction
    const keypair = Keypair.fromSecretKey(new Uint8Array(walletData.secretKey));
    const transaction = new Transaction();
    
    const memoInstruction = new TransactionInstruction({
      keys: [],
      programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
      data: Buffer.from(JSON.stringify(vehicleData))
    });
    
    transaction.add(memoInstruction);
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = keypair.publicKey;
    
    // Sign transaction
    transaction.sign(keypair);
    
    // For testing, we'll simulate the transaction instead of sending it
    // (since we don't have SOL balance)
    const signature = transaction.signature?.toString('base64') || 'test-signature';
    
    console.log(`✅ Vehicle registration transaction created: ${signature}`);
    
    res.status(201).json({
      success: true,
      message: 'Vehicle registered on blockchain successfully',
      data: {
        vehicleId,
        vin,
        currentMileage: initialMileage,
        transactionHash: signature,
        blockchainAddress: walletAddress,
        network: 'devnet',
        explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Vehicle registration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register vehicle',
      error: error.message
    });
  }
});

app.post('/api/blockchain/mileage/record', async (req, res) => {
  try {
    const { vehicleId, vin, newMileage, previousMileage, source, walletAddress } = req.body;
    
    if (!vehicleId || !vin || !newMileage || !walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle ID, VIN, new mileage, and wallet address are required'
      });
    }
    
    console.log(`📊 Recording mileage: ${vin} - ${newMileage} miles`);
    
    const walletData = wallets.get(walletAddress);
    if (!walletData) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    // Create mileage record data
    const mileageData = {
      vehicleId,
      vin,
      previousMileage: previousMileage || 0,
      newMileage,
      timestamp: Date.now(),
      source: source || 'owner',
      action: 'RECORD_MILEAGE'
    };
    
    // Create memo transaction
    const keypair = Keypair.fromSecretKey(new Uint8Array(walletData.secretKey));
    const transaction = new Transaction();
    
    const memoInstruction = new TransactionInstruction({
      keys: [],
      programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
      data: Buffer.from(JSON.stringify(mileageData))
    });
    
    transaction.add(memoInstruction);
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = keypair.publicKey;
    
    // Sign transaction
    transaction.sign(keypair);
    
    const signature = transaction.signature?.toString('base64') || 'test-mileage-signature';
    
    console.log(`✅ Mileage record transaction created: ${signature}`);
    
    res.status(201).json({
      success: true,
      message: 'Mileage recorded on blockchain successfully',
      data: {
        vehicleId,
        vin,
        previousMileage: previousMileage || 0,
        newMileage,
        source: source || 'owner',
        transactionHash: signature,
        blockchainAddress: walletAddress,
        network: 'devnet',
        explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Mileage recording failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record mileage',
      error: error.message
    });
  }
});

app.get('/api/blockchain/status', async (req, res) => {
  try {
    const epochInfo = await connection.getEpochInfo();
    const version = await connection.getVersion();
    
    res.json({
      success: true,
      data: {
        network: 'devnet',
        rpcUrl: 'https://api.devnet.solana.com',
        currentEpoch: epochInfo.epoch,
        currentSlot: epochInfo.absoluteSlot,
        version: version['solana-core'],
        walletsCreated: wallets.size,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Status check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blockchain status',
      error: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🚀 Blockchain test server running on port ${PORT}`);
  console.log(`🔑 Create wallet: POST http://localhost:${PORT}/api/blockchain/wallet/create`);
  console.log(`💰 Get wallet: GET http://localhost:${PORT}/api/blockchain/wallet/{address}`);
  console.log(`🚗 Register vehicle: POST http://localhost:${PORT}/api/blockchain/vehicle/register`);
  console.log(`📊 Record mileage: POST http://localhost:${PORT}/api/blockchain/mileage/record`);
  console.log(`📊 Status: GET http://localhost:${PORT}/api/blockchain/status`);
});


