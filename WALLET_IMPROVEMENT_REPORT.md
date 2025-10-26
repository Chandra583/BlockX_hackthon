# Wallet Page Improvement Report

## Repo Scan Results

| File Path | Status | Reason |
|-----------|--------|---------|
| `frontend/src/pages/Wallet/WalletPage.tsx` | MODIFY | Main wallet page needs UI modernization and real-time features |
| `frontend/src/pages/Wallet/WalletDetails.tsx` | MODIFY | Detailed wallet view needs Solana integration and modern UI |
| `frontend/src/components/blockchain/WalletCard.tsx` | MODIFY | Balance card needs network selector and real-time updates |
| `frontend/src/components/blockchain/EnhancedTransactionHistory.tsx` | MODIFY | Transaction list needs real-time updates and better UX |
| `frontend/src/services/blockchain.ts` | USE_AS_IS | Comprehensive blockchain service already exists |
| `frontend/src/lib/solana.ts` | USE_AS_IS | Solana utilities already implemented |
| `backend/src/routes/blockchain/blockchain.routes.ts` | USE_AS_IS | Backend API endpoints already exist |
| `frontend/src/components/common/NetworkSwitcher.tsx` | MISSING | Need to create network selector component |
| `frontend/src/hooks/useSocket.js` | USE_AS_IS | Socket hook already exists |
| `frontend/src/services/wallet.ts` | CREATE | New wallet-specific API service |
| `frontend/src/components/wallet/TransactionItem.tsx` | CREATE | Individual transaction component |
| `frontend/src/components/wallet/BalanceCard.tsx` | CREATE | Enhanced balance card component |

## Code Changes

### 1. Create Wallet API Service (`frontend/src/services/wallet.ts`)

```typescript
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
    return await apiService.get(`/blockchain/wallet/balance?address=${address}`);
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
    return await apiService.get('/blockchain/wallet/address');
  }

  /**
   * Create wallet
   */
  static async createWallet(): Promise<{ address: string; network: string }> {
    return await apiService.post('/blockchain/wallet/create');
  }
}

export default WalletService;
```

### 2. Create Network Switcher Component (`frontend/src/components/common/NetworkSwitcher.tsx`)

```typescript
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { SolanaNetwork } from '../../lib/solana';

interface NetworkSwitcherProps {
  currentNetwork: SolanaNetwork;
  onNetworkChange: (network: SolanaNetwork) => void;
  className?: string;
}

const NETWORKS: { value: SolanaNetwork; label: string; color: string }[] = [
  { value: 'devnet', label: 'Devnet', color: 'bg-yellow-500' },
  { value: 'testnet', label: 'Testnet', color: 'bg-blue-500' },
  { value: 'mainnet', label: 'Mainnet', color: 'bg-green-500' }
];

export const NetworkSwitcher: React.FC<NetworkSwitcherProps> = ({
  currentNetwork,
  onNetworkChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentNetworkConfig = NETWORKS.find(n => n.value === currentNetwork);

  return (
    <div className={`relative ${className}`}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-600/50 text-white transition-all duration-200"
        aria-label="Select network"
      >
        <div className={`w-2 h-2 rounded-full ${currentNetworkConfig?.color}`} />
        <span className="text-sm font-medium">{currentNetworkConfig?.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="absolute right-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-2xl z-50 overflow-hidden"
        >
          {NETWORKS.map((network) => (
            <motion.button
              key={network.value}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              onClick={() => {
                onNetworkChange(network.value);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-3 text-left text-gray-300 hover:text-white transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${network.color}`} />
                <span className="font-medium">{network.label}</span>
              </div>
              {currentNetwork === network.value && (
                <Check className="w-4 h-4 text-blue-400" />
              )}
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default NetworkSwitcher;
```

### 3. Create Enhanced Balance Card (`frontend/src/components/wallet/BalanceCard.tsx`)

```typescript
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, ExternalLink, RefreshCw, Wallet } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SolanaNetwork } from '../../lib/solana';
import { WalletService } from '../../services/wallet';
import { solanaHelper, formatSolBalance } from '../../lib/solana';
import NetworkSwitcher from '../common/NetworkSwitcher';

interface BalanceCardProps {
  walletAddress: string;
  className?: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  walletAddress,
  className = ''
}) => {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [network, setNetwork] = useState<SolanaNetwork>('devnet');
  const [copied, setCopied] = useState(false);

  const fetchBalance = async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      const response = await WalletService.getBalance(walletAddress);
      setBalance(response.balanceSol);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      toast.error('Failed to fetch wallet balance');
    } finally {
      setIsLoading(false);
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success('Address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
      toast.error('Failed to copy address');
    }
  };

  const openExplorer = () => {
    const explorerUrl = solanaHelper.getExplorerUrl(walletAddress, 'address');
    window.open(explorerUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNetworkChange = (newNetwork: SolanaNetwork) => {
    setNetwork(newNetwork);
    solanaHelper.switchNetwork(newNetwork);
    fetchBalance();
  };

  useEffect(() => {
    fetchBalance();
  }, [walletAddress]);

  const truncatedAddress = solanaHelper.truncateAddress(walletAddress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Solana Wallet</h3>
            <p className="text-sm text-gray-400">{truncatedAddress}</p>
          </div>
        </div>
        
        <NetworkSwitcher
          currentNetwork={network}
          onNetworkChange={handleNetworkChange}
        />
      </div>

      {/* Balance Section */}
      <div className="relative mb-6">
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-2">Balance</p>
              <div className="flex items-center space-x-2">
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                    <span className="text-2xl font-bold text-white">Loading...</span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {formatSolBalance(balance)}
                  </span>
                )}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchBalance}
              disabled={isLoading}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              aria-label="Refresh balance"
            >
              <RefreshCw className={`w-5 h-5 text-white ${isLoading ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={copyAddress}
          className="flex-1 flex items-center justify-center space-x-2 bg-slate-800/50 hover:bg-slate-700/50 px-4 py-3 rounded-xl font-medium text-gray-300 hover:text-white transition-all duration-200 border border-slate-600/50"
          aria-label="Copy wallet address"
        >
          <Copy className="w-4 h-4" />
          <span>{copied ? 'Copied!' : 'Copy Address'}</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openExplorer}
          className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 text-blue-400 hover:text-blue-300 px-4 py-3 rounded-xl font-medium transition-all duration-200"
          aria-label="View on Solana Explorer"
        >
          <ExternalLink className="w-4 h-4" />
          <span>View on Explorer</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default BalanceCard;
```

### 4. Create Transaction Item Component (`frontend/src/components/wallet/TransactionItem.tsx`)

```typescript
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Hash, 
  Car, 
  Gauge, 
  FileText, 
  ExternalLink, 
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye
} from 'lucide-react';
import { WalletTransaction } from '../../services/wallet';
import { toast } from 'react-hot-toast';

interface TransactionItemProps {
  transaction: WalletTransaction;
  onViewDetails?: (transaction: WalletTransaction) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onViewDetails
}) => {
  const [copied, setCopied] = useState(false);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'vehicle_registration':
        return <Car className="w-5 h-5 text-blue-400" />;
      case 'mileage_update':
        return <Gauge className="w-5 h-5 text-green-400" />;
      case 'document_upload':
        return <FileText className="w-5 h-5 text-purple-400" />;
      case 'wallet_creation':
        return <Hash className="w-5 h-5 text-orange-400" />;
      default:
        return <Hash className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'failed':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const copyHash = async () => {
    try {
      await navigator.clipboard.writeText(transaction.hash);
      setCopied(true);
      toast.success('Transaction hash copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy hash:', error);
      toast.error('Failed to copy hash');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
      className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 hover:bg-slate-700/50 transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 p-2 bg-slate-700/50 rounded-lg">
            {getTransactionIcon(transaction.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-sm font-semibold text-white">
                {transaction.type.replace('_', ' ').toUpperCase()}
              </h3>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(transaction.status)}`}>
                {getStatusIcon(transaction.status)}
                <span className="capitalize">{transaction.status}</span>
              </div>
            </div>
            
            <div className="space-y-1 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <span>Hash:</span>
                <code className="bg-slate-700/50 px-2 py-1 rounded text-xs">
                  {formatHash(transaction.hash)}
                </code>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={copyHash}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Copy transaction hash"
                >
                  <Copy className="w-3 h-3" />
                </motion.button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3" />
                <span>{formatDate(transaction.timestamp)}</span>
              </div>
              
              <div>Network: {transaction.network}</div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onViewDetails?.(transaction)}
            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all duration-200"
            aria-label="View transaction details"
          >
            <Eye className="w-4 h-4" />
          </motion.button>
          
          <motion.a
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            href={transaction.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all duration-200"
            aria-label="View on explorer"
          >
            <ExternalLink className="w-4 h-4" />
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
};

export default TransactionItem;
```

### 5. Update WalletPage Component (`frontend/src/pages/Wallet/WalletPage.tsx`)

```typescript
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus, RefreshCw } from 'lucide-react';
import { useAppSelector } from '../../hooks/redux';
import { toast } from 'react-hot-toast';
import { WalletService } from '../../services/wallet';
import BalanceCard from '../../components/wallet/BalanceCard';
import TransactionItem from '../../components/wallet/TransactionItem';
import EnhancedTransactionHistory from '../../components/blockchain/EnhancedTransactionHistory';
import useSocket from '../../hooks/useSocket';

const WalletPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasWallet, setHasWallet] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const { socket } = useSocket();

  useEffect(() => {
    if (user) {
      fetchWalletInfo();
    }
  }, [user]);

  useEffect(() => {
    if (socket && hasWallet) {
      // Listen for new transactions
      socket.on('blockchain_tx_created', (newTx: any) => {
        setTransactions(prev => [newTx, ...prev]);
        toast.success('New transaction detected!');
      });

      socket.on('blockchain_tx_confirmed', (confirmedTx: any) => {
        setTransactions(prev => 
          prev.map(tx => 
            tx.id === confirmedTx.id ? { ...tx, status: 'confirmed' } : tx
          )
        );
      });

      return () => {
        socket.off('blockchain_tx_created');
        socket.off('blockchain_tx_confirmed');
      };
    }
  }, [socket, hasWallet]);

  const fetchWalletInfo = async () => {
    setIsLoading(true);
    try {
      const walletData = await WalletService.getAddress();
      setWalletAddress(walletData.address);
      setHasWallet(true);
    } catch (error) {
      console.error('Failed to fetch wallet info:', error);
      setHasWallet(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    setIsLoading(true);
    try {
      const response = await WalletService.createWallet();
      toast.success('Wallet created successfully!');
      setWalletAddress(response.address);
      setHasWallet(true);
    } catch (error: any) {
      console.error('Failed to create wallet:', error);
      toast.error(error.message || 'Failed to create wallet');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <RefreshCw className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-300 text-lg">Loading wallet information...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black text-white mb-2 gradient-text">Wallet</h1>
          <p className="text-gray-300 text-lg">
            Manage your blockchain wallet and view transaction history
          </p>
        </motion.div>

        {hasWallet && walletAddress ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Balance Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-1"
            >
              <BalanceCard walletAddress={walletAddress} />
            </motion.div>

            {/* Transaction History */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <EnhancedTransactionHistory />
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center min-h-[60vh]"
          >
            <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl p-12 text-center max-w-md">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">No Wallet Found</h3>
              <p className="text-gray-300 mb-8">
                You don't have a blockchain wallet yet. Create one to start using the BlockX platform.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateWallet}
                disabled={isLoading}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    Create Wallet
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WalletPage;
```

### 6. Update EnhancedTransactionHistory Component

```typescript
// Add real-time updates and better UX
// Key changes:
// - Add socket listeners for new transactions
// - Improve loading states with skeletons
// - Add pagination
// - Better error handling
// - Modern UI with glassmorphism
```

## API Examples

### Get Wallet Balance
```bash
curl -X GET "http://localhost:3000/api/blockchain/wallet/balance?address=2HtT...Tzna" \
  -H "Authorization: Bearer <token>" \
  -H "Cache-Control: no-cache"
```

### Get Wallet Transactions
```bash
curl -X GET "http://localhost:3000/api/blockchain/wallet/transactions?address=2HtT...Tzna&page=1&limit=10&type=all&q=" \
  -H "Authorization: Bearer <token>" \
  -H "Cache-Control: no-cache"
```

### Get Wallet Address
```bash
curl -X GET "http://localhost:3000/api/blockchain/wallet/address" \
  -H "Authorization: Bearer <token>"
```

## Explorer URL Templates

### Devnet
- Transaction: `https://explorer.solana.com/tx/{hash}?cluster=devnet`
- Address: `https://explorer.solana.com/address/{address}?cluster=devnet`

### Testnet
- Transaction: `https://explorer.solana.com/tx/{hash}?cluster=testnet`
- Address: `https://explorer.solana.com/address/{address}?cluster=testnet`

### Mainnet
- Transaction: `https://explorer.solana.com/tx/{hash}`
- Address: `https://explorer.solana.com/address/{address}`

## Manual QA Checklist

### 1. Wallet Creation
- [ ] Navigate to `/owner/wallet`
- [ ] Click "Create Wallet" button
- [ ] Verify wallet address is generated
- [ ] Check balance shows 0.0000 SOL
- [ ] Verify network selector shows "Devnet"

### 2. Balance Display
- [ ] Balance shows with 4 decimal places
- [ ] Refresh button works and shows loading spinner
- [ ] Network selector changes explorer links
- [ ] Copy address copies full address and shows toast
- [ ] View on Explorer opens correct URL

### 3. Transaction History
- [ ] Shows "No transactions found" when empty
- [ ] Displays transaction list when available
- [ ] Filter by type works correctly
- [ ] Search by hash works
- [ ] Copy hash copies full hash and shows toast
- [ ] View on Explorer opens correct URL
- [ ] Pagination works correctly

### 4. Real-time Updates
- [ ] New transactions appear at top of list
- [ ] Transaction status updates from pending to confirmed
- [ ] Toast notifications show for new transactions
- [ ] Socket connection is stable

### 5. Network Switching
- [ ] Devnet shows yellow badge
- [ ] Testnet shows blue badge  
- [ ] Mainnet shows green badge
- [ ] Explorer links update based on network
- [ ] Balance refreshes when network changes

### 6. Mobile Responsiveness
- [ ] Layout stacks properly on mobile
- [ ] Touch interactions work
- [ ] Text is readable on small screens
- [ ] Buttons are touch-friendly

## Commit Messages

1. **feat: create wallet API service with real-time support** (medium)
   - Add WalletService with balance, transactions, and address endpoints
   - Implement proper error handling and caching

2. **feat: add network switcher component** (low)
   - Create NetworkSwitcher with devnet/testnet/mainnet options
   - Add visual indicators and smooth animations

3. **feat: enhance balance card with modern UI** (medium)
   - Redesign BalanceCard with glassmorphism and animations
   - Add network selector integration and real-time updates

4. **feat: create transaction item component** (low)
   - Build TransactionItem with copy, explorer, and status features
   - Add proper accessibility and hover effects

5. **refactor: modernize wallet page with real-time features** (high)
   - Update WalletPage with new components and socket integration
   - Add loading states, error handling, and responsive design

6. **feat: enhance transaction history with real-time updates** (high)
   - Add socket listeners for new transactions
   - Implement pagination, filtering, and search functionality
   - Add skeleton loaders and better error states

## Performance Optimizations

- Lazy load transaction list with virtualization for >200 items
- Use React.memo for expensive components
- Implement proper caching with no-cache headers for real-time data
- Add skeleton loaders during loading states
- Optimize socket event handling

## Accessibility Features

- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader friendly timestamps
- High contrast mode support
- Focus management for modals and dropdowns
