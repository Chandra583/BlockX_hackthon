import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, Minus, Activity, Hash, Copy, ExternalLink } from 'lucide-react';
import type { TelemetryBatch } from '../../../services/report';
import toast from 'react-hot-toast';

interface ReportBatchesProps {
  batches: TelemetryBatch[];
}

export const ReportBatches: React.FC<ReportBatchesProps> = ({ batches }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'anchored':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'anchored':
        return 'bg-green-600/20 text-green-400 border-green-600/30';
      case 'pending':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
      case 'failed':
        return 'bg-red-600/20 text-red-400 border-red-600/30';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50"
    >
      <div className="flex items-center mb-6">
        <div className="p-4 bg-purple-600/20 rounded-2xl mr-6">
          <Activity className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Last 10 OBD Telemetry Batches</h3>
          <p className="text-gray-300">Recent vehicle data recordings and blockchain status</p>
        </div>
      </div>

      {batches.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h4 className="text-xl font-semibold text-gray-400 mb-2">No OBD Data Available</h4>
          <p className="text-gray-500">No telemetry batches have been recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-4 px-2 text-gray-300 font-semibold">Recorded At</th>
                <th className="text-left py-4 px-2 text-gray-300 font-semibold">Device ID</th>
                <th className="text-left py-4 px-2 text-gray-300 font-semibold">Start Mileage</th>
                <th className="text-left py-4 px-2 text-gray-300 font-semibold">End Mileage</th>
                <th className="text-left py-4 px-2 text-gray-300 font-semibold">Distance</th>
                <th className="text-left py-4 px-2 text-gray-300 font-semibold">Blockchain Hash</th>
                <th className="text-left py-4 px-2 text-gray-300 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch, index) => (
                <motion.tr
                  key={batch.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                >
                  <td className="py-4 px-2 text-white">
                    {new Date(batch.recordedAt).toLocaleDateString()}
                    <br />
                    <span className="text-gray-400 text-sm">
                      {new Date(batch.recordedAt).toLocaleTimeString()}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-white font-mono text-sm">
                    {batch.deviceId}
                  </td>
                  <td className="py-4 px-2 text-white">
                    {batch.startMileage.toLocaleString()} km
                  </td>
                  <td className="py-4 px-2 text-white">
                    {batch.endMileage.toLocaleString()} km
                  </td>
                  <td className="py-4 px-2 text-white">
                    {batch.distance > 0 ? '+' : ''}{batch.distance} km
                  </td>
                  <td className="py-4 px-2">
                    {batch.blockchainHash ? (
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 font-mono text-sm">
                          {batch.blockchainHash.slice(0, 8)}...
                        </span>
                        <button
                          onClick={() => copyToClipboard(batch.blockchainHash!, 'Blockchain hash')}
                          className="p-1 hover:bg-slate-600 rounded"
                        >
                          <Copy className="w-3 h-3 text-gray-400" />
                        </button>
                        <a
                          href={`https://explorer.solana.com/tx/${batch.blockchainHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-slate-600 rounded"
                        >
                          <ExternalLink className="w-3 h-3 text-blue-400" />
                        </a>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Not anchored yet</span>
                    )}
                  </td>
                  <td className="py-4 px-2">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(batch.status)}`}>
                      {getStatusIcon(batch.status)}
                      <span className="text-sm font-medium capitalize">{batch.status}</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Stats */}
      {batches.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-700/30 rounded-xl">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-gray-300 text-sm">Anchored</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {batches.filter(b => b.status === 'anchored').length}
            </p>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-xl">
            <div className="flex items-center mb-2">
              <Clock className="w-5 h-5 text-yellow-400 mr-2" />
              <span className="text-gray-300 text-sm">Pending</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {batches.filter(b => b.status === 'pending').length}
            </p>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-xl">
            <div className="flex items-center mb-2">
              <Activity className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-gray-300 text-sm">Total Data Points</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {batches.reduce((sum, b) => sum + b.dataPoints, 0)}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};
