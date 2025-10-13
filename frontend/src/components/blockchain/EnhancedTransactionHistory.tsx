import React, { useState, useEffect } from 'react';
import { 
  Hash, 
  Car, 
  Gauge, 
  FileText, 
  ExternalLink, 
  RefreshCw, 
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Download,
  Eye,
  Copy,
  Search
} from 'lucide-react';
import { BlockchainService } from '../../services/blockchain';
import { VehicleService } from '../../services/vehicle';

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

  // Get transaction type icon
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'vehicle_registration':
        return <Car className="w-5 h-5" />;
      case 'mileage_update':
        return <Gauge className="w-5 h-5" />;
      case 'document_upload':
        return <FileText className="w-5 h-5" />;
      case 'wallet_creation':
        return <Hash className="w-5 h-5" />;
      default:
        return <Hash className="w-5 h-5" />;
    }
  };

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

  // Format transaction hash for display
  const formatHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
        <span className="text-gray-600">Loading transaction history...</span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {vehicleId ? 'Vehicle Blockchain History' : 'Transaction History'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              All blockchain transactions and records
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-secondary flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-gray-200">
        {error && (
          <div className="p-6 bg-red-50 border-b border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
              {error.includes('No blockchain wallet found') && (
                <button
                  onClick={() => {
                    // Navigate to wallet creation or trigger wallet creation
                    window.location.href = '/dashboard?action=create-wallet';
                  }}
                  className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                >
                  Create Wallet
                </button>
              )}
            </div>
          </div>
        )}

        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <Hash className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm || filter !== 'all' 
                ? 'No transactions match your filters' 
                : 'No transactions found'
              }
            </p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {BlockchainService.getTransactionTypeDisplayName(transaction.type)}
                      </h3>
                      {getStatusIcon(transaction.status)}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span>Hash:</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {formatHash(transaction.transactionHash)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(transaction.transactionHash)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      
                      {transaction.vehicleVin && (
                        <div>VIN: {transaction.vehicleVin}</div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(transaction.timestamp)}</span>
                      </div>
                      
                      <div>Network: {BlockchainService.getNetworkDisplayName(transaction.network)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedTransaction(transaction)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  <a
                    href={transaction.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    title="View on Explorer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  
                  {transaction.arweaveId && (
                    <a
                      href={BlockchainService.getArweaveDocumentUrl(transaction.arweaveId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800 transition-colors"
                      title="View on Arweave"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Transaction Details
              </h3>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Hash
                </label>
                <div className="flex items-center space-x-2">
                  <code className="bg-gray-100 px-3 py-2 rounded text-sm flex-1">
                    {selectedTransaction.transactionHash}
                  </code>
                  <button
                    onClick={() => copyToClipboard(selectedTransaction.transactionHash)}
                    className="btn-secondary"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <p className="text-sm text-gray-900">
                    {BlockchainService.getTransactionTypeDisplayName(selectedTransaction.type)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedTransaction.status)}
                    <span className="text-sm text-gray-900 capitalize">
                      {selectedTransaction.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timestamp
                </label>
                <p className="text-sm text-gray-900">
                  {formatDate(selectedTransaction.timestamp)}
                </p>
              </div>
              
              {selectedTransaction.data && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction Data
                  </label>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedTransaction.data, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="btn-secondary"
                >
                  Close
                </button>
                <a
                  href={selectedTransaction.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex items-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Explorer
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTransactionHistory;
