import VehicleBlockchainHistory, { IVehicleBlockchainHistory } from '../models/VehicleBlockchainHistory.model';
import { logger } from '../utils/logger';

export interface BlockchainHistoryEntry {
  transactionType: 'registration' | 'device_install' | 'owner_transfer' | 'mileage_update' | 'service_record';
  transactionHash: string;
  blockchainAddress: string;
  network?: 'devnet' | 'testnet' | 'mainnet';
  metadata?: any;
  timestamp?: Date;
}

export class VehicleBlockchainService {
  /**
   * Add a blockchain transaction record for a vehicle
   */
  static async addTransaction(
    vehicleId: string,
    entry: BlockchainHistoryEntry
  ): Promise<IVehicleBlockchainHistory> {
    try {
      const historyEntry = new VehicleBlockchainHistory({
        vehicleId,
        transactionType: entry.transactionType,
        transactionHash: entry.transactionHash,
        blockchainAddress: entry.blockchainAddress,
        network: entry.network || process.env.NODE_ENV === 'production' ? 'mainnet' : 'devnet',
        metadata: entry.metadata || {},
        timestamp: entry.timestamp || new Date()
      });

      await historyEntry.save();
      
      logger.info(`✅ Added blockchain history entry for vehicle ${vehicleId}: ${entry.transactionType} - ${entry.transactionHash}`);
      
      return historyEntry;
    } catch (error) {
      logger.error('❌ Failed to add blockchain history entry:', error);
      throw error;
    }
  }

  /**
   * Get all blockchain transactions for a vehicle
   */
  static async getVehicleHistory(vehicleId: string): Promise<IVehicleBlockchainHistory[]> {
    try {
      const history = await VehicleBlockchainHistory.find({ vehicleId })
        .sort({ timestamp: -1 })
        .lean();
      
      return history as unknown as IVehicleBlockchainHistory[];
    } catch (error) {
      logger.error(`❌ Failed to get blockchain history for vehicle ${vehicleId}:`, error);
      throw error;
    }
  }

  /**
   * Get transactions by type for a vehicle
   */
  static async getTransactionsByType(
    vehicleId: string,
    transactionType: string
  ): Promise<IVehicleBlockchainHistory[]> {
    try {
      const history = await VehicleBlockchainHistory.find({ vehicleId, transactionType })
        .sort({ timestamp: -1 })
        .lean();
      
      return history as unknown as IVehicleBlockchainHistory[];
    } catch (error) {
      logger.error(`❌ Failed to get ${transactionType} transactions for vehicle ${vehicleId}:`, error);
      throw error;
    }
  }

  /**
   * Get the latest transaction of a specific type
   */
  static async getLatestTransactionByType(
    vehicleId: string,
    transactionType: string
  ): Promise<IVehicleBlockchainHistory | null> {
    try {
      const transaction = await VehicleBlockchainHistory.findOne({ vehicleId, transactionType })
        .sort({ timestamp: -1 })
        .lean();
      
      return transaction as unknown as IVehicleBlockchainHistory | null;
    } catch (error) {
      logger.error(`❌ Failed to get latest ${transactionType} transaction for vehicle ${vehicleId}:`, error);
      throw error;
    }
  }

  /**
   * Get device installation transaction for a vehicle
   */
  static async getDeviceInstallTransaction(vehicleId: string): Promise<IVehicleBlockchainHistory | null> {
    return this.getLatestTransactionByType(vehicleId, 'device_install');
  }

  /**
   * Get vehicle registration transaction
   */
  static async getRegistrationTransaction(vehicleId: string): Promise<IVehicleBlockchainHistory | null> {
    return this.getLatestTransactionByType(vehicleId, 'registration');
  }

  /**
   * Check if a transaction hash already exists
   */
  static async transactionExists(transactionHash: string): Promise<boolean> {
    try {
      const exists = await VehicleBlockchainHistory.exists({ transactionHash });
      return !!exists;
    } catch (error) {
      logger.error(`❌ Failed to check if transaction exists:`, error);
      return false;
    }
  }

  /**
   * Get transaction by hash
   */
  static async getTransactionByHash(transactionHash: string): Promise<IVehicleBlockchainHistory | null> {
    try {
      return await VehicleBlockchainHistory.findOne({ transactionHash }).lean() as unknown as IVehicleBlockchainHistory | null;
    } catch (error) {
      logger.error(`❌ Failed to get transaction by hash:`, error);
      return null;
    }
  }
}

export default VehicleBlockchainService;

