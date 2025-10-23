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
  vehicleNumber: string;
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
      logger.info(`✅ Solana RPC connected - Version: ${version['solana-core']}, Slot: ${slot}, Network: ${this.isDevnet ? 'devnet' : 'mainnet'}`);
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
    vehicleNumber: string,
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
        vehicleNumber,
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
        vehicleNumber,
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
   * Record installation event on blockchain
   */
  async recordInstallation(
    installationData: any,
    signerWallet: SolanaWallet
  ): Promise<any> {
    try {
      const signerKeypair = Keypair.fromSecretKey(signerWallet.secretKey);
      
      // Build a buyer-trust focused payload (full fields) and auto-fallback to compact if oversize
      const verboseInstallData = {
        type: 'INSTALLATION_STARTED',
        network: this.isDevnet ? 'devnet' : 'mainnet',
        vehicleId: (installationData.vehicleId?.toString() || 'unknown').slice(-12), // Keep some length for trust
        vin: (installationData.vin || 'unknown').slice(-12), // Keep some length for trust
        deviceId: (installationData.deviceId || 'unknown').slice(-8), // Truncate device ID
        initialMileage: installationData.mileage || installationData.initialMileage || 0,
        ownerId: (installationData.ownerId?.toString() || 'unknown').slice(-8), // Truncate but keep readable
        serviceId: (installationData.serviceProviderId?.toString() || 'unknown').slice(-8), // Truncate but keep readable
        timestamp: new Date().toISOString()
      };

      const compactInstallData = {
        t: 'INSTALL',
        n: this.isDevnet ? 'dev' : 'main',
        v: (installationData.vehicleId?.toString() || 'unknown').slice(-8),
        vin: (installationData.vin || 'unknown').slice(-8),
        d: (installationData.deviceId || 'unknown').slice(-8),
        m: installationData.mileage || installationData.initialMileage || 0,
        o: (installationData.ownerId?.toString() || 'unknown').slice(-8),
        s: (installationData.serviceProviderId?.toString() || 'unknown').slice(-8),
        ts: Math.floor(Date.now() / 1000)
      };

      // Choose payload that fits within memo size limit
      let installMemoPayload: any = verboseInstallData;
      const verboseSize = Buffer.byteLength(JSON.stringify(verboseInstallData));
      if (verboseSize > 1200) {
        installMemoPayload = compactInstallData;
        logger.warn(`🔻 Installation memo too large (${verboseSize} bytes). Falling back to compact payload.`);
      }

      logger.info(`📝 Installation memo payload:`, JSON.stringify(installMemoPayload, null, 2));

      const transaction = new Transaction();
      
      // Add memo instruction with selected payload
      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        data: Buffer.from(JSON.stringify(installMemoPayload))
      });
      
      transaction.add(memoInstruction);

      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [signerKeypair]
      );

      logger.info(`✅ Installation recorded on Solana: ${signature}`);
      return {
        transactionHash: signature,
        blockchainAddress: signerKeypair.publicKey.toString(),
        network: this.isDevnet ? 'devnet' : 'mainnet'
      };
    } catch (error) {
      logger.error(`❌ Failed to record installation on Solana:`, error);
      throw new Error(`Installation recording failed: ${error.message}`);
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

      // Debug logging to see what we're receiving
      logger.info(`🔍 Mileage update inputs: vehicleId=${vehicleId}, vin=${vin}, prevMileage=${previousMileage}, newMileage=${newMileage}, source=${source}, recordedBy=${recordedBy}`);

      // Build verbose buyer-trust payload, fallback to compact if oversize
      const verboseMileageData = {
        type: 'UPDATE_MILEAGE',
        network: this.isDevnet ? 'devnet' : 'mainnet',
        vehicleId: vehicleId.slice(-12), // Keep some length for trust but not too long
        vin: vin.slice(-12), // Keep some length for trust but not too long
        prevMileage: previousMileage,
        newMileage: newMileage,
        delta: Math.max(0, newMileage - previousMileage),
        source: source.charAt(0).toUpperCase(), // Single char but readable
        recordedBy: recordedBy ? recordedBy.slice(0, 8) : 'unknown', // Truncate but keep readable
        timestamp: new Date().toISOString(),
        fraudCheck: newMileage >= previousMileage ? 'PASS' : 'FAIL'
      };

      const compactData = {
        t: 'UM',
        n: this.isDevnet ? 'dev' : 'main',
        v: vehicleId.slice(-8),
        vin: vin.slice(-8),
        pm: previousMileage,
        m: newMileage,
        d: Math.max(0, newMileage - previousMileage),
        s: source.charAt(0),
        r: (recordedBy || '?').charAt(0),
        ts: Math.floor(Date.now() / 1000),
        f: newMileage >= previousMileage ? 'P' : 'F'
      };

      let mileageMemoPayload: any = verboseMileageData;
      const verboseMileageSize = Buffer.byteLength(JSON.stringify(verboseMileageData));
      if (verboseMileageSize > 1200) {
        mileageMemoPayload = compactData;
        logger.warn(`🔻 Mileage memo too large (${verboseMileageSize} bytes). Falling back to compact payload.`);
      } else {
        logger.info(`✅ Using verbose mileage payload (${verboseMileageSize} bytes)`);
      }

      logger.info(`📝 Final mileage memo payload:`, JSON.stringify(mileageMemoPayload, null, 2));

      const transaction = new Transaction();
      
      // Add memo instruction with selected payload
      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        data: Buffer.from(JSON.stringify(mileageMemoPayload))
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
   * Get all transactions for a wallet address from Solana blockchain
   */
  async getWalletTransactions(walletAddress: string, limit: number = 50): Promise<any[]> {
    try {
      // Validate wallet address format
      if (!walletAddress || walletAddress.length < 32) {
        throw new Error('Invalid wallet address format');
      }

      logger.info(`🔍 Creating PublicKey for wallet: ${walletAddress}`);
      const publicKey = new PublicKey(walletAddress);
      logger.info(`✅ PublicKey created successfully`);
      
      // Get confirmed signatures for the wallet
      const signatures = await this.connection.getSignaturesForAddress(publicKey, {
        limit: limit
      });

      // Get transaction details for each signature
      const transactions = await Promise.all(
        signatures.map(async (signatureInfo) => {
          try {
            const transaction = await this.connection.getTransaction(signatureInfo.signature, {
              commitment: 'confirmed',
              maxSupportedTransactionVersion: 0
            });

            if (!transaction) return null;

            // Extract memo data if it's a memo transaction
            let memoData = null;
            if (transaction.meta?.logMessages) {
              for (const log of transaction.meta.logMessages) {
                if (log.includes('Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke')) {
                  // This is a memo transaction, try to extract the data
                  try {
                    const memoLog = transaction.meta.logMessages.find(l => l.includes('Memo:'));
                    if (memoLog) {
                      const memoText = memoLog.split('Memo: ')[1];
                      memoData = JSON.parse(memoText);
                    }
                  } catch (e) {
                    // Ignore parsing errors
                  }
                  break;
                }
              }
            }

            return {
              signature: signatureInfo.signature,
              slot: signatureInfo.slot,
              blockTime: signatureInfo.blockTime,
              confirmationStatus: signatureInfo.confirmationStatus,
              err: signatureInfo.err,
              memo: signatureInfo.memo,
              memoData: memoData,
              fee: transaction.meta?.fee || 0,
              explorerUrl: `https://explorer.solana.com/tx/${signatureInfo.signature}${this.isDevnet ? '?cluster=devnet' : ''}`
            };
          } catch (error) {
            logger.warn(`Failed to get transaction details for ${signatureInfo.signature}:`, error);
            return {
              signature: signatureInfo.signature,
              slot: signatureInfo.slot,
              blockTime: signatureInfo.blockTime,
              confirmationStatus: signatureInfo.confirmationStatus,
              err: signatureInfo.err,
              memo: signatureInfo.memo,
              error: 'Failed to fetch transaction details',
              explorerUrl: `https://explorer.solana.com/tx/${signatureInfo.signature}${this.isDevnet ? '?cluster=devnet' : ''}`
            };
          }
        })
      );

      // Filter out null results and sort by block time (newest first)
      const validTransactions = transactions
        .filter(tx => tx !== null)
        .sort((a, b) => (b.blockTime || 0) - (a.blockTime || 0));

      logger.info(`📋 Retrieved ${validTransactions.length} transactions for wallet ${walletAddress}`);
      return validTransactions;
    } catch (error) {
      logger.error(`❌ Failed to get wallet transactions for ${walletAddress}:`, error);
      throw new Error(`Failed to fetch wallet transactions: ${error.message}`);
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
