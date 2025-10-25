import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, User, ExternalLink, Copy, AlertTriangle, Shield, Clock, Zap } from 'lucide-react';

interface TrustEvent {
  _id: string;
  change: number;
  previousScore: number;
  newScore: number;
  reason: string;
  source: string;
  createdAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
  details: {
    telemetryId?: string;
    installId?: string;
    solanaTx?: string;
    arweaveTx?: string;
    reportedMileage?: number;
    previousMileage?: number;
    deviceId?: string;
    fraudAlertId?: string;
  };
}

interface TrustEventDetailProps {
  event: TrustEvent;
  isOpen: boolean;
  onClose: () => void;
}

export const TrustEventDetail: React.FC<TrustEventDetailProps> = ({
  event,
  isOpen,
  onClose
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getChangeIcon = (change: number) => {
    return change > 0 ? (
      <TrendingUp className="w-6 h-6 text-emerald-500" />
    ) : (
      <TrendingDown className="w-6 h-6 text-red-500" />
    );
  };

  const getChangeColor = (change: number) => {
    return change > 0 ? 'text-emerald-600' : 'text-red-600';
  };

  const getSourceLabel = (source: string) => {
    const labels = {
      telemetry: 'OBD Device',
      admin: 'Admin',
      manual: 'Manual',
      fraudEngine: 'Fraud Detection',
      anchor: 'Blockchain'
    };
    return labels[source as keyof typeof labels] || source;
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'fraudEngine':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'telemetry':
        return <Zap className="w-5 h-5 text-blue-500" />;
      case 'anchor':
        return <Shield className="w-5 h-5 text-purple-500" />;
      default:
        return <User className="w-5 h-5 text-gray-500" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-md" 
                onClick={onClose}
              />
            </motion.div>

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative inline-block align-bottom bg-white/98 backdrop-blur-xl rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full border-2 border-white/40 ring-4 ring-white/20"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-6 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"
                    >
                      {getChangeIcon(event.change)}
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Trust Event Details</h3>
                      <p className="text-blue-100 text-sm">{formatDate(event.createdAt)}</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </motion.button>
                </div>
              </div>

              <div className="px-6 py-6 space-y-6">
                {/* Score Change Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200/60"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-2">Score Change</p>
                      <div className="flex items-center space-x-3">
                        {getChangeIcon(event.change)}
                        <p className={`text-4xl font-black ${getChangeColor(event.change)}`}>
                          {event.change > 0 ? '+' : ''}{event.change}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-2">Previous → New</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-gray-700">{event.previousScore}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-2xl font-bold text-gray-900">{event.newScore}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Event Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Reason */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/60"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <AlertTriangle className="w-5 h-5 text-blue-500" />
                      <p className="text-sm font-semibold text-gray-700">Reason</p>
                    </div>
                    <p className="text-gray-900 font-medium">{event.reason}</p>
                  </motion.div>

                  {/* Source */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/60"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      {getSourceIcon(event.source)}
                      <p className="text-sm font-semibold text-gray-700">Source</p>
                    </div>
                    <p className="text-gray-900 font-medium">{getSourceLabel(event.source)}</p>
                  </motion.div>
                </div>

                {/* Created By */}
                {event.createdBy && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/60"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <User className="w-5 h-5 text-purple-500" />
                      <p className="text-sm font-semibold text-gray-700">Created By</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {event.createdBy.firstName[0]}{event.createdBy.lastName[0]}
                        </span>
                      </div>
                      <span className="text-gray-900 font-medium">
                        {event.createdBy.firstName} {event.createdBy.lastName}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Related Data */}
                {(event.details.telemetryId || event.details.solanaTx || event.details.arweaveTx) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/60"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <Shield className="w-5 h-5 text-green-500" />
                      <p className="text-sm font-semibold text-gray-700">Related Data</p>
                    </div>
                    <div className="space-y-3">
                      {event.details.telemetryId && (
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="flex items-center justify-between bg-blue-50 rounded-xl p-4 border border-blue-200"
                        >
                          <div className="flex items-center space-x-3">
                            <Zap className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Telemetry Record</span>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => copyToClipboard(event.details.telemetryId!)}
                            className="p-2 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            <Copy className="w-4 h-4 text-blue-600" />
                          </motion.button>
                        </motion.div>
                      )}
                      {event.details.solanaTx && (
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="flex items-center justify-between bg-purple-50 rounded-xl p-4 border border-purple-200"
                        >
                          <div className="flex items-center space-x-3">
                            <Shield className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-800">Solana Transaction</span>
                          </div>
                          <motion.a
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            href={`https://explorer.solana.com/tx/${event.details.solanaTx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 text-purple-600" />
                          </motion.a>
                        </motion.div>
                      )}
                      {event.details.arweaveTx && (
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="flex items-center justify-between bg-green-50 rounded-xl p-4 border border-green-200"
                        >
                          <div className="flex items-center space-x-3">
                            <Shield className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Arweave Transaction</span>
                          </div>
                          <motion.a
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            href={`https://viewblock.io/arweave/tx/${event.details.arweaveTx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 text-green-600" />
                          </motion.a>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Mileage Details */}
                {(event.details.reportedMileage || event.details.previousMileage) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-5 border border-yellow-200"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <p className="text-sm font-semibold text-yellow-800">Mileage Anomaly Detected</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white/60 rounded-xl p-3">
                        <p className="text-xs text-yellow-700 font-medium mb-1">Previous Mileage</p>
                        <p className="text-lg font-bold text-yellow-900">{event.details.previousMileage} km</p>
                      </div>
                      <div className="bg-white/60 rounded-xl p-3">
                        <p className="text-xs text-yellow-700 font-medium mb-1">Reported Mileage</p>
                        <p className="text-lg font-bold text-yellow-900">{event.details.reportedMileage} km</p>
                      </div>
                      <div className="bg-white/60 rounded-xl p-3">
                        <p className="text-xs text-yellow-700 font-medium mb-1">Device ID</p>
                        <p className="text-lg font-bold text-yellow-900">{event.details.deviceId}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200/60">
                <div className="flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Close Details
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};