const express = require('express');
const Arweave = require('arweave');
const multer = require('multer');
const cors = require('cors');

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Initialize Arweave
const arweave = Arweave.init({
  host: 'testnet.redstone.tools',
  port: 443,
  protocol: 'https',
  timeout: 20000,
  logging: true
});

// Load wallet from environment
const walletKey = process.env.ARWEAVE_WALLET_KEY;
let wallet = null;

if (walletKey) {
  try {
    wallet = JSON.parse(walletKey);
    console.log('✅ Arweave wallet loaded successfully');
  } catch (e) {
    console.error('❌ Failed to parse Arweave wallet:', e.message);
  }
} else {
  console.warn('⚠️ No Arweave wallet found in environment');
}

// Test endpoints
app.get('/api/blockchain/arweave/status', async (req, res) => {
  try {
    console.log('📊 Checking Arweave status...');
    
    const status = {
      service: 'Arweave',
      network: 'testnet',
      gateway: 'testnet.redstone.tools',
      hasWallet: !!wallet,
      timestamp: new Date().toISOString()
    };

    if (wallet) {
      try {
        const address = await arweave.wallets.jwkToAddress(wallet);
        status.walletAddress = address;
        
        try {
          const balance = await arweave.wallets.getBalance(address);
          status.balance = arweave.ar.winstonToAr(balance) + ' AR';
        } catch (e) {
          status.balance = 'Unable to fetch (gateway busy)';
        }
      } catch (e) {
        status.walletError = e.message;
      }
    }

    try {
      const info = await arweave.network.getInfo();
      status.networkHeight = info.height;
      status.networkVersion = info.release;
    } catch (e) {
      status.networkInfo = 'Unable to fetch (gateway busy)';
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('❌ Arweave status check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check Arweave status',
      error: error.message
    });
  }
});

app.post('/api/blockchain/arweave/estimate-cost', async (req, res) => {
  try {
    const { size } = req.body;
    
    if (!size || size <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid size parameter required'
      });
    }

    console.log(`💸 Estimating cost for ${size} bytes...`);
    
    const price = await arweave.transactions.getPrice(size);
    const arPrice = arweave.ar.winstonToAr(price);
    
    res.json({
      success: true,
      data: {
        sizeBytes: size,
        costWinston: price,
        costAR: arPrice,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Cost estimation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to estimate upload cost',
      error: error.message
    });
  }
});

app.post('/api/blockchain/arweave/upload', upload.single('file'), async (req, res) => {
  try {
    if (!wallet) {
      return res.status(500).json({
        success: false,
        message: 'Arweave wallet not configured'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    const { vehicleId, documentType, metadata } = req.body;
    const file = req.file;

    console.log(`📤 Uploading file: ${file.originalname} (${file.size} bytes)`);

    // Create transaction
    const transaction = await arweave.createTransaction({ 
      data: file.buffer 
    }, wallet);

    // Add tags
    transaction.addTag('Content-Type', file.mimetype);
    transaction.addTag('File-Name', file.originalname);
    transaction.addTag('App-Name', 'BLOCKX');
    transaction.addTag('App-Version', '1.0.0');
    transaction.addTag('Upload-Timestamp', new Date().toISOString());
    
    if (vehicleId) transaction.addTag('Vehicle-ID', vehicleId);
    if (documentType) transaction.addTag('Document-Type', documentType);
    if (metadata) {
      const metaObj = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
      Object.entries(metaObj).forEach(([key, value]) => {
        transaction.addTag(`Meta-${key}`, String(value));
      });
    }

    // Sign and submit
    await arweave.transactions.sign(transaction, wallet);
    
    // For testnet, we might not have balance, so this might fail
    // But we can still return the transaction info
    let submitted = false;
    try {
      await arweave.transactions.post(transaction);
      submitted = true;
      console.log(`✅ Transaction submitted: ${transaction.id}`);
    } catch (e) {
      console.log(`⚠️ Transaction not submitted (likely insufficient balance): ${e.message}`);
    }

    const arweaveUrl = `https://arweave.net/${transaction.id}`;
    const explorerUrl = `https://viewblock.io/arweave/tx/${transaction.id}`;

    res.status(201).json({
      success: true,
      message: submitted ? 'File uploaded to Arweave successfully' : 'Transaction created (not submitted due to insufficient balance)',
      data: {
        transactionId: transaction.id,
        arweaveUrl,
        explorerUrl,
        size: file.size,
        fileName: file.originalname,
        contentType: file.mimetype,
        submitted,
        network: 'testnet',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Arweave upload failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload to Arweave',
      error: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Arweave test server running on port ${PORT}`);
  console.log(`📊 Status: http://localhost:${PORT}/api/blockchain/arweave/status`);
  console.log(`💸 Cost estimation: POST http://localhost:${PORT}/api/blockchain/arweave/estimate-cost`);
  console.log(`📤 Upload: POST http://localhost:${PORT}/api/blockchain/arweave/upload`);
});
