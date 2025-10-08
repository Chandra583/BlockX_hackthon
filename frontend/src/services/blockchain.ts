import { apiService } from './api';

// Types for Blockchain API responses
export interface WalletData {
  success: boolean;
  message: string;
  data: {
    walletAddress: string;
    balance: number;
    blockchain: string;
    network: string;
  };
}

export interface WalletCreationResponse {
  success: boolean;
  message: string;
  data: {
    walletAddress: string;
    balance: number;
    blockchain: string;
    network: string;
  };
}

export interface BlockchainTransaction {
  transactionHash: string;
  blockchainAddress: string;
  network: string;
  explorerUrl: string;
  timestamp: string;
  type: 'vehicle_registration' | 'mileage_update' | 'document_upload';
  status: 'pending' | 'confirmed' | 'failed';
  data: any;
}

export interface BlockchainStatus {
  success: boolean;
  message: string;
  data: {
    solana: {
      status: 'online' | 'offline';
      network: string;
      blockHeight?: number;
      lastUpdate: string;
    };
    arweave: {
      status: 'online' | 'offline';
      network: string;
      lastUpdate: string;
    };
  };
}

export interface TransactionVerification {
  success: boolean;
  message: string;
  data: {
    transactionHash: string;
    isValid: boolean;
    confirmations: number;
    timestamp: string;
    details: any;
  };
}

export interface ArweaveUploadResponse {
  success: boolean;
  message: string;
  data: {
    arweaveId: string;
    url: string;
    size: number;
    type: string;
    network: string;
  };
}

/**
 * Blockchain Service Class
 * Handles all blockchain-related API calls
 */
export class BlockchainService {
  
  // ========================================
  // WALLET OPERATIONS
  // ========================================
  
  /**
   * Get user's blockchain wallet information
   */
  static async getWallet(): Promise<WalletData> {
    return await apiService.get<WalletData>('/blockchain/wallet');
  }
  
  /**
   * Create a new blockchain wallet for the user
   */
  static async createWallet(): Promise<WalletCreationResponse> {
    return await apiService.post<WalletCreationResponse>('/blockchain/wallet/create');
  }
  
  /**
   * Check if user has a blockchain wallet
   */
  static async hasWallet(): Promise<boolean> {
    try {
      const wallet = await this.getWallet();
      return wallet.success && !!wallet.data.walletAddress;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return false;
      }
      throw error;
    }
  }
  
  /**
   * Refresh wallet balance
   */
  static async refreshWalletBalance(): Promise<WalletData> {
    return await this.getWallet();
  }
  
  // ========================================
  // BLOCKCHAIN STATUS
  // ========================================
  
  /**
   * Get blockchain network status
   */
  static async getBlockchainStatus(): Promise<BlockchainStatus> {
    return await apiService.get<BlockchainStatus>('/blockchain/status');
  }
  
  /**
   * Get Solana network status
   */
  static async getSolanaStatus(): Promise<any> {
    return await apiService.get('/blockchain/solana/status');
  }
  
  /**
   * Get Arweave network status
   */
  static async getArweaveStatus(): Promise<any> {
    return await apiService.get('/blockchain/arweave/status');
  }
  
  // ========================================
  // TRANSACTION OPERATIONS
  // ========================================
  
  /**
   * Verify a blockchain transaction
   */
  static async verifyTransaction(transactionHash: string): Promise<TransactionVerification> {
    return await apiService.get<TransactionVerification>(`/blockchain/verify/${transactionHash}`);
  }
  
  /**
   * Get transaction history for user
   */
  static async getTransactionHistory(params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const url = `/blockchain/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get(url);
  }
  
  // ========================================
  // VEHICLE BLOCKCHAIN OPERATIONS
  // ========================================
  
  /**
   * Register vehicle on blockchain
   */
  static async registerVehicle(vehicleData: {
    vehicleId: string;
    vin: string;
    make: string;
    model: string;
    year: number;
    initialMileage: number;
    color?: string;
    bodyType?: string;
    fuelType?: string;
    transmission?: string;
  }): Promise<any> {
    return await apiService.post('/blockchain/vehicle/register', vehicleData);
  }
  
  /**
   * Get vehicle blockchain history
   */
  static async getVehicleHistory(vehicleId: string): Promise<any> {
    return await apiService.get(`/blockchain/vehicle/${vehicleId}/history`);
  }
  
  /**
   * Record mileage on blockchain
   */
  static async recordMileage(mileageData: {
    vehicleId: string;
    mileage: number;
    location: string;
    source: string;
    notes?: string;
  }): Promise<any> {
    return await apiService.post('/blockchain/mileage/record', mileageData);
  }
  
  /**
   * Get mileage history from blockchain
   */
  static async getMileageHistory(vehicleId: string): Promise<any> {
    return await apiService.get(`/blockchain/vehicle/${vehicleId}/mileage-history`);
  }
  
  // ========================================
  // ARWEAVE OPERATIONS
  // ========================================
  
  /**
   * Upload document to Arweave
   */
  static async uploadToArweave(file: File, metadata?: any): Promise<ArweaveUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    
    return await apiService.post<ArweaveUploadResponse>('/blockchain/arweave/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      } as any,
    });
  }
  
  /**
   * Backup mileage history to Arweave
   */
  static async backupMileageToArweave(vehicleId: string): Promise<any> {
    return await apiService.post(`/blockchain/arweave/mileage-history`, { vehicleId });
  }
  
  /**
   * Get Arweave document by ID
   */
  static async getArweaveDocument(arweaveId: string): Promise<any> {
    return await apiService.get(`/blockchain/arweave/${arweaveId}`);
  }
  
  // ========================================
  // UTILITY METHODS
  // ========================================
  
  /**
   * Get Solana explorer URL
   */
  static getSolanaExplorerUrl(transactionHash: string, network: string = 'devnet'): string {
    const baseUrl = 'https://explorer.solana.com/tx';
    const cluster = network === 'mainnet' ? '' : `?cluster=${network}`;
    return `${baseUrl}/${transactionHash}${cluster}`;
  }
  
  /**
   * Get Solana address explorer URL
   */
  static getSolanaAddressUrl(address: string, network: string = 'devnet'): string {
    const baseUrl = 'https://explorer.solana.com/address';
    const cluster = network === 'mainnet' ? '' : `?cluster=${network}`;
    return `${baseUrl}/${address}${cluster}`;
  }
  
  /**
   * Get Arweave explorer URL
   */
  static getArweaveExplorerUrl(arweaveId: string): string {
    return `https://viewblock.io/arweave/tx/${arweaveId}`;
  }
  
  /**
   * Get Arweave document URL
   */
  static getArweaveDocumentUrl(arweaveId: string, gateway: string = 'arweave.net'): string {
    return `https://${gateway}/${arweaveId}`;
  }
  
  /**
   * Format wallet address for display
   */
  static formatWalletAddress(address: string, showFull: boolean = false): string {
    if (!address) return '';
    if (showFull) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }
  
  /**
   * Format SOL balance for display
   */
  static formatSOLBalance(balance: number): string {
    return `${balance.toFixed(4)} SOL`;
  }
  
  /**
   * Check if transaction hash is valid Solana format
   */
  static isValidSolanaTransaction(hash: string): boolean {
    // Solana transaction hashes are base58 encoded and typically 87-88 characters
    const solanaHashRegex = /^[1-9A-HJ-NP-Za-km-z]{87,88}$/;
    return solanaHashRegex.test(hash);
  }
  
  /**
   * Check if Arweave ID is valid format
   */
  static isValidArweaveId(id: string): boolean {
    // Arweave IDs are base64url encoded and 43 characters
    const arweaveIdRegex = /^[A-Za-z0-9_-]{43}$/;
    return arweaveIdRegex.test(id);
  }
  
  /**
   * Get network display name
   */
  static getNetworkDisplayName(network: string): string {
    const displayNames: Record<string, string> = {
      'devnet': 'Devnet (Testing)',
      'testnet': 'Testnet',
      'mainnet': 'Mainnet (Production)',
      'mainnet-beta': 'Mainnet Beta'
    };
    
    return displayNames[network] || network;
  }
  
  /**
   * Get transaction type display name
   */
  static getTransactionTypeDisplayName(type: string): string {
    const displayNames: Record<string, string> = {
      'vehicle_registration': 'Vehicle Registration',
      'mileage_update': 'Mileage Update',
      'document_upload': 'Document Upload',
      'wallet_creation': 'Wallet Creation'
    };
    
    return displayNames[type] || type;
  }
  
  /**
   * Get transaction status color
   */
  static getTransactionStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'pending': 'text-yellow-600 bg-yellow-100',
      'confirmed': 'text-green-600 bg-green-100',
      'failed': 'text-red-600 bg-red-100'
    };
    
    return colors[status] || 'text-gray-600 bg-gray-100';
  }
  
  /**
   * Calculate transaction fee estimate
   */
  static estimateTransactionFee(type: 'vehicle_registration' | 'mileage_update' | 'document_upload'): number {
    // Estimated SOL fees for different transaction types
    const fees: Record<string, number> = {
      'vehicle_registration': 0.001,
      'mileage_update': 0.0005,
      'document_upload': 0.0002
    };
    
    return fees[type] || 0.001;
  }
  
  /**
   * Check if user has sufficient balance for transaction
   */
  static hasSufficientBalance(balance: number, transactionType: string): boolean {
    const requiredFee = this.estimateTransactionFee(transactionType as any);
    return balance >= requiredFee;
  }
  
  /**
   * Get funding instructions for devnet
   */
  static getDevnetFundingInstructions(): {
    method: string;
    instructions: string;
    url?: string;
  }[] {
    return [
      {
        method: 'Solana Faucet (Web)',
        instructions: 'Visit the official Solana faucet and enter your wallet address to receive free SOL',
        url: 'https://faucet.solana.com'
      },
      {
        method: 'CLI Command',
        instructions: 'Run: solana airdrop 2 <your-wallet-address> --url https://api.devnet.solana.com'
      },
      {
        method: 'QuickNode Faucet',
        instructions: 'Alternative faucet with higher limits',
        url: 'https://faucet.quicknode.com/solana/devnet'
      }
    ];
  }
}

// Export the service as default
export default BlockchainService;
