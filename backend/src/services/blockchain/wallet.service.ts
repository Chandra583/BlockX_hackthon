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
   * Legacy EVP_BytesToKey implementation (MD5-based key derivation)
   * Replicates what createCipher/createDecipher did internally
   */
  private evpBytesToKey(password: string, keyLen: number, ivLen: number): { key: Buffer; iv: Buffer } {
    const md5Hashes: Buffer[] = [];
    let digest = Buffer.alloc(0);
    let data = Buffer.from(password, 'utf8');

    while (Buffer.concat(md5Hashes).length < keyLen + ivLen) {
      const hash = crypto.createHash('md5');
      hash.update(digest);
      hash.update(data);
      digest = hash.digest();
      md5Hashes.push(digest);
    }

    const keyIv = Buffer.concat(md5Hashes);
    return {
      key: keyIv.slice(0, keyLen),
      iv: keyIv.slice(keyLen, keyLen + ivLen)
    };
  }

  /**
   * Decrypt sensitive data (with IV)
   */
  private decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);

    // Log encrypted text info for debugging
    logger.info(`🔍 Decryption attempt - Length: ${encryptedText.length}, Has colon: ${encryptedText.includes(':')}`);

    try {
      // New format: ivHex:cipherHex
      const parts = encryptedText.split(':');
      if (parts.length === 2) {
        const iv = Buffer.from(parts[0], 'hex');
        const cipherHex = parts[1];
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        logger.info(`✅ New format decryption successful`);
        return decrypted;
      }

      // Fall through to legacy if format is different
      throw new Error('New format decrypt failed, trying legacy');
    } catch (err: any) {
      logger.info(`⚠️ New format failed: ${err.message}, trying legacy methods`);
      
      // Legacy fallback: try multiple strategies
      const strategies = [
        { name: 'hex + EVP_BytesToKey', encoding: 'hex' as BufferEncoding },
        { name: 'base64 + EVP_BytesToKey', encoding: 'base64' as BufferEncoding },
        { name: 'hex + createDecipher', encoding: 'hex' as BufferEncoding, useNative: true },
        { name: 'base64 + createDecipher', encoding: 'base64' as BufferEncoding, useNative: true },
      ];

      for (const strategy of strategies) {
        try {
          logger.info(`🔄 Trying strategy: ${strategy.name}`);
          
          let encryptedBuffer: Buffer;
          try {
            encryptedBuffer = Buffer.from(encryptedText, strategy.encoding);
          } catch (bufferErr) {
            logger.info(`⚠️ Buffer conversion failed for ${strategy.encoding}`);
            continue;
          }

          // Try native createDecipher if requested and available
          if (strategy.useNative && typeof (crypto as any).createDecipher === 'function') {
            const decipherLegacy = (crypto as any).createDecipher(algorithm, this.encryptionKey);
            decipherLegacy.setAutoPadding(true);
            let decrypted = decipherLegacy.update(encryptedBuffer);
            decrypted = Buffer.concat([decrypted, decipherLegacy.final()]);
            logger.info(`✅ Decryption successful with ${strategy.name}`);
            return decrypted.toString('utf8');
          }
          
          // Try EVP_BytesToKey method
          if (!strategy.useNative) {
            const derived = this.evpBytesToKey(this.encryptionKey, 32, 16);
            const decipher = crypto.createDecipheriv(algorithm, derived.key, derived.iv);
            decipher.setAutoPadding(true);
            let decrypted = decipher.update(encryptedBuffer);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            logger.info(`✅ Decryption successful with ${strategy.name}`);
            return decrypted.toString('utf8');
          }
        } catch (strategyErr: any) {
          logger.info(`⚠️ Strategy ${strategy.name} failed: ${strategyErr.message}`);
          continue;
        }
      }

      // All strategies failed
      logger.error(`❌ All decryption strategies failed for encrypted text length ${encryptedText.length}`);
      throw new Error(
        `Unable to decrypt wallet data. The encryption format may be incompatible. ` +
        `Please contact support to recover your wallet.`
      );
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
   * Migrate wallet from legacy encryption to new IV-based encryption
   */
  async migrateWalletEncryption(userId: string): Promise<{
    success: boolean;
    message: string;
    migrated: boolean;
    walletAddress?: string;
  }> {
    try {
      logger.info(`🔄 Starting wallet encryption migration for user ${userId}`);

      // Get user with encrypted wallet data
      const user = await User.findById(userId).select('+blockchainWallet.encryptedPrivateKey');

      if (!user || !user.blockchainWallet || !user.blockchainWallet.encryptedPrivateKey) {
        return {
          success: false,
          message: 'No wallet found to migrate',
          migrated: false,
        };
      }

      const oldEncrypted = user.blockchainWallet.encryptedPrivateKey;

      // Check if already in new format (has IV separator)
      if (oldEncrypted.includes(':')) {
        return {
          success: true,
          message: 'Wallet is already using the new encryption format',
          migrated: false,
          walletAddress: user.blockchainWallet.walletAddress,
        };
      }

      // Decrypt with legacy method (will use EVP_BytesToKey fallback)
      const wallet = await this.getUserWallet(userId);

      if (!wallet) {
        return {
          success: false,
          message: 'Failed to decrypt wallet with legacy method',
          migrated: false,
        };
      }

      logger.info(`✅ Successfully decrypted legacy wallet for user ${userId}`);

      // Re-encrypt with new format
      const privateKeyBase64 = Buffer.from(wallet.secretKey).toString('base64');
      const newEncrypted = this.encrypt(privateKeyBase64);

      // Update the user's wallet with new encrypted format
      user.blockchainWallet.encryptedPrivateKey = newEncrypted;
      user.blockchainWallet.lastUsed = new Date();
      await user.save();

      logger.info(`✅ Wallet encryption migration completed for user ${userId}`);

      return {
        success: true,
        message: 'Wallet successfully migrated to new encryption format',
        migrated: true,
        walletAddress: wallet.publicKey,
      };

    } catch (error: any) {
      logger.error(`❌ Wallet migration failed for user ${userId}:`, error);
      return {
        success: false,
        message: `Wallet migration failed: ${error.message}`,
        migrated: false,
      };
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
