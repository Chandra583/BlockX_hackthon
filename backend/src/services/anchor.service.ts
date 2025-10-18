import crypto from 'crypto';
import { getArweaveService } from './blockchain/arweave.service';
import { getSolanaService } from './blockchain/solana.service';
import { logger } from '../utils/logger';
import { IInstall } from '../models/Install.model';
import { IVehicleDocument } from '../models/core/Vehicle.model';
import { config } from '../config/environment';

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
  async anchorInstallEvent(install: IInstall, vehicle: IVehicleDocument, ownerData?: any, serviceProviderData?: any, ownerWallet?: any): Promise<AnchorResult> {
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

      // Create payload for anchoring with enriched data from API response
      logger.info('🔍 Creating Solana payload with data:');
      logger.info('   Owner Data:', ownerData);
      logger.info('   Service Provider Data:', serviceProviderData);
      logger.info('   Vehicle Data:', vehicle);
      
      const payload = {
        installId: install._id ? install._id.toString() : '',
        vehicleId: install.vehicleId.toString(),
        vin: vehicle.vin,
        vehicleNumber: vehicle.vehicleNumber,
        vehicleMake: vehicle.make,
        vehicleModel: vehicle.vehicleModel,
        vehicleYear: vehicle.year,
        ownerId: install.ownerId.toString(),
        ownerName: ownerData ? `${ownerData.firstName} ${ownerData.lastName}` : 'Unknown Owner',
        ownerEmail: ownerData?.email || 'Unknown Email',
        serviceProviderId: install.serviceProviderId?.toString(),
        serviceProviderName: serviceProviderData ? `${serviceProviderData.firstName} ${serviceProviderData.lastName}` : 'Unknown Service Provider',
        serviceProviderEmail: serviceProviderData?.email || 'Unknown Email',
        deviceId: install.deviceId,
        deviceDetails: {
          deviceId: install.deviceId,
          deviceType: 'OBD-II',
          deviceStatus: 'installing',
          deviceSerial: install.deviceId
        },
        initialMileage: install.initialMileage,
        previousMileage: vehicle.lastVerifiedMileage || 0,
        mileageDelta: install.initialMileage - (vehicle.lastVerifiedMileage || 0),
        timestamp: new Date().toISOString(),
        eventType: 'INSTALL_START',
        transactionDetails: {
          initiatedBy: 'owner',
          ownerWallet: ownerWallet?.publicKey || 'owner_wallet'
        },
        blockchainData: {
          solanaNetwork: config.SOLANA_CLUSTER || 'devnet',
          transactionType: 'installation_start',
          dataIntegrity: 'verified',
          signer: 'owner' // Using owner's wallet for signing
        }
      };

      logger.info('📦 Complete Solana payload created:', JSON.stringify(payload, null, 2));

      // Upload to Arweave (optional)
      let arweaveTx: string | undefined;
      if (config.ARWEAVE_ENABLED) {
        const arweaveResult = await this.uploadToArweave(payload);
        if (!arweaveResult.success) {
          // If Arweave fails and it's optional, continue with Solana only
          logger.warn(`Arweave disabled or failed, proceeding with Solana only: ${arweaveResult.message}`);
        } else {
          arweaveTx = arweaveResult.arweaveTx;
        }
      }

      // Create deterministic hash for Solana
      const hash = this.createDeterministicHash(payload);
      
      // Anchor to Solana using owner's wallet
      const solanaResult = await this.anchorToSolana(hash, payload, ownerWallet);
      if (!solanaResult.success) {
        return solanaResult;
      }

      // Return success result
      return {
        success: true,
        solanaTx: solanaResult.solanaTx,
        arweaveTx,
        message: arweaveTx ? 'Anchored to Solana and Arweave' : 'Anchored to Solana'
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
  private async anchorToSolana(hash: string, payload: any, ownerWallet: any): Promise<AnchorResult> {
    try {
      // Use owner's wallet for transaction signing
      const solanaData = {
        hash,
        payload,
        timestamp: Date.now(),
        action: 'ANCHOR_INSTALL',
        signer: 'owner',
        ownerWallet: payload.transactionDetails?.ownerWallet || 'owner_wallet',
        visibility: {
          ownerId: payload.ownerId,
          ownerName: payload.ownerName,
          serviceProviderId: payload.serviceProviderId,
          serviceProviderName: payload.serviceProviderName,
          vehicleId: payload.vehicleId,
          vin: payload.vin,
          vehicleNumber: payload.vehicleNumber,
          deviceId: payload.deviceId,
          initialMileage: payload.initialMileage
        }
      };

      // Use Solana service to send real transaction with owner's wallet
      try {
        logger.info('🔑 Using owner wallet for Solana transaction signing');
        logger.info('🔑 Owner wallet address:', ownerWallet.publicKey);
        logger.info('🔑 Owner wallet secret key length:', ownerWallet.secretKey.length);

        const solanaResult = await this.solanaService.recordInstallation(
          solanaData,
          ownerWallet
        );
        
        logger.info(`✅ Real Solana transaction sent: ${solanaResult.transactionHash}`);
        logger.info(`📋 Payload sent to Solana:`, JSON.stringify(solanaData, null, 2));
        
        return {
          success: true,
          solanaTx: solanaResult.transactionHash,
          message: 'Successfully anchored to Solana blockchain'
        };
      } catch (solanaError) {
        logger.error('❌ Real Solana transaction failed:', solanaError);
        
        // Don't fallback to mock - return error
        return {
          success: false,
          message: `Solana transaction failed: ${solanaError.message}`
        };
      }
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