import { Router } from 'express';
import { BlockchainController } from '../../controllers/blockchain/blockchain.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { AuthenticatedRequest } from '../../types/auth.types';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import migrateWalletRoutes from './migrate-wallet.routes';

const router = Router();

// Rate limiting for blockchain operations
const blockchainRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: {
    success: false,
    message: 'Too many blockchain requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for wallet creation (once per user ideally)
const walletCreationLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Maximum 3 wallet creation attempts per hour
  message: {
    success: false,
    message: 'Too many wallet creation attempts, please try again later.',
    code: 'WALLET_CREATION_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload configuration for Arweave
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/json'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  }
});

// Apply rate limiting to all blockchain routes
router.use(blockchainRateLimit);

/**
 * @route   POST /api/blockchain/wallet/create
 * @desc    Create a new blockchain wallet for the user
 * @access  Private (any authenticated user)
 */
router.post('/wallet/create', 
  walletCreationLimit,
  authenticate, 
  BlockchainController.createWallet
);

/**
 * @route   GET /api/blockchain/wallet
 * @desc    Get user's blockchain wallet information
 * @access  Private (any authenticated user)
 */
router.get('/wallet', 
  authenticate, 
  BlockchainController.getWallet
);

/**
 * @route   DELETE /api/blockchain/wallet/reset
 * @desc    Reset corrupted wallet (delete old wallet data)
 * @access  Private (any authenticated user)
 */
router.delete('/wallet/reset', 
  authenticate,
  async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const User = require('../../models/core/User.model').User;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.blockchainWallet) {
        return res.status(404).json({
          success: false,
          message: 'No wallet found to reset'
        });
      }

      // Backup info for logs
      const oldAddress = user.blockchainWallet.walletAddress;
      require('../../utils/logger').logger.info(`🔄 Resetting wallet for user ${userId}, old address: ${oldAddress}`);

      // Delete wallet
      user.blockchainWallet = undefined;
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Wallet reset successfully. You can now create a new wallet.',
        oldWalletAddress: oldAddress,
        nextStep: 'POST /api/blockchain/wallet/create'
      });

    } catch (error: any) {
      require('../../utils/logger').logger.error('❌ Wallet reset failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Wallet reset failed',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/blockchain/wallet/migrate
 * @desc    Migrate wallet from legacy to new encryption format
 * @access  Private (any authenticated user)
 */
router.use('/wallet', authenticate, migrateWalletRoutes);

/**
 * @route   POST /api/blockchain/vehicle/register
 * @desc    Register a vehicle on the blockchain (Admin only - Use admin approval endpoint instead)
 * @access  Private (Admin only)
 * @deprecated Use /api/admin/vehicles/:vehicleId/approve instead
 */
router.post('/vehicle/register', 
  authenticate, 
  authorize('admin'), 
  BlockchainController.registerVehicle
);

/**
 * @route   POST /api/blockchain/mileage/record
 * @desc    Record mileage update on blockchain
 * @access  Private (Vehicle owners, service providers, inspectors)
 */
router.post('/mileage/record', 
  authenticate, 
  authorize('owner', 'service', 'government', 'admin'), 
  BlockchainController.recordMileage
);

/**
 * @route   GET /api/blockchain/verify/:transactionHash
 * @desc    Verify a blockchain record
 * @access  Public (anyone can verify blockchain records)
 */
router.get('/verify/:transactionHash', 
  BlockchainController.verifyRecord
);

/**
 * @route   GET /api/blockchain/status
 * @desc    Get blockchain network status
 * @access  Public
 */
router.get('/status', 
  BlockchainController.getNetworkStatus
);

/**
 * @route   GET /api/blockchain/wallet/transactions
 * @desc    Get wallet transactions directly from Solana blockchain
 * @access  Private (All authenticated users)
 */
router.get('/wallet/transactions', 
  authenticate, 
  BlockchainController.getWalletTransactions
);

/**
 * @route   GET /api/blockchain/transactions
 * @desc    Get user's blockchain transaction history
 * @access  Private (All authenticated users)
 */
router.get('/transactions', 
  authenticate, 
  BlockchainController.getTransactionHistory
);

/**
 * @route   GET /api/blockchain/vehicle/:vehicleId/history
 * @desc    Get blockchain history for a vehicle
 * @access  Private (Vehicle owners, buyers, service providers, government)
 */
router.get('/vehicle/:vehicleId/history', 
  authenticate, 
  authorize('owner', 'buyer', 'service', 'insurance', 'government', 'admin'), 
  BlockchainController.getVehicleHistory
);

// ========== ARWEAVE ROUTES ==========

/**
 * @route   POST /api/blockchain/arweave/upload
 * @desc    Upload document to Arweave permanent storage
 * @access  Private (Vehicle owners, service providers)
 */
router.post('/arweave/upload', 
  authenticate, 
  authorize('owner', 'service', 'admin'),
  upload.single('file'),
  BlockchainController.uploadToArweave
);

/**
 * @route   POST /api/blockchain/arweave/mileage-history
 * @desc    Upload mileage history to Arweave
 * @access  Private (Vehicle owners, admin)
 */
router.post('/arweave/mileage-history', 
  authenticate, 
  authorize('owner', 'admin'), 
  BlockchainController.uploadMileageHistory
);

/**
 * @route   GET /api/blockchain/arweave/:transactionId
 * @desc    Retrieve document from Arweave
 * @access  Public (permanent storage is publicly accessible)
 */
router.get('/arweave/:transactionId', 
  BlockchainController.getArweaveDocument
);

/**
 * @route   GET /api/blockchain/arweave/verify/:transactionId
 * @desc    Verify Arweave transaction
 * @access  Public
 */
router.get('/arweave/verify/:transactionId', 
  BlockchainController.verifyArweaveTransaction
);

/**
 * @route   GET /api/blockchain/arweave/status
 * @desc    Get Arweave network status
 * @access  Public
 */
router.get('/arweave/status', 
  BlockchainController.getArweaveStatus
);

/**
 * @route   POST /api/blockchain/arweave/estimate-cost
 * @desc    Estimate Arweave upload cost
 * @access  Public
 */
router.post('/arweave/estimate-cost', 
  BlockchainController.estimateArweaveCost
);

export default router;
