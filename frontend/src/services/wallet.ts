import { apiService } from './api';

export interface WalletBalance {
  balanceSol: number;
  address: string;
  network: string;
  lastUpdated: string;
}

export interface WalletTransaction {
  id: string;
  hash: string;
  type: 'vehicle_registration' | 'mileage_update' | 'blockchain_transaction' | 'wallet_creation';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  network: string;
  explorerUrl: string;
  data?: any;
  fee?: number;
  slot?: number;
}

export interface WalletTransactionsResponse {
  transactions: WalletTransaction[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTransactions: number;
    limit: number;
  };
}

export class WalletService {
  /**
   * Get wallet balance
   */
  static async getBalance(address: string): Promise<WalletBalance> {
    const response = await apiService.get('/blockchain/wallet');
    return {
      balanceSol: response.data.balance,
      address: response.data.walletAddress,
      network: response.data.network,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get wallet transactions
   */
  static async getTransactions(params: {
    address: string;
    page?: number;
    limit?: number;
    type?: string;
    q?: string;
  }): Promise<WalletTransactionsResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    return await apiService.get(`/blockchain/wallet/transactions?${queryParams.toString()}`);
  }

  /**
   * Get wallet address
   */
  static async getAddress(): Promise<{ address: string; network: string }> {
    const response = await apiService.get('/blockchain/wallet');
    return {
      address: response.data.walletAddress,
      network: response.data.network
    };
  }

  /**
   * Create wallet
   */
  static async createWallet(): Promise<{ address: string; network: string }> {
    const response = await apiService.post('/blockchain/wallet/create');
    return {
      address: response.data.walletAddress,
      network: response.data.network || 'devnet'
    };
  }
}

export default WalletService;
