import { Types } from 'mongoose';
import crypto from 'crypto';
import { logger } from '../../utils/logger';
import { User } from '../../models/core/User.model';
import { getSolanaService, SolanaWallet } from './solana.service';

// Wallet storage interface (for database)
export interface UserWallet {
  userId: Types.ObjectId;
  walletAddress: string;
  encryptedPrivateKey: string; // Encrypted secret key
  blockchain: 'solana';
  balance: number;
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
}

export interface WalletCreationResult {
  walletAddress: string;
  balance: number;
  blockchain: string;
  transactionHash?: string;
}

export class WalletService {
  private readonly encryptionKey: string;

  constructor() {
    // Use environment variable for encryption key in production
    this.encryptionKey = process.env.WALLET_ENCRYPTION_KEY || 'your-very-secure-encryption-key-change-this';
    
    if (this.encryptionKey === 'your-very-secure-encryption-key-change-this') {
      logger.warn('⚠️ Using default encryption key. Set WALLET_ENCRYPTION_KEY in production!');
    }
  }

  /**
   * Encrypt sensitive data using AES-256-CBC (simpler and more reliable)
   */
  private encrypt(text: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const textParts = encryptedText.split(':');
    
    if (textParts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(textParts[0], 'hex');
    const encrypted = textParts[1];
    const decipher = crypto.createDecipher(algorithm, key);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Create a new custodial wallet for a user
   */
  async createWallet(userId: string): Promise<WalletCreationResult> {
    try {
      logger.info(`🔑 Creating new wallet for user ${userId}`);

      // Generate Solana wallet
      const solanaWallet = await getSolanaService().generateWallet(userId);
      
      // Encrypt the private key for secure storage
      const encryptedPrivateKey = this.encrypt(
        Buffer.from(solanaWallet.secretKey).toString('base64')
      );

      // Save wallet to user document
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.blockchainWallet = {
        walletAddress: solanaWallet.publicKey,
        encryptedPrivateKey,
        blockchain: 'solana',
        network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'devnet',
        balance: solanaWallet.balance,
        isActive: true,
        createdAt: new Date()
      };

      await user.save();

      logger.info(`✅ Wallet created successfully for user ${userId}: ${solanaWallet.publicKey}`);

      return {
        walletAddress: solanaWallet.publicKey,
        balance: solanaWallet.balance,
        blockchain: 'solana'
      };
    } catch (error) {
      logger.error(`❌ Failed to create wallet for user ${userId}:`, error);
      throw new Error(`Wallet creation failed: ${error.message}`);
    }
  }

  /**
   * Get user's wallet (decrypt private key for use)
   */
  async getUserWallet(userId: string): Promise<SolanaWallet | null> {
    try {
      logger.info(`🔍 Looking up wallet for user ${userId}`);
      
      // Get user with wallet data (including encrypted private key)
      const user = await User.findById(userId).select('+blockchainWallet.encryptedPrivateKey');
      if (!user || !user.blockchainWallet || !user.blockchainWallet.isActive) {
        logger.info(`❌ No active wallet found for user ${userId}`);
        return null;
      }

      const wallet = user.blockchainWallet;
      
      // Decrypt the private key
      const decryptedPrivateKey = this.decrypt(wallet.encryptedPrivateKey);
      const secretKey = new Uint8Array(Buffer.from(decryptedPrivateKey, 'base64'));
      
      // Get current balance from blockchain
      const solanaService = getSolanaService();
      const currentBalance = await solanaService.getBalance(wallet.walletAddress);
      
      logger.info(`✅ Wallet found for user ${userId}: ${wallet.walletAddress}`);
      
      return {
        publicKey: wallet.walletAddress,
        secretKey,
        balance: currentBalance
      };
    } catch (error) {
      logger.error(`❌ Failed to get wallet for user ${userId}:`, error);
      throw new Error(`Wallet lookup failed: ${error.message}`);
    }
  }

  /**
   * Check if user has a wallet
   */
  async hasWallet(userId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      return !!(user && user.blockchainWallet && user.blockchainWallet.isActive);
    } catch (error) {
      logger.error(`❌ Failed to check wallet for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Update wallet balance
   */
  async updateBalance(userId: string, newBalance: number): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user || !user.blockchainWallet) {
        throw new Error('User wallet not found');
      }

      user.blockchainWallet.balance = newBalance;
      user.blockchainWallet.lastUsed = new Date();
      await user.save();
      
      logger.info(`💰 Updated balance for user ${userId}: ${newBalance} SOL`);
    } catch (error) {
      logger.error(`❌ Failed to update balance for user ${userId}:`, error);
      throw new Error(`Balance update failed: ${error.message}`);
    }
  }

  /**
   * Get wallet balance from blockchain
   */
  async getWalletBalance(walletAddress: string): Promise<number> {
    try {
      const balance = await getSolanaService().getBalance(walletAddress);
      return balance;
    } catch (error) {
      logger.error(`❌ Failed to get balance for wallet ${walletAddress}:`, error);
      throw new Error(`Balance lookup failed: ${error.message}`);
    }
  }


  /**
   * Deactivate wallet (soft delete)
   */
  async deactivateWallet(userId: string): Promise<void> {
    try {
      // TODO: Update database
      // await UserWalletModel.updateOne(
      //   { userId, isActive: true },
      //   { isActive: false }
      // );
      
      logger.info(`🔒 Deactivated wallet for user ${userId}`);
    } catch (error) {
      logger.error(`❌ Failed to deactivate wallet for user ${userId}:`, error);
      throw new Error(`Wallet deactivation failed: ${error.message}`);
    }
  }

  /**
   * Get wallet statistics
   */
  async getWalletStats(): Promise<{
    totalWallets: number;
    activeWallets: number;
    totalBalance: number;
    averageBalance: number;
  }> {
    try {
      // TODO: Get from database
      // const stats = await UserWalletModel.aggregate([...]);
      
      return {
        totalWallets: 0,
        activeWallets: 0,
        totalBalance: 0,
        averageBalance: 0
      };
    } catch (error) {
      logger.error('❌ Failed to get wallet statistics:', error);
      throw new Error(`Statistics lookup failed: ${error.message}`);
    }
  }
}

// Export singleton instance
export const walletService = new WalletService();
