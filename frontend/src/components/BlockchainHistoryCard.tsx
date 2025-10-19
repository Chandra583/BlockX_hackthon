import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Hash, Calendar, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import VehicleBlockchainService from '../services/vehicleBlockchain';
import { VehicleBlockchainTransaction } from '../types/blockchain';
import { solanaHelper } from '../lib/solana';
import toast from 'react-hot-toast';

interface BlockchainHistoryCardProps {
  vehicleId: string;
  className?: string;
}

export const BlockchainHistoryCard: React.FC<BlockchainHistoryCardProps> = ({
  vehicleId,
  className = ''
}) => {
  const [transactions, setTransactions] = useState<VehicleBlockchainTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBlockchainHistory = async () => {
    try {
      setLoading(true);
      const response = await VehicleBlockchainService.getVehicleBlockchainHistory(vehicleId);
      
      if (response.success) {
        setTransactions(response.data.transactions);
      }
    } catch (error) {
      console.error('Failed to fetch blockchain history:', error);
      toast.error('Failed to load blockchain history');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBlockchainHistory();
    setRefreshing(false);
    toast.success('Blockchain history refreshed');
  };

  useEffect(() => {
    if (vehicleId) {
      fetchBlockchainHistory();
    }
  }, [vehicleId]);

  const truncateHash = (hash: string) => {
    if (hash.length <= 16) return hash;
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
      >
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="ml-2 text-gray-500">Loading blockchain history...</span>
        </div>
      </motion.div>
    );
  }

  if (transactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Blockchain History</h2>
        <div className="text-center py-8">
          <Hash className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No blockchain transactions found</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Hash className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Blockchain History</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {transactions.length} {transactions.length === 1 ? 'Transaction' : 'Transactions'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="space-y-3">
            {transactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${VehicleBlockchainService.getTransactionTypeColor(tx.type)}`}>
                        {VehicleBlockchainService.getTransactionTypeLabel(tx.type)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {tx.network}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <Hash className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-mono text-gray-700">{truncateHash(tx.hash)}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(tx.hash);
                          toast.success('Transaction hash copied!');
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy hash"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>

                    {tx.metadata && Object.keys(tx.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-gray-600 space-y-1">
                        {tx.metadata.deviceId && (
                          <div>Device: <span className="font-medium">{tx.metadata.deviceId}</span></div>
                        )}
                        {tx.metadata.mileage !== undefined && (
                          <div>Mileage: <span className="font-medium">{tx.metadata.mileage.toLocaleString()} miles</span></div>
                        )}
                        {tx.metadata.ownerName && (
                          <div>Owner: <span className="font-medium">{tx.metadata.ownerName}</span></div>
                        )}
                        {tx.metadata.serviceProviderName && (
                          <div>Service Provider: <span className="font-medium">{tx.metadata.serviceProviderName}</span></div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </div>
                    <button
                      onClick={() => window.open(solanaHelper.getExplorerUrl(tx.hash, 'tx'), '_blank', 'noopener,noreferrer')}
                      className="inline-flex items-center px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BlockchainHistoryCard;

