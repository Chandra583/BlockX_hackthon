import React, { useState, useEffect } from 'react';
import { 
  ExternalLink, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Car,
  Gauge,
  FileText,
  Loader2,
  Calendar,
  Hash
} from 'lucide-react';
import { BlockchainService } from '../../services/blockchain';
import { VehicleService } from '../../services/vehicle';

interface TransactionHistoryProps {
  vehicleId?: string;
  limit?: number;
  className?: string;
}

interface BlockchainTransaction {
  id: string;
  type: 'vehicle_registration' | 'mileage_update' | 'document_upload' | 'wallet_creation';
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  data: any;
  vehicleId?: string;
  vehicleVin?: string;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  vehicleId,
  limit = 10,
  className = ''
}) => {
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch transaction history
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (vehicleId) {
        // Get transactions for specific vehicle
        response = await VehicleService.getVehicleBlockchainHistory(vehicleId);
      } else {
        // Get all user transactions
        response = await BlockchainService.getTransactionHistory({ limit });
      }

      setTransactions(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch transaction history:', err);
      setError(err.response?.data?.message || 'Failed to load transaction history');
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

  // Get transaction type icon
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'vehicle_registration':
        return <Car className="w-4 h-4" />;
      case 'mileage_update':
        return <Gauge className="w-4 h-4" />;
      case 'document_upload':
        return <FileText className="w-4 h-4" />;
      case 'wallet_creation':
        return <Hash className="w-4 h-4" />;
      default:
        return <Hash className="w-4 h-4" />;
    }
  };

  // Get transaction type display name
  const getTransactionTypeName = (type: string) => {
    switch (type) {
      case 'vehicle_registration':
        return 'Vehicle Registration';
      case 'mileage_update':
        return 'Mileage Update';
      case 'document_upload':
        return 'Document Upload';
      case 'wallet_creation':
        return 'Wallet Creation';
      default:
        return type;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format transaction hash for display
  const formatTransactionHash = (hash: string) => {
    if (!hash) return '';
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading transaction history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Transactions</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchTransactions}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <Hash className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Found</h3>
          <p className="text-gray-600">
            {vehicleId ? 'No blockchain transactions found for this vehicle.' : 'No blockchain transactions found.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Blockchain Transactions</h2>
            <p className="text-sm text-gray-600 mt-1">
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            title="Refresh transactions"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-gray-200">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    {getTransactionIcon(transaction.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {getTransactionTypeName(transaction.type)}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {getStatusIcon(transaction.status)}
                      <span className="ml-1 capitalize">{transaction.status}</span>
                    </span>
                  </div>
                  
                  {transaction.vehicleVin && (
                    <p className="text-sm text-gray-600 mb-1">
                      Vehicle: {transaction.vehicleVin}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>{formatDate(transaction.timestamp)}</span>
                    </div>
                    <div className="flex items-center">
                      <Hash className="w-3 h-3 mr-1" />
                      <span className="font-mono">{formatTransactionHash(transaction.transactionHash)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <a
                  href={BlockchainService.getSolanaExplorerUrl(transaction.transactionHash, 'devnet')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View on Explorer
                </a>
              </div>
            </div>
            
            {/* Transaction Data */}
            {transaction.data && (
              <div className="mt-3 pl-13">
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Transaction Data</h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    {transaction.type === 'vehicle_registration' && (
                      <>
                        <div>VIN: {transaction.data.vin}</div>
                        <div>Make: {transaction.data.make}</div>
                        <div>Model: {transaction.data.model}</div>
                        <div>Year: {transaction.data.year}</div>
                        <div>Initial Mileage: {transaction.data.initialMileage?.toLocaleString()} miles</div>
                      </>
                    )}
                    {transaction.type === 'mileage_update' && (
                      <>
                        <div>New Mileage: {transaction.data.mileage?.toLocaleString()} miles</div>
                        <div>Location: {transaction.data.location}</div>
                        <div>Source: {transaction.data.source}</div>
                        {transaction.data.notes && <div>Notes: {transaction.data.notes}</div>}
                      </>
                    )}
                    {transaction.type === 'document_upload' && (
                      <>
                        <div>File Type: {transaction.data.fileType}</div>
                        <div>File Size: {transaction.data.fileSize}</div>
                        <div>Document Type: {transaction.data.documentType}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionHistory;
