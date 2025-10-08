import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  TransactionInstruction
} from '@solana/web3.js';
import { logger } from '../../utils/logger';
import { Types } from 'mongoose';

// Interfaces
export interface SolanaWallet {
  publicKey: string;
  secretKey: Uint8Array;
  balance: number;
}

export interface VehicleBlockchainRecord {
  vehicleId: string;
  vin: string;
  currentMileage: number;
  lastUpdate: Date;
  transactionHash: string;
  blockchainAddress: string;
}

export interface MileageBlockchainRecord {
  vehicleId: string;
  vin: string;
  mileage: number;
  previousMileage: number;
  recordedBy: string;
  timestamp: Date;
  source: 'owner' | 'service' | 'inspection' | 'automated';
  transactionHash: string;
  blockNumber: number;
}

export class SolanaService {
  private connection: Connection;
  private programId: PublicKey;
  private isDevnet: boolean;

  constructor() {
    // Use Devnet for free development
    this.isDevnet = process.env.NODE_ENV !== 'production';
    
    // Use multiple RPC endpoints for better reliability
    const rpcUrls = this.isDevnet 
      ? [
          'https://api.devnet.solana.com',
          'https://devnet.helius-rpc.com',
          'https://rpc-devnet.helius.xyz'
        ]
      : [
          process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
          'https://rpc.ankr.com/solana',
          'https://solana-api.projectserum.com'
        ];
    
    // Use the first RPC URL, with fallback capability
    const rpcUrl = rpcUrls[0];
    this.connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
      disableRetryOnRateLimit: false
    });
    
    // For now, use a placeholder program ID (we'll create the actual program later)
    this.programId = new PublicKey('11111111111111111111111111111111');
    
    logger.info(`🔗 Solana Service initialized - ${this.isDevnet ? 'DEVNET' : 'MAINNET'}`);
    
    // Test the connection
    this.testConnection();
  }

  /**
   * Test the Solana RPC connection
   */
  private async testConnection(): Promise<void> {
    try {
      const version = await this.connection.getVersion();
      const slot = await this.connection.getSlot();
      logger.info(`✅ Solana RPC connected - Version: ${version['solana-core']}, Slot: ${slot}`);
    } catch (error) {
      logger.error('❌ Failed to connect to Solana RPC:', error);
      logger.warn('⚠️ Some blockchain features may not work properly');
    }
  }

  /**
   * Generate a new wallet for a user (custodial)
   */
  async generateWallet(userId: string): Promise<SolanaWallet> {
    try {
      const keypair = Keypair.generate();
      
      const wallet: SolanaWallet = {
        publicKey: keypair.publicKey.toString(),
        secretKey: keypair.secretKey,
        balance: 0
      };

      // In devnet, we can request airdrop for testing
      if (this.isDevnet) {
        try {
          const airdropSignature = await this.connection.requestAirdrop(
            keypair.publicKey,
            0.1 * LAMPORTS_PER_SOL // 0.1 SOL for testing
          );
          await this.connection.confirmTransaction(airdropSignature);
          wallet.balance = 0.1;
          logger.info(`💰 Airdropped 0.1 SOL to wallet ${wallet.publicKey}`);
        } catch (airdropError) {
          logger.warn(`⚠️ Airdrop failed for ${wallet.publicKey}:`, airdropError);
        }
      }

      logger.info(`🔑 Generated new Solana wallet for user ${userId}: ${wallet.publicKey}`);
      return wallet;
    } catch (error) {
      logger.error('❌ Failed to generate Solana wallet:', error);
      throw new Error(`Failed to generate wallet: ${error.message}`);
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(publicKey: string): Promise<number> {
    try {
      const pubKey = new PublicKey(publicKey);
      const balance = await this.connection.getBalance(pubKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      logger.error(`❌ Failed to get balance for ${publicKey}:`, error);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Register a vehicle on the blockchain
   */
  async registerVehicle(
    vehicleId: string,
    vin: string,
    initialMileage: number,
    ownerWallet: SolanaWallet
  ): Promise<VehicleBlockchainRecord> {
    try {
      const ownerKeypair = Keypair.fromSecretKey(ownerWallet.secretKey);
      
      // Create a simple data storage transaction
      // In a real implementation, this would interact with a custom program
      const vehicleData = {
        vehicleId,
        vin,
        mileage: initialMileage,
        timestamp: Date.now(),
        action: 'REGISTER_VEHICLE'
      };

      // For now, we'll create a memo transaction to store the data
      const transaction = new Transaction();
      
      // Add memo instruction with vehicle data
      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'), // Memo program
        data: Buffer.from(JSON.stringify(vehicleData))
      });
      
      transaction.add(memoInstruction);

      // Send transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [ownerKeypair]
      );

      const record: VehicleBlockchainRecord = {
        vehicleId,
        vin,
        currentMileage: initialMileage,
        lastUpdate: new Date(),
        transactionHash: signature,
        blockchainAddress: ownerKeypair.publicKey.toString()
      };

      logger.info(`✅ Vehicle registered on blockchain: ${vin} - TX: ${signature}`);
      return record;
    } catch (error) {
      logger.error(`❌ Failed to register vehicle ${vin} on blockchain:`, error);
      throw new Error(`Blockchain registration failed: ${error.message}`);
    }
  }

  /**
   * Record mileage update on blockchain
   */
  async recordMileage(
    vehicleId: string,
    vin: string,
    newMileage: number,
    previousMileage: number,
    recordedBy: string,
    source: 'owner' | 'service' | 'inspection' | 'automated',
    ownerWallet: SolanaWallet
  ): Promise<MileageBlockchainRecord> {
    try {
      const ownerKeypair = Keypair.fromSecretKey(ownerWallet.secretKey);
      
      // Validate mileage (basic fraud detection)
      if (newMileage < previousMileage) {
        logger.warn(`🚨 FRAUD ALERT: Mileage rollback detected for ${vin}: ${previousMileage} -> ${newMileage}`);
      }

      const mileageData = {
        vehicleId,
        vin,
        mileage: newMileage,
        previousMileage,
        recordedBy,
        source,
        timestamp: Date.now(),
        action: 'UPDATE_MILEAGE',
        fraudCheck: newMileage >= previousMileage ? 'PASS' : 'FAIL_ROLLBACK'
      };

      const transaction = new Transaction();
      
      // Add memo instruction with mileage data
      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        data: Buffer.from(JSON.stringify(mileageData))
      });
      
      transaction.add(memoInstruction);

      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [ownerKeypair]
      );

      // Get block number for the transaction
      const latestBlockhash = await this.connection.getLatestBlockhash();
      
      const record: MileageBlockchainRecord = {
        vehicleId,
        vin,
        mileage: newMileage,
        previousMileage,
        recordedBy,
        timestamp: new Date(),
        source,
        transactionHash: signature,
        blockNumber: latestBlockhash.lastValidBlockHeight
      };

      logger.info(`✅ Mileage recorded on blockchain: ${vin} ${previousMileage}->${newMileage} - TX: ${signature}`);
      return record;
    } catch (error) {
      logger.error(`❌ Failed to record mileage for ${vin}:`, error);
      throw new Error(`Mileage recording failed: ${error.message}`);
    }
  }

  /**
   * Get transaction details from blockchain
   */
  async getTransaction(signature: string): Promise<any> {
    try {
      const transaction = await this.connection.getTransaction(signature);
      return transaction;
    } catch (error) {
      logger.error(`❌ Failed to get transaction ${signature}:`, error);
      throw new Error(`Transaction lookup failed: ${error.message}`);
    }
  }

  /**
   * Verify a blockchain record
   */
  async verifyRecord(transactionHash: string): Promise<boolean> {
    try {
      const transaction = await this.getTransaction(transactionHash);
      return transaction !== null;
    } catch (error) {
      logger.error(`❌ Failed to verify record ${transactionHash}:`, error);
      return false;
    }
  }

  /**
   * Get all transactions for a vehicle
   */
  async getVehicleHistory(vehicleId: string, limit: number = 50): Promise<any[]> {
    try {
      // In a real implementation, we'd query our custom program accounts
      // For now, this is a placeholder that would need custom indexing
      logger.info(`📋 Getting blockchain history for vehicle ${vehicleId}`);
      return [];
    } catch (error) {
      logger.error(`❌ Failed to get vehicle history for ${vehicleId}:`, error);
      throw new Error(`History lookup failed: ${error.message}`);
    }
  }

  /**
   * Detect potential fraud patterns
   */
  async detectFraud(vehicleId: string, newMileage: number, previousMileage: number): Promise<{
    isFraud: boolean;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let isFraud = false;

    // Check for mileage rollback
    if (newMileage < previousMileage) {
      reasons.push('Mileage rollback detected');
      riskLevel = 'HIGH';
      isFraud = true;
    }

    // Check for unrealistic mileage jump
    const mileageDiff = newMileage - previousMileage;
    if (mileageDiff > 10000) { // More than 10k miles increase
      reasons.push('Unrealistic mileage increase');
      riskLevel = riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM';
    }

    // Check for zero mileage (suspicious)
    if (newMileage === 0 && previousMileage > 0) {
      reasons.push('Mileage reset to zero');
      riskLevel = 'HIGH';
      isFraud = true;
    }

    logger.info(`🔍 Fraud detection for vehicle ${vehicleId}: ${isFraud ? 'FRAUD' : 'CLEAN'} - Risk: ${riskLevel}`);
    
    return { isFraud, riskLevel, reasons };
  }

  /**
   * Get network status
   */
  async getNetworkStatus(): Promise<{
    network: string;
    blockHeight: number;
    isHealthy: boolean;
  }> {
    try {
      const blockHeight = await this.connection.getBlockHeight();
      return {
        network: this.isDevnet ? 'devnet' : 'mainnet',
        blockHeight,
        isHealthy: true
      };
    } catch (error) {
      logger.error('❌ Failed to get network status:', error);
      return {
        network: this.isDevnet ? 'devnet' : 'mainnet',
        blockHeight: 0,
        isHealthy: false
      };
    }
  }
}

// Export singleton instance
// Lazy initialization to prevent startup issues
let _solanaService: SolanaService | null = null;

export const getSolanaService = (): SolanaService => {
  if (!_solanaService) {
    _solanaService = new SolanaService();
  }
  return _solanaService;
};

// For backward compatibility
export const solanaService = {
  get instance() {
    return getSolanaService();
  }
};
