import { Request, Response } from 'express';
import { VehicleBlockchainService } from '../services/vehicleBlockchain.service';
import { logger } from '../utils/logger';

export class VehicleBlockchainController {
  /**
   * Get blockchain history for a vehicle
   * GET /api/vehicles/:vehicleId/blockchain-history
   */
  static async getVehicleBlockchainHistory(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const { type } = req.query;

      if (!vehicleId) {
        res.status(400).json({
          success: false,
          message: 'Vehicle ID is required'
        });
        return;
      }

      let history;
      
      if (type && typeof type === 'string') {
        // Get transactions by specific type
        history = await VehicleBlockchainService.getTransactionsByType(vehicleId, type);
      } else {
        // Get all transactions
        history = await VehicleBlockchainService.getVehicleHistory(vehicleId);
      }

      res.status(200).json({
        success: true,
        message: 'Blockchain history retrieved successfully',
        data: {
          vehicleId,
          transactions: history.map(tx => ({
            id: tx._id,
            type: tx.transactionType,
            hash: tx.transactionHash,
            blockchainAddress: tx.blockchainAddress,
            network: tx.network,
            metadata: tx.metadata,
            timestamp: tx.timestamp,
            explorerUrl: `https://explorer.solana.com/tx/${tx.transactionHash}${tx.network !== 'mainnet' ? `?cluster=${tx.network}` : ''}`
          })),
          total: history.length
        }
      });
    } catch (error) {
      logger.error('❌ Failed to get blockchain history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve blockchain history',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get device installation transaction for a vehicle
   * GET /api/vehicles/:vehicleId/blockchain-history/device-install
   */
  static async getDeviceInstallTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;

      if (!vehicleId) {
        res.status(400).json({
          success: false,
          message: 'Vehicle ID is required'
        });
        return;
      }

      const transaction = await VehicleBlockchainService.getDeviceInstallTransaction(vehicleId);

      if (!transaction) {
        res.status(404).json({
          success: false,
          message: 'No device installation transaction found for this vehicle'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Device installation transaction retrieved successfully',
        data: {
          id: transaction._id,
          type: transaction.transactionType,
          hash: transaction.transactionHash,
          blockchainAddress: transaction.blockchainAddress,
          network: transaction.network,
          metadata: transaction.metadata,
          timestamp: transaction.timestamp,
          explorerUrl: `https://explorer.solana.com/tx/${transaction.transactionHash}${transaction.network !== 'mainnet' ? `?cluster=${transaction.network}` : ''}`
        }
      });
    } catch (error) {
      logger.error('❌ Failed to get device install transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve device installation transaction',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get registration transaction for a vehicle
   * GET /api/vehicles/:vehicleId/blockchain-history/registration
   */
  static async getRegistrationTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;

      if (!vehicleId) {
        res.status(400).json({
          success: false,
          message: 'Vehicle ID is required'
        });
        return;
      }

      const transaction = await VehicleBlockchainService.getRegistrationTransaction(vehicleId);

      if (!transaction) {
        res.status(404).json({
          success: false,
          message: 'No registration transaction found for this vehicle'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Registration transaction retrieved successfully',
        data: {
          id: transaction._id,
          type: transaction.transactionType,
          hash: transaction.transactionHash,
          blockchainAddress: transaction.blockchainAddress,
          network: transaction.network,
          metadata: transaction.metadata,
          timestamp: transaction.timestamp,
          explorerUrl: `https://explorer.solana.com/tx/${transaction.transactionHash}${transaction.network !== 'mainnet' ? `?cluster=${transaction.network}` : ''}`
        }
      });
    } catch (error) {
      logger.error('❌ Failed to get registration transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve registration transaction',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default VehicleBlockchainController;

