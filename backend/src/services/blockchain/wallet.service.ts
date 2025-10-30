import { Types } from 'mongoose';
import * as crypto from 'crypto';
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
   * Encrypt sensitive data using AES-256-CBC (with IV)
   */
  private encrypt(text: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data (with IV)
   */
  private decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);

    try {
      // New format: ivHex:cipherHex
      const parts = encryptedText.split(':');
      if (parts.length === 2) {
        const iv = Buffer.from(parts[0], 'hex');
        const cipherHex = parts[1];
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      }

      // Fall through to legacy if format is different
      throw new Error('Unsupported format');
    } catch (err) {
      // Legacy fallback: stored without IV using createCipher/createDecipher
      try {
        const decipherLegacy = (crypto as any).createDecipher?.(algorithm, key);
        if (!decipherLegacy) throw err;
        let decrypted = decipherLegacy.update(encryptedText, 'hex', 'utf8');
        decrypted += decipherLegacy.final('utf8');
        return decrypted;
      } catch (legacyErr) {
        throw legacyErr;
      }
    }
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
      logger.info(`🔍 User found: ${!!user}, has blockchainWallet: ${!!user?.blockchainWallet}`);
      
      if (!user) {
        logger.info(`❌ User not found: ${userId}`);
        return null;
      }
      
      if (!user.blockchainWallet) {
        logger.info(`❌ No blockchain wallet found for user ${userId}`);
        return null;
      }
      
      if (!user.blockchainWallet.isActive) {
        logger.info(`❌ Wallet is not active for user ${userId}`);
        return null;
      }

      const wallet = user.blockchainWallet;
      logger.info(`🔍 Wallet details: address=${wallet.walletAddress}, hasEncryptedKey=${!!wallet.encryptedPrivateKey}`);
      
      if (!wallet.encryptedPrivateKey) {
        logger.error(`❌ No encrypted private key found for user ${userId}`);
        return null;
      }
      
      // Decrypt the private key
      const decryptedPrivateKey = this.decrypt(wallet.encryptedPrivateKey);
      const secretKey = new Uint8Array(Buffer.from(decryptedPrivateKey, 'base64'));
      
      // Get current balance from blockchain
      const solanaService = getSolanaService();
      const currentBalance = await solanaService.getBalance(wallet.walletAddress);
      
      logger.info(`✅ Wallet found for user ${userId}: ${wallet.walletAddress} (Balance: ${currentBalance})`);
      
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
   * Get user's wallet address only (without private key)
   */
  async getUserWalletAddress(userId: string): Promise<string | null> {
    try {
      logger.info(`🔍 Looking up wallet address for user ${userId}`);
      
      const user = await User.findById(userId).select('blockchainWallet');
      if (!user || !user.blockchainWallet || !user.blockchainWallet.isActive) {
        logger.info(`❌ No active wallet found for user ${userId}`);
        return null;
      }

      logger.info(`✅ Wallet address found for user ${userId}: ${user.blockchainWallet.walletAddress}`);
      return user.blockchainWallet.walletAddress;
    } catch (error) {
      logger.error(`❌ Failed to get wallet address for user ${userId}:`, error);
      return null;
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
