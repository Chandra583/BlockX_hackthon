/**
 * Wallet Migration Routes
 * Endpoints to migrate legacy wallet encryption to new format
 */

import { Router } from 'express';
import { getWalletService } from '../../services/blockchain/wallet.service';
import { User } from '../../models/core/User.model';
import logger from '../../utils/logger';

const router = Router();

/**
 * @route   POST /api/blockchain/wallet/migrate
 * @desc    Re-encrypt user wallet with new secure format (IV-based)
 * @access  Private (requires authentication)
 */
router.post('/migrate', async (req, res) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Get wallet service and perform migration
    const walletService = getWalletService();
    const result = await walletService.migrateWalletEncryption(userId);

    if (!result.success) {
      return res.status(result.migrated === false && result.message.includes('not found') ? 404 : 500).json(result);
    }

    return res.status(200).json(result);

  } catch (error: any) {
    logger.error(`❌ Wallet migration request failed:`, error);
    return res.status(500).json({
      success: false,
      message: 'Wallet migration request failed',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/blockchain/wallet/encryption-status
 * @desc    Check if wallet is using legacy or new encryption format
 * @access  Private (requires authentication)
 */
router.get('/encryption-status', async (req, res) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Get user with encrypted wallet data
    const user = await User.findById(userId).select('+blockchainWallet.encryptedPrivateKey');

    if (!user || !user.blockchainWallet || !user.blockchainWallet.encryptedPrivateKey) {
      return res.status(404).json({
        success: false,
        message: 'No wallet found',
      });
    }

    const encryptedData = user.blockchainWallet.encryptedPrivateKey;
    const isNewFormat = encryptedData.includes(':');

    return res.status(200).json({
      success: true,
      walletAddress: user.blockchainWallet.walletAddress,
      encryptionFormat: isNewFormat ? 'new (IV-based, secure)' : 'legacy (MD5-based, insecure)',
      needsMigration: !isNewFormat,
    });

  } catch (error: any) {
    logger.error(`❌ Encryption status check failed:`, error);
    return res.status(500).json({
      success: false,
      message: 'Status check failed',
      error: error.message,
    });
  }
});

export default router;

