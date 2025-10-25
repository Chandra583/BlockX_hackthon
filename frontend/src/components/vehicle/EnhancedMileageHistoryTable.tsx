import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Clock, TrendingUp, Calendar, Car, Eye, Copy, ExternalLink, Shield } from 'lucide-react';

interface MileageRecord {
  id: string;
  mileage: number;
  recordedAt: string;
  source?: string;
  verified?: boolean;
  deviceId?: string;
  blockchainHash?: string;
  validationStatus?: 'VALID' | 'INVALID' | 'SUSPICIOUS' | 'IMPOSSIBLE_DISTANCE' | 'PENDING';
  tamperingDetected?: boolean;
}

interface EnhancedMileageHistoryTableProps {
  records: MileageRecord[];
  onCopyHash?: (hash: string) => void;
  copiedHash?: string | null;
}

export const EnhancedMileageHistoryTable: React.FC<EnhancedMileageHistoryTableProps> = ({
  records,
  onCopyHash,
  copiedHash
}) => {
  const getValidationBadge = (status?: string, tampering?: boolean) => {
    if (tampering) {
      return (
        <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
          <XCircle className="w-3 h-3" />
          <span>Tampered</span>
        </div>
      );
    }

    switch (status) {
      case 'VALID':
        return (
          <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            <span>Valid</span>
          </div>
        );
      case 'INVALID':
        return (
          <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
            <XCircle className="w-3 h-3" />
            <span>Invalid</span>
          </div>
        );
      case 'SUSPICIOUS':
        return (
          <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
            <AlertTriangle className="w-3 h-3" />
            <span>Suspicious</span>
          </div>
        );
      case 'IMPOSSIBLE_DISTANCE':
        return (
          <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
            <XCircle className="w-3 h-3" />
            <span>Impossible</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </div>
        );
    }
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'automated':
      case 'obd_device':
        return <Car className="w-3 h-3 text-blue-500" />;
      case 'owner':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'service':
        return <Eye className="w-3 h-3 text-orange-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-500" />;
    }
  };

  const getSourceColor = (source?: string) => {
    switch (source) {
      case 'automated':
      case 'obd_device':
        return 'bg-blue-100 text-blue-800';
      case 'owner':
        return 'bg-green-100 text-green-800';
      case 'service':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSolanaExplorerUrl = (txHash: string) => {
    const cluster = import.meta.env.VITE_SOLANA_CLUSTER || 'devnet';
    return `https://explorer.solana.com/tx/${txHash}?cluster=${cluster}`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b-2 border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Mileage
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Change
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Validation
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Date & Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Source
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Blockchain
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {records.map((record, index) => {
            const prevMileage = index < records.length - 1 ? records[index + 1].mileage : 0;
            const delta = record.mileage - prevMileage;
            const formattedDate = new Date(record.recordedAt).toLocaleDateString();
            const formattedTime = new Date(record.recordedAt).toLocaleTimeString();

            return (
              <motion.tr
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="hover:bg-gray-50 transition-colors"
              >
                {/* Mileage */}
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <span className="text-sm font-semibold text-gray-900">
                      {record.mileage.toLocaleString()} km
                    </span>
                    {record.verified && (
                      <CheckCircle className="w-3 h-3 text-green-500 ml-1" />
                    )}
                  </div>
                </td>

                {/* Delta */}
                <td className="px-4 py-3">
                  {delta !== 0 ? (
                    <div className={`flex items-center text-xs ${
                      delta > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp 
                        className={`w-3 h-3 mr-1 ${delta < 0 ? 'rotate-180' : ''}`} 
                      />
                      <span className="font-medium">
                        {delta > 0 ? '+' : ''}{delta} km
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>

                {/* Validation Status */}
                <td className="px-4 py-3">
                  {getValidationBadge(record.validationStatus, record.tamperingDetected)}
                </td>

                {/* Date & Time */}
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 text-gray-400 mr-1" />
                    <div>
                      <div className="text-xs font-medium text-gray-900">{formattedDate}</div>
                      <div className="text-xs text-gray-500">{formattedTime}</div>
                    </div>
                  </div>
                </td>

                {/* Source */}
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    {getSourceIcon(record.source)}
                    <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${getSourceColor(record.source)}`}>
                      {record.source || 'unknown'}
                    </span>
                  </div>
                </td>

                {/* Blockchain */}
                <td className="px-4 py-3">
                  {record.blockchainHash ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onCopyHash?.(record.blockchainHash!)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Copy hash"
                      >
                        {copiedHash === record.blockchainHash ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <a
                        href={getSolanaExplorerUrl(record.blockchainHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="View on Solana Explorer"
                      >
                        <ExternalLink className="w-4 h-4 text-blue-500" />
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Not on chain</span>
                  )}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default EnhancedMileageHistoryTable;

