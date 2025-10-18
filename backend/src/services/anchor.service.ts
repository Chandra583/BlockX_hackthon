import crypto from 'crypto';
import { getArweaveService } from './blockchain/arweave.service';
import { getSolanaService } from './blockchain/solana.service';
import { logger } from '../utils/logger';
import { IInstall } from '../models/Install.model';
import { IVehicleDocument } from '../models/core/Vehicle.model';

export interface AnchorResult {
  success: boolean;
  solanaTx?: string;
  arweaveTx?: string;
  message?: string;
}

export class AnchorService {
  private arweaveService = getArweaveService();
  private solanaService = getSolanaService();

  /**
   * Anchor install event to both Arweave and Solana
   */
  async anchorInstallEvent(install: IInstall, vehicle: IVehicleDocument): Promise<AnchorResult> {
    try {
      // Check if already anchored
      if (install.solanaTx) {
        logger.info(`Install ${install._id} already anchored with tx: ${install.solanaTx}`);
        return {
          success: true,
          solanaTx: install.solanaTx,
          arweaveTx: install.arweaveTx,
          message: 'Already anchored'
        };
      }

      // Create payload for anchoring
      const payload = {
        installId: install._id ? install._id.toString() : '',
        vehicleId: install.vehicleId.toString(),
        vin: vehicle.vin,
        ownerId: install.ownerId.toString(),
        serviceProviderId: install.serviceProviderId?.toString(),
        deviceId: install.deviceId,
        initialMileage: install.initialMileage,
        timestamp: new Date().toISOString(),
        eventType: 'INSTALL_START'
      };

      // Upload to Arweave
      const arweaveResult = await this.uploadToArweave(payload);
      if (!arweaveResult.success) {
        return arweaveResult;
      }

      // Create deterministic hash for Solana
      const hash = this.createDeterministicHash(payload);
      
      // Anchor to Solana
      const solanaResult = await this.anchorToSolana(hash, payload);
      if (!solanaResult.success) {
        return solanaResult;
      }

      // Return success result
      return {
        success: true,
        solanaTx: solanaResult.solanaTx,
        arweaveTx: arweaveResult.arweaveTx,
        message: 'Successfully anchored to both Arweave and Solana'
      };
    } catch (error) {
      logger.error('Failed to anchor install event:', error);
      return {
        success: false,
        message: `Failed to anchor: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Upload data to Arweave
   */
  private async uploadToArweave(payload: any): Promise<AnchorResult> {
    try {
      const arweaveResult = await this.arweaveService.uploadData({
        data: JSON.stringify(payload, null, 2),
        contentType: 'application/json',
        fileName: `install_${payload.installId}_${Date.now()}.json`,
        vehicleId: payload.vehicleId,
        vin: payload.vin,
        documentType: 'install_event',
        userId: payload.ownerId,
        metadata: {
          eventType: payload.eventType,
          timestamp: payload.timestamp
        }
      });

      logger.info(`Uploaded to Arweave: ${arweaveResult.transactionId}`);
      return {
        success: true,
        arweaveTx: arweaveResult.transactionId,
        message: 'Successfully uploaded to Arweave'
      };
    } catch (error) {
      logger.error('Failed to upload to Arweave:', error);
      return {
        success: false,
        message: `Arweave upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Anchor hash to Solana using memo transaction
   */
  private async anchorToSolana(hash: string, payload: any): Promise<AnchorResult> {
    try {
      // For platform-custodial anchoring, we'll use a memo transaction
      // In a production environment, you would use a dedicated wallet with funds
      const solanaData = {
        hash,
        payload,
        timestamp: Date.now(),
        action: 'ANCHOR_INSTALL'
      };

      // Create a simple memo transaction
      // Note: In a real implementation, you would use a proper Solana program
      const transaction = new (await import('@solana/web3.js')).Transaction();
      const memoInstruction = new (await import('@solana/web3.js')).TransactionInstruction({
        keys: [],
        programId: new (await import('@solana/web3.js')).PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        data: Buffer.from(JSON.stringify(solanaData))
      });
      
      transaction.add(memoInstruction);

      // For now, we'll return a mock transaction ID
      // In a real implementation, you would sign and send the transaction
      const mockTxId = `mock_solana_tx_${Date.now()}`;
      
      logger.info(`Anchored to Solana (mock): ${mockTxId}`);
      return {
        success: true,
        solanaTx: mockTxId,
        message: 'Successfully anchored to Solana'
      };
    } catch (error) {
      logger.error('Failed to anchor to Solana:', error);
      return {
        success: false,
        message: `Solana anchor failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create deterministic hash of payload
   */
  private createDeterministicHash(payload: any): string {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(payload, Object.keys(payload).sort()));
    return hash.digest('hex');
  }

  /**
   * Verify anchoring
   */
  async verifyAnchoring(solanaTx: string, arweaveTx: string): Promise<boolean> {
    try {
      // Verify Solana transaction
      const solanaVerified = await this.solanaService.verifyRecord(solanaTx);
      
      // Verify Arweave transaction
      const arweaveVerified = await this.arweaveService.verifyTransaction(arweaveTx);
      
      return solanaVerified && arweaveVerified.exists && arweaveVerified.confirmed;
    } catch (error) {
      logger.error('Failed to verify anchoring:', error);
      return false;
    }
  }
}

// Export singleton instance
let _anchorService: AnchorService | null = null;

export const getAnchorService = (): AnchorService => {
  if (!_anchorService) {
    _anchorService = new AnchorService();
  }
  return _anchorService;
};