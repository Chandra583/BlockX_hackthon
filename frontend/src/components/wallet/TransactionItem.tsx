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
import type { WalletTransaction } from '../../services/wallet';
import { toast } from 'react-hot-toast';

interface TransactionItemProps {
  transaction: WalletTransaction;
  onViewDetails?: (transaction: WalletTransaction) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onViewDetails
}) => {
  const [copied] = useState(false);

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
