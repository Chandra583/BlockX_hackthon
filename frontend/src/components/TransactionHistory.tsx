import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Clock, User, Car, Smartphone, Hash } from 'lucide-react';

interface TransactionHistoryProps {
  transactions: Array<{
    id: string;
    type: 'install_start' | 'install_complete';
    timestamp: string;
    solanaTx?: string;
    arweaveTx?: string;
    deviceId?: string;
    initialMileage?: number;
    ownerName?: string;
    serviceProviderName?: string;
    vehicleNumber?: string;
    vin?: string;
  }>;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'install_start':
        return <Smartphone className="w-4 h-4 text-blue-500" />;
      case 'install_complete':
        return <Hash className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'install_start':
        return 'bg-blue-100 text-blue-800';
      case 'install_complete':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTitle = (type: string) => {
    switch (type) {
      case 'install_start':
        return 'Installation Started';
      case 'install_complete':
        return 'Installation Completed';
      default:
        return 'Transaction';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h3>
      
      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No transactions recorded yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getTransactionIcon(transaction.type)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {getTransactionTitle(transaction.type)}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionColor(transaction.type)}`}>
                        {transaction.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="space-y-1">
                        {transaction.deviceId && (
                          <div className="flex items-center space-x-2">
                            <Smartphone className="w-4 h-4" />
                            <span>Device: {transaction.deviceId}</span>
                          </div>
                        )}
                        {transaction.initialMileage && (
                          <div className="flex items-center space-x-2">
                            <Hash className="w-4 h-4" />
                            <span>Mileage: {transaction.initialMileage} km</span>
                          </div>
                        )}
                        {transaction.ownerName && (
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>Owner: {transaction.ownerName}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {transaction.serviceProviderName && (
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>Service Provider: {transaction.serviceProviderName}</span>
                          </div>
                        )}
                        {transaction.vehicleNumber && (
                          <div className="flex items-center space-x-2">
                            <Car className="w-4 h-4" />
                            <span>Vehicle: {transaction.vehicleNumber}</span>
                          </div>
                        )}
                        {transaction.vin && (
                          <div className="flex items-center space-x-2">
                            <Hash className="w-4 h-4" />
                            <span>VIN: {transaction.vin}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-500">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(transaction.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {transaction.solanaTx && (
                    <button
                      onClick={() => window.open(`https://explorer.solana.com/tx/${transaction.solanaTx}`, '_blank')}
                      className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Solana
                    </button>
                  )}
                  {transaction.arweaveTx && (
                    <button
                      onClick={() => window.open(`https://arweave.net/${transaction.arweaveTx}`, '_blank')}
                      className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Arweave
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
