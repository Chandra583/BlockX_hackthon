import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Car,
  Calendar,
  Hash,
  Eye
} from 'lucide-react';

interface MileageRecord {
  _id: string;
  vehicleId: string;
  vin: string;
  mileage: number;
  recordedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
    fullName: string;
    isLocked: boolean;
    id: string;
  };
  recordedAt: string;
  source: string;
  notes: string;
  verified: boolean;
  deviceId: string;
  createdAt: string;
  updatedAt: string;
  blockchainHash?: string;
}

interface MileageHistoryData {
  vehicleId: string;
  vin: string;
  currentMileage: number;
  totalMileage: number;
  registeredMileage: number;
  serviceVerifiedMileage: number;
  lastOBDUpdate: {
    mileage: number;
    deviceId: string;
    recordedAt: string;
  };
  history: MileageRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface MileageHistoryTableProps {
  data: MileageHistoryData;
  onRefresh?: () => void;
}

export const MileageHistoryTable: React.FC<MileageHistoryTableProps> = ({ data, onRefresh }) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'mileage'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterSource, setFilterSource] = useState<string>('all');

  // Sort and filter data
  const sortedHistory = [...data.history]
    .sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.recordedAt).getTime();
        const dateB = new Date(b.recordedAt).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        return sortOrder === 'asc' ? a.mileage - b.mileage : b.mileage - a.mileage;
      }
    })
    .filter(record => filterSource === 'all' || record.source === filterSource);

  const copyToClipboard = async (text: string, hash: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getSolanaExplorerUrl = (txHash: string) => {
    const cluster = import.meta.env.VITE_SOLANA_CLUSTER || 'devnet';
    return `https://explorer.solana.com/tx/${txHash}?cluster=${cluster}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })
    };
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'automated':
        return <Car className="w-4 h-4 text-blue-500" />;
      case 'owner':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'service':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'inspection':
        return <Eye className="w-4 h-4 text-purple-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'automated':
        return 'bg-blue-100 text-blue-800';
      case 'owner':
        return 'bg-green-100 text-green-800';
      case 'service':
        return 'bg-orange-100 text-orange-800';
      case 'inspection':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateMileageDelta = (current: number, previous: number) => {
    return current - previous;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Mileage History</h2>
            <p className="text-blue-100 text-sm mt-1">
              Complete blockchain-verified mileage records
            </p>
          </div>
          <div className="flex items-center space-x-4 text-white">
            <div className="text-right">
              <div className="text-2xl font-bold">{data.currentMileage} km</div>
              <div className="text-blue-100 text-sm">Current Mileage</div>
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors"
              >
                <Clock className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'mileage')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Date</option>
              <option value="mileage">Mileage</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <TrendingUp className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sources</option>
              <option value="automated">OBD Device</option>
              <option value="owner">Owner</option>
              <option value="service">Service</option>
              <option value="inspection">Inspection</option>
            </select>
          </div>

          {/* Stats */}
          <div className="ml-auto text-sm text-gray-600">
            Showing {sortedHistory.length} of {data.pagination.total} records
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mileage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Device
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction Hash
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedHistory.map((record, index) => {
              const previousRecord = index < sortedHistory.length - 1 ? sortedHistory[index + 1] : null;
              const delta = previousRecord ? calculateMileageDelta(record.mileage, previousRecord.mileage) : 0;
              const { date, time } = formatDate(record.recordedAt);
              const isPositiveDelta = delta > 0;
              const isNegativeDelta = delta < 0;

              return (
                <motion.tr
                  key={record._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Mileage */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {record.mileage.toLocaleString()} km
                      </div>
                      {record.verified && (
                        <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                      )}
                    </div>
                  </td>

                  {/* Delta */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {delta !== 0 && (
                      <div className={`flex items-center ${
                        isPositiveDelta ? 'text-green-600' : 
                        isNegativeDelta ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        <TrendingUp 
                          className={`w-4 h-4 mr-1 ${
                            isNegativeDelta ? 'rotate-180' : ''
                          }`} 
                        />
                        <span className="font-medium">
                          {isPositiveDelta ? '+' : ''}{delta} km
                        </span>
                      </div>
                    )}
                    {delta === 0 && (
                      <span className="text-gray-400 text-sm">No change</span>
                    )}
                  </td>

                  {/* Date & Time */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{date}</div>
                        <div className="text-sm text-gray-500">{time}</div>
                      </div>
                    </div>
                  </td>

                  {/* Source */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getSourceIcon(record.source)}
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getSourceColor(record.source)}`}>
                        {record.source}
                      </span>
                    </div>
                  </td>

                  {/* Device */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Car className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-mono text-gray-600">
                        {record.deviceId}
                      </span>
                    </div>
                  </td>

                  {/* Transaction Hash */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.blockchainHash ? (
                      <div className="flex items-center">
                        <Hash className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-mono text-gray-600 max-w-32 truncate">
                          {record.blockchainHash.slice(0, 8)}...{record.blockchainHash.slice(-8)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(record.blockchainHash!, record._id)}
                          className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          {copiedHash === record._id ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No hash</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.blockchainHash && (
                      <a
                        href={getSolanaExplorerUrl(record.blockchainHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm font-medium rounded-md transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View on Explorer
                      </a>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {data.pagination.page} of {data.pagination.pages} 
            ({data.pagination.total} total records)
          </div>
          <div className="text-sm text-gray-600">
            Last updated: {formatDate(data.lastOBDUpdate.recordedAt).date} at {formatDate(data.lastOBDUpdate.recordedAt).time}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MileageHistoryTable;
