import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Hash, 
  ExternalLink, 
  RefreshCw, 
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Copy,
  Search
} from 'lucide-react';
import { BlockchainService } from '../../services/blockchain';
import TransactionItem from '../wallet/TransactionItem';
import useSocket from '../../hooks/useSocket';

interface EnhancedTransactionHistoryProps {
  vehicleId?: string;
  onClose?: () => void;
  className?: string;
}

interface BlockchainTransaction {
  id: string;
  transactionHash: string;
  type: 'vehicle_registration' | 'mileage_update' | 'document_upload' | 'wallet_creation';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  blockchainAddress: string;
  network: string;
  explorerUrl: string;
  data: any;
  vehicleId?: string;
  vehicleVin?: string;
  arweaveId?: string;
}

export const EnhancedTransactionHistory: React.FC<EnhancedTransactionHistoryProps> = ({
  vehicleId,
  onClose,
  className = ''
}) => {
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<BlockchainTransaction | null>(null);
  // const [pagination, setPagination] = useState({
  //   currentPage: 1,
  //   totalPages: 1,
  //   totalTransactions: 0,
  //   limit: 10
  // });
  const { socket } = useSocket();

  // Socket listeners for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('blockchain_tx_created', (newTx: any) => {
        setTransactions(prev => [newTx, ...prev]);
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
  }, [socket]);

  // Fetch transaction history
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (vehicleId) {
        // Get blockchain data for specific vehicle
        response = await BlockchainService.getVehicleBlockchainData(vehicleId);
        console.log('Vehicle blockchain data response:', response);
        const vehicleHistory = Array.isArray(response.data?.vehicleHistory) ? response.data.vehicleHistory : [];
        const mileageHistory = Array.isArray(response.data?.mileageHistory) ? response.data.mileageHistory : [];
        
        // Combine and format transactions
        const allTransactions = [
          ...vehicleHistory.map((tx: any) => ({
            ...tx,
            type: 'vehicle_registration' as const
          })),
          ...mileageHistory.map((tx: any) => ({
            ...tx,
            type: 'mileage_update' as const
          }))
        ];
        
        setTransactions(allTransactions);
      } else {
        // Try to get wallet transactions directly from Solana blockchain
        try {
          response = await BlockchainService.getWalletTransactions({ limit: 50 });
          console.log('Wallet transactions response:', response);
          
              // Transform Solana transactions to our format
              const solanaTransactions = Array.isArray(response.data?.transactions) ? response.data.transactions : [];
              const formattedTransactions = solanaTransactions.map((tx: any) => {
                // Parse memo JSON if memoData is not provided (Solana returns memo as a string sometimes)
                let parsedMemo: any = null;
                try {
                  if (tx.memoData) {
                    parsedMemo = tx.memoData;
                  } else if (typeof tx.memo === 'string') {
                    const start = tx.memo.indexOf('{');
                    const end = tx.memo.lastIndexOf('}');
                    if (start !== -1 && end !== -1 && end > start) {
                      const jsonPart = tx.memo.slice(start, end + 1);
                      parsedMemo = JSON.parse(jsonPart);
                    }
                  }
                } catch (e) {
                  // ignore parsing error; we'll keep parsedMemo as null
                }

                // Infer a normalized type for filtering
                const action = parsedMemo?.action || tx.memoData?.action;
                let normalizedType: 'vehicle_registration' | 'mileage_update' | 'blockchain_transaction';
                if (action === 'REGISTER_VEHICLE') {
                  normalizedType = 'vehicle_registration';
                } else if (action === 'UPDATE_MILEAGE') {
                  normalizedType = 'mileage_update';
                } else {
                  normalizedType = 'blockchain_transaction';
                }

                return {
                  id: tx.signature,
                  transactionHash: tx.signature,
                  type: normalizedType,
                  status: tx.err ? 'failed' : 'confirmed',
                  timestamp: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : new Date().toISOString(),
                  blockchainAddress: response.data?.walletAddress || '',
                  network: response.data?.network || 'devnet',
                  explorerUrl: tx.explorerUrl,
                  data: parsedMemo || tx.memoData || { rawMemo: tx.memo },
                  fee: tx.fee,
                  slot: tx.slot
                };
              });
          
          setTransactions(formattedTransactions);
        } catch (walletError: any) {
          console.warn('Failed to fetch wallet transactions, falling back to mock data:', walletError);
          
          // Check if it's a wallet-related error
          const isWalletError = walletError.response?.data?.code === 'WALLET_REQUIRED' || 
                                walletError.response?.data?.code === 'INVALID_WALLET_ADDRESS';
          
          if (isWalletError) {
            // Show a helpful message for wallet issues
            setError('No blockchain wallet found. Please create a wallet first to view transaction history.');
            setTransactions([]);
          } else {
            // Fallback to mock data for other errors
            const mockTransactions = [
              {
                id: 'mock_1',
                transactionHash: '5gkiwtK4py3ZnwEkzd7WgezMkuLDayBTWhuVrbt1PsapXhQkKnSdDVtJPXYJMoVXQ3t5eM54o76xo6k5NzVchBXa',
                type: 'vehicle_registration',
                status: 'confirmed',
                timestamp: new Date().toISOString(),
                blockchainAddress: 'GbzsmT6yK1WCY5YLMUk27nGZsen2zdTnwG4KkLhvuZjN',
                network: 'devnet',
                explorerUrl: 'https://explorer.solana.com/tx/5gkiwtK4py3ZnwEkzd7WgezMkuLDayBTWhuVrbt1PsapXhQkKnSdDVtJPXYJMoVXQ3t5eM54o76xo6k5NzVchBXa?cluster=devnet',
                data: { action: 'REGISTER_VEHICLE' },
                fee: 5000,
                slot: 123456789
              }
            ];
            
            setTransactions(mockTransactions);
            setError('Unable to fetch live blockchain data. Showing sample transaction.');
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch transaction history:', err);
      setError(BlockchainService.formatBlockchainError(err));
      setTransactions([]); // Ensure transactions is always an array
    } finally {
      setLoading(false);
    }
  };

  // Refresh transactions
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  // Load transactions on component mount
  useEffect(() => {
    fetchTransactions();
  }, [vehicleId]);

  // Filter transactions
  const filteredTransactions = Array.isArray(transactions) ? transactions.filter(tx => {
    const matchesFilter = filter === 'all' || tx.type === filter;
    const matchesSearch = searchTerm === '' || 
      tx.transactionHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.vehicleVin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  }) : [];

  // Get transaction type icon - removed unused function

  // Get status icon
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

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You might want to show a toast notification here
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Format transaction hash for display - removed unused function

  if (loading) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
          <span className="text-gray-300">Loading transaction history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {vehicleId ? 'Vehicle Blockchain History' : 'Transaction History'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              All blockchain transactions and records
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl text-gray-300 hover:text-white transition-all duration-200 border border-slate-600/50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
            {onClose && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
              >
                <X className="w-6 h-6" />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-6 border-b border-slate-700/50 bg-slate-800/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              >
                <option value="all">All Types</option>
                <option value="vehicle_registration">Vehicle Registration</option>
                <option value="mileage_update">Mileage Updates</option>
                <option value="document_upload">Document Uploads</option>
                <option value="wallet_creation">Wallet Creation</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="p-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl mb-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
              {error.includes('No blockchain wallet found') && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    window.location.href = '/owner/wallet?action=create-wallet';
                  }}
                  className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-xs rounded-lg transition-all duration-200"
                >
                  Create Wallet
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {filteredTransactions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 text-center"
          >
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Hash className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              {searchTerm || filter !== 'all' 
                ? 'No transactions match your filters' 
                : 'No transactions found'
              }
            </h3>
            <p className="text-gray-400">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Your transaction history will appear here once you start using the platform'
              }
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <TransactionItem
                  transaction={{
                    id: transaction.id,
                    hash: transaction.transactionHash,
                    type: transaction.type as any,
                    status: transaction.status as any,
                    timestamp: transaction.timestamp,
                    network: transaction.network,
                    explorerUrl: transaction.explorerUrl,
                    data: transaction.data,
                    fee: (transaction as any).fee,
                    slot: (transaction as any).slot
                  }}
                  onViewDetails={(tx) => setSelectedTransaction(transaction)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-4 sm:p-6 w-11/12 max-w-4xl shadow-2xl rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                Transaction Details
              </h3>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedTransaction(null)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Transaction Hash
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <code className="bg-slate-700/50 border border-slate-600/50 px-3 py-2 rounded-xl text-sm flex-1 text-gray-300 font-mono break-all min-w-0">
                      {selectedTransaction.transactionHash}
                    </code>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => copyToClipboard(selectedTransaction.transactionHash)}
                      className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-gray-400 hover:text-white transition-all duration-200 flex-shrink-0"
                      title="Copy transaction hash"
                    >
                      <Copy className="w-4 h-4" />
                    </motion.button>
                  </div>
                  <div className="text-xs text-gray-500">
                    Hash length: {selectedTransaction.transactionHash.length} characters
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Type
                  </label>
                  <p className="text-sm text-white">
                    {BlockchainService.getTransactionTypeDisplayName(selectedTransaction.type)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedTransaction.status)}
                    <span className="text-sm text-white capitalize">
                      {selectedTransaction.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Timestamp
                </label>
                <p className="text-sm text-white">
                  {formatDate(selectedTransaction.timestamp)}
                </p>
              </div>
              
              {selectedTransaction.data && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Transaction Data
                  </label>
                  <div className="bg-slate-700/50 border border-slate-600/50 rounded-xl overflow-hidden">
                    <pre className="p-3 text-xs text-gray-300 overflow-x-auto max-h-64 overflow-y-auto">
                      {JSON.stringify(selectedTransaction.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTransaction(null)}
                  className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-gray-300 hover:text-white rounded-xl transition-all duration-200 border border-slate-600/50"
                >
                  Close
                </motion.button>
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={selectedTransaction.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl transition-all duration-200 flex items-center hover:shadow-lg hover:shadow-blue-500/25"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Explorer
                </motion.a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTransactionHistory;
