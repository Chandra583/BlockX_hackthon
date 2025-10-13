import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export type SolanaNetwork = 'devnet' | 'testnet' | 'mainnet';

export interface SolanaConfig {
  rpcUrl: string;
  explorerUrl: string;
  name: string;
}

export const SOLANA_NETWORKS: Record<SolanaNetwork, SolanaConfig> = {
  devnet: {
    rpcUrl: 'https://api.devnet.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    name: 'Devnet'
  },
  testnet: {
    rpcUrl: 'https://api.testnet.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    name: 'Testnet'
  },
  mainnet: {
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    name: 'Mainnet'
  }
};

export class SolanaHelper {
  private connection: Connection;
  private network: SolanaNetwork;

  constructor(network: SolanaNetwork = 'devnet') {
    this.network = network;
    this.connection = new Connection(SOLANA_NETWORKS[network].rpcUrl, 'confirmed');
  }

  /**
   * Get SOL balance for a public key
   */
  async getBalance(publicKey: string): Promise<number> {
    try {
      const pubkey = new PublicKey(publicKey);
      const balance = await this.connection.getBalance(pubkey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      throw new Error(`Failed to fetch balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get explorer URL for a public key or transaction
   */
  getExplorerUrl(identifier: string, type: 'address' | 'tx' = 'address'): string {
    const baseUrl = SOLANA_NETWORKS[this.network].explorerUrl;
    const cluster = this.network === 'mainnet' ? '' : `?cluster=${this.network}`;
    
    if (type === 'address') {
      return `${baseUrl}/address/${identifier}${cluster}`;
    } else {
      return `${baseUrl}/tx/${identifier}${cluster}`;
    }
  }

  /**
   * Truncate address for display
   */
  truncateAddress(address: string, startChars: number = 4, endChars: number = 4): string {
    if (address.length <= startChars + endChars) {
      return address;
    }
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }

  /**
   * Validate Solana address format
   */
  isValidAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Switch network
   */
  switchNetwork(network: SolanaNetwork): void {
    this.network = network;
    this.connection = new Connection(SOLANA_NETWORKS[network].rpcUrl, 'confirmed');
  }

  /**
   * Get current network
   */
  getCurrentNetwork(): SolanaNetwork {
    return this.network;
  }

  /**
   * Get network config
   */
  getNetworkConfig(): SolanaConfig {
    return SOLANA_NETWORKS[this.network];
  }
}

// Export singleton instance
export const solanaHelper = new SolanaHelper('devnet');

// Utility functions
export const formatSolBalance = (balance: number): string => {
  return `${balance.toFixed(4)} SOL`;
};

export const getNetworkBadgeColor = (network: SolanaNetwork): string => {
  switch (network) {
    case 'devnet':
      return 'bg-yellow-100 text-yellow-800';
    case 'testnet':
      return 'bg-blue-100 text-blue-800';
    case 'mainnet':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};