import Arweave from 'arweave';
import { logger } from '../../utils/logger';
import crypto from 'crypto';

// Interfaces
export interface ArweaveDocument {
  id: string;
  url: string;
  size: number;
  contentType: string;
  tags: Array<{ name: string; value: string }>;
  timestamp: Date;
}

export interface ArweaveUploadOptions {
  data: Buffer | string;
  contentType: string;
  fileName: string;
  vehicleId?: string;
  vin?: string;
  documentType?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ArweaveUploadResult {
  transactionId: string;
  url: string;
  size: number; // In bytes
  cost: number; // In AR tokens
  permanent: boolean;
  explorerUrl: string;
}

export interface VehicleArweaveRecord {
  vehicleId: string;
  vin: string;
  documentType: 'title' | 'registration' | 'insurance' | 'inspection' | 'service' | 'accident' | 'mileage_history' | 'other';
  arweaveId: string;
  arweaveUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
  size: number;
  cost: number;
  isVerified: boolean;
}

export class ArweaveService {
  private arweave: Arweave;
  private wallet: any;
  private isTestnet: boolean;
  private gatewayHost: string;
  private gatewayProtocol: string;
  private gatewayPort: number;
  private gatewayBaseUrl: string;

  constructor() {
    // Initialize Arweave (mainnet by default, testnet for development)
    this.isTestnet = process.env.NODE_ENV !== 'production';

    // Allow override via env; otherwise choose sensible defaults
    this.gatewayHost = process.env.ARWEAVE_HOST || (this.isTestnet ? 'testnet.redstone.tools' : 'arweave.net');
    this.gatewayProtocol = process.env.ARWEAVE_PROTOCOL || 'https';
    this.gatewayPort = Number(process.env.ARWEAVE_PORT || 443);
    this.gatewayBaseUrl = `${this.gatewayProtocol}://${this.gatewayHost}${this.gatewayPort === 443 ? '' : `:${this.gatewayPort}`}`;

    this.arweave = Arweave.init({
      host: this.gatewayHost,
      port: this.gatewayPort,
      protocol: this.gatewayProtocol,
      timeout: 20000,
      logging: process.env.NODE_ENV === 'development'
    });

    // Keep initialization lightweight: don't perform network calls here
    // such as balance checks. Wallet is prepared lazily for operations.
    this.prepareWallet().catch((e) => {
      logger.warn('⚠️ Arweave wallet preparation deferred:', e?.message || e);
    });
    logger.info(`🌐 Arweave Service initialized - ${this.isTestnet ? 'TESTNET' : 'MAINNET'}`);
  }

  /**
   * Prepare an in-memory wallet if available. Avoids any network calls.
   */
  private async prepareWallet(): Promise<void> {
    try {
      if (process.env.ARWEAVE_WALLET_KEY) {
        this.wallet = JSON.parse(process.env.ARWEAVE_WALLET_KEY);
      } else if (this.isTestnet) {
        // Generating a wallet is purely local and does not hit network
        this.wallet = await this.arweave.wallets.generate();
        logger.info('🔑 Generated new Arweave testnet wallet');
      } else {
        logger.warn('⚠️ No Arweave wallet configured for production');
        this.wallet = null;
      }
      // IMPORTANT: Do NOT fetch balances here to keep startup non-blocking
    } catch (error) {
      logger.error('❌ Failed to prepare Arweave wallet:', error);
      this.wallet = null;
    }
  }

  /**
   * Get wallet balance (on-demand). Times out fast and returns null on failure.
   */
  async getBalance(address?: string): Promise<number> {
    try {
      const walletAddress = address || (this.wallet ? await this.arweave.wallets.jwkToAddress(this.wallet) : undefined);
      if (!walletAddress) return 0;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const winstonBalance = await this.arweave.wallets.getBalance(walletAddress);
        return parseFloat(this.arweave.ar.winstonToAr(winstonBalance));
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      logger.warn('⚠️ Arweave balance fetch failed:', error);
      return 0;
    }
  }

  /**
   * Estimate upload cost
   */
  async estimateCost(dataSize: number): Promise<number> {
    try {
      const price = await this.arweave.transactions.getPrice(dataSize);
      return parseFloat(this.arweave.ar.winstonToAr(price));
    } catch (error) {
      logger.warn('⚠️ Failed to estimate Arweave cost (using 0 AR fallback):', error);
      return 0;
    }
  }

  /**
   * Upload data to Arweave
   */
  async uploadData(options: ArweaveUploadOptions): Promise<ArweaveUploadResult> {
    try {
      if (!this.wallet) {
        throw new Error('Arweave wallet not configured');
      }

      const data = typeof options.data === 'string' ? Buffer.from(options.data) : options.data;
      const dataSize = data.length;

      // Estimate cost
      const estimatedCost = await this.estimateCost(dataSize);
      logger.info(`💰 Estimated Arweave upload cost: ${estimatedCost} AR for ${dataSize} bytes`);

      // Create transaction
      const transaction = await this.arweave.createTransaction({ data }, this.wallet);

      // Add tags for metadata
      transaction.addTag('Content-Type', options.contentType);
      transaction.addTag('File-Name', options.fileName);
      transaction.addTag('App-Name', 'VERIDRIVE');
      transaction.addTag('App-Version', '1.0.0');
      transaction.addTag('Upload-Timestamp', new Date().toISOString());

      if (options.vehicleId) {
        transaction.addTag('Vehicle-ID', options.vehicleId);
      }
      if (options.vin) {
        transaction.addTag('VIN', options.vin);
      }
      if (options.documentType) {
        transaction.addTag('Document-Type', options.documentType);
      }
      if (options.userId) {
        transaction.addTag('Uploaded-By', options.userId);
      }

      // Add custom metadata as tags
      if (options.metadata) {
        Object.entries(options.metadata).forEach(([key, value]) => {
          transaction.addTag(`Meta-${key}`, String(value));
        });
      }

      // Sign and submit transaction
      await this.arweave.transactions.sign(transaction, this.wallet);
      
      // For testnet, we might need to fund the wallet first
      if (this.isTestnet) {
        try {
          const walletAddress = await this.arweave.wallets.jwkToAddress(this.wallet);
          const currentBalance = await this.getBalance(walletAddress);
          
          if (currentBalance < estimatedCost) {
            logger.warn(`⚠️ Insufficient balance (${currentBalance} AR) for upload cost (${estimatedCost} AR)`);
            // In testnet, you might need to get tokens from a faucet
            // For now, we'll proceed anyway as testnet might be more lenient
          }
        } catch (balanceError) {
          logger.warn('⚠️ Could not check balance before upload:', balanceError);
        }
      }

      const response = await this.arweave.transactions.post(transaction);
      
      if (response.status === 200 || response.status === 202) {
        const result: ArweaveUploadResult = {
          transactionId: transaction.id,
          url: `${this.gatewayBaseUrl}/${transaction.id}`,
          size: dataSize,
          cost: estimatedCost,
          permanent: true,
          // For testnet, the gateway URL doubles as a viewer; for mainnet recommend ViewBlock
          explorerUrl: this.isTestnet 
            ? `${this.gatewayBaseUrl}/${transaction.id}`
            : `https://viewblock.io/arweave/tx/${transaction.id}`
        };

        logger.info(`✅ Data uploaded to Arweave: ${transaction.id} (${dataSize} bytes)`);
        return result;
      } else {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
    } catch (error: any) {
      logger.error('❌ Failed to upload to Arweave:', error);
      throw new Error(`Arweave upload failed: ${error?.message || String(error)}`);
    }
  }

  /**
   * Upload vehicle document to Arweave
   */
  async uploadVehicleDocument(
    vehicleId: string,
    vin: string,
    documentType: string,
    fileData: Buffer,
    fileName: string,
    contentType: string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<VehicleArweaveRecord> {
    try {
      const uploadOptions: ArweaveUploadOptions = {
        data: fileData,
        contentType,
        fileName,
        vehicleId,
        vin,
        documentType,
        userId,
        metadata: {
          ...metadata,
          documentCategory: 'vehicle_document',
          uploadSource: 'veridrive_api'
        }
      };

      const uploadResult = await this.uploadData(uploadOptions);

      const record: VehicleArweaveRecord = {
        vehicleId,
        vin,
        documentType: documentType as any,
        arweaveId: uploadResult.transactionId,
        arweaveUrl: uploadResult.url,
        uploadedBy: userId,
        uploadedAt: new Date(),
        size: uploadResult.size,
        cost: uploadResult.cost,
        isVerified: false // Will be verified once confirmed on Arweave
      };

      logger.info(`📄 Vehicle document uploaded to Arweave: ${vin} - ${documentType}`);
      return record;
    } catch (error: any) {
      logger.error(`❌ Failed to upload vehicle document for ${vin}:`, error);
      throw new Error(`Document upload failed: ${error?.message || String(error)}`);
    }
  }

  /**
   * Upload mileage history to Arweave
   */
  async uploadMileageHistory(
    vehicleId: string,
    vin: string,
    mileageData: any[],
    userId: string
  ): Promise<VehicleArweaveRecord> {
    try {
      const historyJson = JSON.stringify({
        vehicleId,
        vin,
        mileageHistory: mileageData,
        uploadedAt: new Date().toISOString(),
        uploadedBy: userId,
        dataIntegrity: {
          checksum: crypto.createHash('sha256').update(JSON.stringify(mileageData)).digest('hex'),
          recordCount: mileageData.length
        }
      }, null, 2);

      const uploadResult = await this.uploadData({
        data: historyJson,
        contentType: 'application/json',
        fileName: `mileage_history_${vin}_${Date.now()}.json`,
        vehicleId,
        vin,
        documentType: 'mileage_history',
        userId,
        metadata: {
          recordCount: mileageData.length,
          dataType: 'mileage_history',
          vehicle: vin
        }
      });

      const record: VehicleArweaveRecord = {
        vehicleId,
        vin,
        documentType: 'mileage_history',
        arweaveId: uploadResult.transactionId,
        arweaveUrl: uploadResult.url,
        uploadedBy: userId,
        uploadedAt: new Date(),
        size: uploadResult.size,
        cost: uploadResult.cost,
        isVerified: false
      };

      logger.info(`📊 Mileage history uploaded to Arweave: ${vin} (${mileageData.length} records)`);
      return record;
    } catch (error: any) {
      logger.error(`❌ Failed to upload mileage history for ${vin}:`, error);
      throw new Error(`Mileage history upload failed: ${error?.message || String(error)}`);
    }
  }

  /**
   * Retrieve data from Arweave
   */
  async getData(transactionId: string): Promise<Buffer> {
    try {
      const data = await this.arweave.transactions.getData(transactionId, { decode: true, string: false });
      return Buffer.from(data as Uint8Array);
    } catch (error: any) {
      logger.error(`❌ Failed to retrieve data from Arweave ${transactionId}:`, error);
      throw new Error(`Data retrieval failed: ${error?.message || String(error)}`);
    }
  }

  /**
   * Get transaction metadata
   */
  async getTransactionMetadata(transactionId: string): Promise<any> {
    try {
      const transaction = await this.arweave.transactions.get(transactionId);
      const status = await this.arweave.transactions.getStatus(transactionId);
      
      return {
        id: transaction.id,
        owner: transaction.owner,
        target: transaction.target,
        quantity: transaction.quantity,
        reward: transaction.reward,
        last_tx: transaction.last_tx,
        tags: transaction.tags.map(tag => ({
          name: this.arweave.utils.b64UrlToString(tag.name),
          value: this.arweave.utils.b64UrlToString(tag.value)
        })),
        data_size: transaction.data_size,
        status: status.status,
        confirmed: status.confirmed
      };
    } catch (error: any) {
      logger.error(`❌ Failed to get transaction metadata for ${transactionId}:`, error);
      throw new Error(`Metadata retrieval failed: ${error?.message || String(error)}`);
    }
  }

  /**
   * Verify transaction status
   */
  async verifyTransaction(transactionId: string): Promise<{
    exists: boolean;
    confirmed: boolean;
    status: number;
    blockHeight?: number;
  }> {
    try {
      const status = await this.arweave.transactions.getStatus(transactionId);
      
      return {
        exists: status.status !== 404,
        confirmed: status.confirmed ? status.confirmed.number_of_confirmations > 0 : false,
        status: status.status,
        blockHeight: status.confirmed?.block_height
      };
    } catch (error: any) {
      logger.error(`❌ Failed to verify transaction ${transactionId}:`, error);
      return {
        exists: false,
        confirmed: false,
        status: 404
      };
    }
  }

  /**
   * Search for transactions by tags
   */
  async searchTransactions(tags: Array<{ name: string; value: string }>, limit: number = 10): Promise<string[]> {
    try {
      const query = {
        op: 'and',
        expr1: {
          op: 'equals',
          expr1: 'App-Name',
          expr2: 'VERIDRIVE'
        },
        expr2: tags.length > 1 ? {
          op: 'and',
          expr1: {
            op: 'equals',
            expr1: tags[0].name,
            expr2: tags[0].value
          },
          expr2: tags.length > 1 ? {
            op: 'equals',
            expr1: tags[1].name,
            expr2: tags[1].value
          } : undefined
        } : {
          op: 'equals',
          expr1: tags[0].name,
          expr2: tags[0].value
        }
      };

      const results = await this.arweave.api.post('graphql', {
        query: `
          query($tags: [TagFilter!], $first: Int!) {
            transactions(tags: $tags, first: $first) {
              edges {
                node {
                  id
                }
              }
            }
          }
        `,
        variables: {
          tags: tags.map(tag => ({ name: tag.name, values: [tag.value] })),
          first: limit
        }
      });

      return results.data.data.transactions.edges.map((edge: any) => edge.node.id);
    } catch (error) {
      logger.error('❌ Failed to search Arweave transactions:', error);
      return [];
    }
  }

  /**
   * Get network info
   */
  async getNetworkInfo(): Promise<{
    network: string;
    height: number;
    current: string;
    blocks: number;
    peers: number;
  }> {
    try {
      const info = await this.arweave.network.getInfo();
      return {
        network: this.isTestnet ? 'testnet' : 'mainnet',
        height: info.height,
        current: info.current,
        blocks: info.blocks,
        peers: info.peers
      };
    } catch (error) {
      logger.error('❌ Failed to get Arweave network info:', error);
      return {
        network: this.isTestnet ? 'testnet' : 'mainnet',
        height: 0,
        current: '',
        blocks: 0,
        peers: 0
      };
    }
  }
}

// Export singleton instance
// Lazy initialization to prevent startup issues
let _arweaveService: ArweaveService | null = null;

export const getArweaveService = (): ArweaveService => {
  if (!_arweaveService) {
    _arweaveService = new ArweaveService();
  }
  return _arweaveService;
};

// For backward compatibility
export const arweaveService = {
  get instance() {
    return getArweaveService();
  }
};

