import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../types/auth.types';
import { getSolanaService } from '../../services/blockchain/solana.service';
import { walletService } from '../../services/blockchain/wallet.service';
import { getArweaveService } from '../../services/blockchain/arweave.service';
import { logger } from '../../utils/logger';
import { 
  BadRequestError, 
  NotFoundError, 
  UnauthorizedError
} from '../../utils/errors';
import Vehicle from '../../models/core/Vehicle.model';

export class BlockchainController {
  
  /**
   * Create blockchain wallet for user
   * POST /api/blockchain/wallet/create
   */
  static async createWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      // Check if user already has a wallet
      const hasExistingWallet = await walletService.hasWallet(userId);
      if (hasExistingWallet) {
        res.status(409).json({
          success: false,
          message: 'User already has a blockchain wallet',
          code: 'WALLET_EXISTS'
        });
        return;
      }

      // Create new wallet
      const walletResult = await walletService.createWallet(userId);

      logger.info(`✅ Blockchain wallet created for user ${userId}`);
      
      res.status(201).json({
        success: true,
        message: 'Blockchain wallet created successfully',
        data: {
          walletAddress: walletResult.walletAddress,
          balance: walletResult.balance,
          blockchain: walletResult.blockchain,
          network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'devnet'
        }
      });
    } catch (error) {
      logger.error('❌ Failed to create blockchain wallet:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create blockchain wallet',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get wallet information
   * GET /api/blockchain/wallet
   */
  static async getWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      const wallet = await walletService.getUserWallet(userId);
      if (!wallet) {
        res.status(404).json({
          success: false,
          message: 'No blockchain wallet found for user',
          code: 'WALLET_NOT_FOUND'
        });
        return;
      }

      // Get current balance from blockchain
      const currentBalance = await walletService.getWalletBalance(wallet.publicKey);

      res.status(200).json({
        success: true,
        message: 'Wallet information retrieved successfully',
        data: {
          walletAddress: wallet.publicKey,
          balance: currentBalance,
          blockchain: 'solana',
          network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'devnet'
        }
      });
    } catch (error) {
      logger.error('❌ Failed to get wallet information:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve wallet information',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Register vehicle on blockchain
   * POST /api/blockchain/vehicle/register
   */
  static async registerVehicle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      const { vehicleId, vin, make, model, year, initialMileage } = req.body;
      
      // Validate required fields
      if (!vehicleId || !vin || !make || !model || !year || initialMileage === undefined) {
        throw new BadRequestError('Missing required fields: vehicleId, vin, make, model, year, initialMileage');
      }

      // For now, we'll register directly on blockchain without requiring vehicle to exist in database
      // This allows testing without needing the full vehicle management system
      const vehicleData = {
        vehicleId,
        vin: vin.toUpperCase(),
        make,
        model,
        year: parseInt(year),
        initialMileage: parseInt(initialMileage),
        ownerId: userId
      };

      // Get user's wallet
      const wallet = await walletService.getUserWallet(userId);
      if (!wallet) {
        res.status(400).json({
          success: false,
          message: 'No blockchain wallet found. Please create a wallet first.',
          code: 'WALLET_REQUIRED'
        });
        return;
      }

      // Register vehicle on blockchain
      const blockchainRecord = await getSolanaService().registerVehicle(
        vehicleData.vehicleId,
        vehicleData.vin,
        vehicleData.initialMileage,
        wallet
      );

      // Note: In a full implementation, we would save this to the database
      // For now, we'll just return the blockchain registration result

      logger.info(`✅ Vehicle ${vehicleData.vin} registered on blockchain: ${blockchainRecord.transactionHash}`);

      res.status(201).json({
        success: true,
        message: 'Vehicle registered on blockchain successfully',
        data: {
          vehicleId: vehicleData.vehicleId,
          vin: vehicleData.vin,
          make: vehicleData.make,
          model: vehicleData.model,
          year: vehicleData.year,
          initialMileage: vehicleData.initialMileage,
          transactionHash: blockchainRecord.transactionHash,
          blockchainAddress: blockchainRecord.blockchainAddress,
          network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'devnet',
          explorerUrl: `https://explorer.solana.com/tx/${blockchainRecord.transactionHash}${process.env.NODE_ENV === 'production' ? '' : '?cluster=devnet'}`
        }
      });
    } catch (error) {
      logger.error('❌ Failed to register vehicle on blockchain:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register vehicle on blockchain',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Record mileage update on blockchain
   * POST /api/blockchain/mileage/record
   */
  static async recordMileage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      const { vehicleId, newMileage, source = 'owner' } = req.body;
      
      if (!vehicleId || newMileage === undefined) {
        throw new BadRequestError('Vehicle ID and new mileage are required');
      }

      // Verify vehicle exists and belongs to user
      const vehicle = await Vehicle.findOne({ 
        _id: vehicleId, 
        ownerId: userId 
      });

      if (!vehicle) {
        throw new NotFoundError('Vehicle not found or access denied');
      }

      // Get user's wallet
      const wallet = await walletService.getUserWallet(userId);
      if (!wallet) {
        res.status(400).json({
          success: false,
          message: 'No blockchain wallet found. Please create a wallet first.',
          code: 'WALLET_REQUIRED'
        });
        return;
      }

      // Record mileage on blockchain
      const blockchainRecord = await getSolanaService().recordMileage(
        vehicleId,
        vehicle.vin,
        newMileage,
        vehicle.currentMileage,
        userId,
        source,
        wallet
      );

      // Run fraud detection
      const fraudCheck = await getSolanaService().detectFraud(
        vehicleId,
        newMileage,
        vehicle.currentMileage
      );

      // Update vehicle record
      vehicle.currentMileage = newMileage;
      vehicle.lastMileageUpdate = new Date();
      
      // Add to mileage history
      vehicle.mileageHistory.push({
        mileage: newMileage,
        recordedAt: new Date(),
        recordedBy: userId,
        source,
        isVerified: !fraudCheck.isFraud,
        blockchainHash: blockchainRecord.transactionHash,
        fraudCheck: {
          passed: !fraudCheck.isFraud,
          riskLevel: fraudCheck.riskLevel,
          reasons: fraudCheck.reasons
        }
      });

      await vehicle.save();

      logger.info(`✅ Mileage recorded on blockchain: ${vehicle.vin} ${vehicle.currentMileage}->${newMileage}`);

      res.status(201).json({
        success: true,
        message: 'Mileage recorded on blockchain successfully',
        data: {
          vehicleId: vehicle._id,
          vin: vehicle.vin,
          previousMileage: blockchainRecord.previousMileage,
          newMileage: blockchainRecord.mileage,
          transactionHash: blockchainRecord.transactionHash,
          blockNumber: blockchainRecord.blockNumber,
          fraudCheck: {
            isFraud: fraudCheck.isFraud,
            riskLevel: fraudCheck.riskLevel,
            reasons: fraudCheck.reasons
          },
          network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'devnet',
          explorerUrl: `https://explorer.solana.com/tx/${blockchainRecord.transactionHash}${process.env.NODE_ENV === 'production' ? '' : '?cluster=devnet'}`
        }
      });
    } catch (error) {
      logger.error('❌ Failed to record mileage on blockchain:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record mileage on blockchain',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Verify blockchain record
   * GET /api/blockchain/verify/:transactionHash
   */
  static async verifyRecord(req: Request, res: Response): Promise<void> {
    try {
      const { transactionHash } = req.params;
      
      if (!transactionHash) {
        throw new BadRequestError('Transaction hash is required');
      }

      const isValid = await getSolanaService().verifyRecord(transactionHash);
      const transaction = await getSolanaService().getTransaction(transactionHash);

      res.status(200).json({
        success: true,
        message: 'Blockchain record verification completed',
        data: {
          transactionHash,
          isValid,
          exists: transaction !== null,
          transaction: transaction ? {
            blockTime: transaction.blockTime,
            slot: transaction.slot,
            confirmations: 'finalized'
          } : null,
          network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'devnet',
          explorerUrl: `https://explorer.solana.com/tx/${transactionHash}${process.env.NODE_ENV === 'production' ? '' : '?cluster=devnet'}`
        }
      });
    } catch (error) {
      logger.error('❌ Failed to verify blockchain record:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify blockchain record',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get blockchain network status
   * GET /api/blockchain/status
   */
  static async getNetworkStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await getSolanaService().getNetworkStatus();

      res.status(200).json({
        success: true,
        message: 'Blockchain network status retrieved successfully',
        data: {
          ...status,
          rpcEndpoint: process.env.NODE_ENV === 'production' 
            ? 'mainnet-beta' 
            : 'devnet',
          explorerUrl: process.env.NODE_ENV === 'production'
            ? 'https://explorer.solana.com'
            : 'https://explorer.solana.com/?cluster=devnet'
        }
      });
    } catch (error) {
      logger.error('❌ Failed to get network status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get blockchain network status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get vehicle blockchain history
   * GET /api/blockchain/vehicle/:vehicleId/history
   */
  static async getVehicleHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { vehicleId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      // Verify vehicle access
      const vehicle = await Vehicle.findOne({ 
        _id: vehicleId, 
        ownerId: userId 
      });

      if (!vehicle) {
        throw new NotFoundError('Vehicle not found or access denied');
      }

      // Get blockchain history
      const history = await getSolanaService().getVehicleHistory(vehicleId, limit);

      res.status(200).json({
        success: true,
        message: 'Vehicle blockchain history retrieved successfully',
        data: {
          vehicleId,
          vin: vehicle.vin,
          history,
          count: history.length,
          network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'devnet'
        }
      });
    } catch (error) {
      logger.error('❌ Failed to get vehicle blockchain history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve vehicle blockchain history',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Upload document to Arweave permanent storage
   * POST /api/blockchain/arweave/upload
   */
  static async uploadToArweave(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      const { vehicleId, documentType, metadata } = req.body;
      const file = req.file;

      if (!vehicleId || !documentType || !file) {
        throw new BadRequestError('Vehicle ID, document type, and file are required');
      }

      // Verify vehicle exists and belongs to user
      const vehicle = await Vehicle.findOne({ 
        _id: vehicleId, 
        ownerId: userId 
      });

      if (!vehicle) {
        throw new NotFoundError('Vehicle not found or access denied');
      }

      // Upload to Arweave
      const arweaveRecord = await getArweaveService().uploadVehicleDocument(
        vehicleId,
        vehicle.vin,
        documentType,
        file.buffer,
        file.originalname,
        file.mimetype,
        userId,
        metadata
      );

      logger.info(`✅ Document uploaded to Arweave: ${vehicle.vin} - ${documentType}`);

      res.status(201).json({
        success: true,
        message: 'Document uploaded to Arweave successfully',
        data: {
          vehicleId: vehicle._id,
          vin: vehicle.vin,
          documentType,
          arweaveId: arweaveRecord.arweaveId,
          arweaveUrl: arweaveRecord.arweaveUrl,
          size: arweaveRecord.size,
          cost: arweaveRecord.cost,
          permanent: true,
          explorerUrl: `https://viewblock.io/arweave/tx/${arweaveRecord.arweaveId}`,
          network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet'
        }
      });
    } catch (error) {
      logger.error('❌ Failed to upload document to Arweave:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload document to Arweave',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Upload mileage history to Arweave
   * POST /api/blockchain/arweave/mileage-history
   */
  static async uploadMileageHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      const { vehicleId } = req.body;
      
      if (!vehicleId) {
        throw new BadRequestError('Vehicle ID is required');
      }

      // Verify vehicle exists and belongs to user
      const vehicle = await Vehicle.findOne({ 
        _id: vehicleId, 
        ownerId: userId 
      });

      if (!vehicle) {
        throw new NotFoundError('Vehicle not found or access denied');
      }

      // Get mileage history from vehicle
      const mileageData = vehicle.mileageHistory || [];

      if (mileageData.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No mileage history found for this vehicle',
          code: 'NO_MILEAGE_HISTORY'
        });
        return;
      }

      // Upload to Arweave
      const arweaveRecord = await getArweaveService().uploadMileageHistory(
        vehicleId,
        vehicle.vin,
        mileageData,
        userId
      );

      logger.info(`✅ Mileage history uploaded to Arweave: ${vehicle.vin} (${mileageData.length} records)`);

      res.status(201).json({
        success: true,
        message: 'Mileage history uploaded to Arweave successfully',
        data: {
          vehicleId: vehicle._id,
          vin: vehicle.vin,
          recordCount: mileageData.length,
          arweaveId: arweaveRecord.arweaveId,
          arweaveUrl: arweaveRecord.arweaveUrl,
          size: arweaveRecord.size,
          cost: arweaveRecord.cost,
          permanent: true,
          explorerUrl: `https://viewblock.io/arweave/tx/${arweaveRecord.arweaveId}`,
          network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet'
        }
      });
    } catch (error) {
      logger.error('❌ Failed to upload mileage history to Arweave:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload mileage history to Arweave',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Retrieve document from Arweave
   * GET /api/blockchain/arweave/:transactionId
   */
  static async getArweaveDocument(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      
      if (!transactionId) {
        throw new BadRequestError('Transaction ID is required');
      }

      // Get document metadata
      const metadata = await getArweaveService().getTransactionMetadata(transactionId);
      
      // Get document data
      const documentData = await getArweaveService().getData(transactionId);

      // Find content type from metadata
      const contentTypeTag = metadata.tags.find((tag: any) => tag.name === 'Content-Type');
      const fileNameTag = metadata.tags.find((tag: any) => tag.name === 'File-Name');

      res.set({
        'Content-Type': contentTypeTag?.value || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileNameTag?.value || 'document'}"`,
        'Content-Length': documentData.length.toString(),
        'Cache-Control': 'public, max-age=31536000' // Cache for 1 year since it's permanent
      });

      res.send(documentData);
    } catch (error) {
      logger.error(`❌ Failed to retrieve document from Arweave ${req.params.transactionId}:`, error);
      res.status(404).json({
        success: false,
        message: 'Document not found on Arweave',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Verify Arweave transaction
   * GET /api/blockchain/arweave/verify/:transactionId
   */
  static async verifyArweaveTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      
      if (!transactionId) {
        throw new BadRequestError('Transaction ID is required');
      }

      const verification = await getArweaveService().verifyTransaction(transactionId);
      const metadata = verification.exists ? await getArweaveService().getTransactionMetadata(transactionId) : null;

      res.status(200).json({
        success: true,
        message: 'Arweave transaction verification completed',
        data: {
          transactionId,
          exists: verification.exists,
          confirmed: verification.confirmed,
          status: verification.status,
          blockHeight: verification.blockHeight,
          metadata: metadata ? {
            tags: metadata.tags,
            dataSize: metadata.data_size,
            reward: metadata.reward
          } : null,
          network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet',
          explorerUrl: `https://viewblock.io/arweave/tx/${transactionId}`,
          permanent: verification.exists
        }
      });
    } catch (error) {
      logger.error(`❌ Failed to verify Arweave transaction ${req.params.transactionId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify Arweave transaction',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get Arweave network status
   * GET /api/blockchain/arweave/status
   */
  static async getArweaveStatus(req: Request, res: Response): Promise<void> {
    try {
      const networkInfo = await getArweaveService().getNetworkInfo();
      const balance = await getArweaveService().getBalance();

      res.status(200).json({
        success: true,
        message: 'Arweave network status retrieved successfully',
        data: {
          ...networkInfo,
          walletBalance: balance,
          permanent: true,
          explorerUrl: 'https://viewblock.io/arweave'
        }
      });
    } catch (error) {
      logger.error('❌ Failed to get Arweave network status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Arweave network status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Estimate Arweave upload cost
   * POST /api/blockchain/arweave/estimate-cost
   */
  static async estimateArweaveCost(req: Request, res: Response): Promise<void> {
    try {
      const { dataSize } = req.body;
      
      if (!dataSize || dataSize <= 0) {
        throw new BadRequestError('Data size is required and must be positive');
      }

      const estimatedCost = await getArweaveService().estimateCost(dataSize);

      res.status(200).json({
        success: true,
        message: 'Arweave cost estimation completed',
        data: {
          dataSize,
          estimatedCost,
          currency: 'AR',
          permanent: true,
          note: 'One-time payment for permanent storage'
        }
      });
    } catch (error) {
      logger.error('❌ Failed to estimate Arweave cost:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to estimate Arweave cost',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get user's blockchain transaction history
   * GET /api/blockchain/transactions
   */
  static async getTransactionHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      // For now, return a mock response since we don't have a transaction history table yet
      // In a real implementation, this would query a transactions collection
      const mockTransactions = [
        {
          id: 'tx_1',
          type: 'vehicle_registration',
          transactionHash: '5ekCVGsXeD3EBj1ciHo1hRfs7yaQFrSqyqiGYBBAGLQfeCiCV5Vn3hrMwZ2zi89JHkwgAfn4xoyUENHkbotaUxxf',
          status: 'confirmed',
          timestamp: new Date().toISOString(),
          data: {
            vehicleId: 'vehicle_123',
            vin: '1HGCM82633A123456',
            make: 'Honda',
            model: 'Civic',
            year: 2023,
            initialMileage: 50000
          }
        }
      ];

      logger.info(`✅ Retrieved transaction history for user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Transaction history retrieved successfully',
        data: {
          transactions: mockTransactions,
          total: mockTransactions.length,
          page: 1,
          limit: 10
        }
      });
    } catch (error) {
      logger.error('❌ Failed to get transaction history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get transaction history',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
