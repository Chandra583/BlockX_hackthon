import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import type { RollbackEvent } from '../../../services/report';

interface ReportRollbackListProps {
  events: RollbackEvent[];
}

export const ReportRollbackList: React.FC<ReportRollbackListProps> = ({ events }) => {
  const getResolutionIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'investigating':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'unresolved':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getResolutionColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-600/20 text-green-400 border-green-600/30';
      case 'investigating':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
      case 'unresolved':
        return 'bg-red-600/20 text-red-400 border-red-600/30';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50"
    >
      <div className="flex items-center mb-6">
        <div className="p-4 bg-red-600/20 rounded-2xl mr-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Rollback / Fraud Summary</h3>
          <p className="text-gray-300">Detected mileage anomalies and fraud events</p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h4 className="text-xl font-semibold text-green-400 mb-2">No Fraud Detected</h4>
          <p className="text-gray-500">No rollback events or fraud alerts have been detected for this vehicle.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="p-6 bg-slate-700/30 rounded-xl border border-red-600/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <TrendingDown className="w-6 h-6 text-red-400 mr-3" />
                  <div>
                    <h4 className="text-lg font-semibold text-white">Mileage Rollback Detected</h4>
                    <p className="text-gray-400 text-sm">
                      {new Date(event.timestamp).toLocaleDateString()} at {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getResolutionColor(event.resolutionStatus)}`}>
                  {getResolutionIcon(event.resolutionStatus)}
                  <span className="text-sm font-medium capitalize">{event.resolutionStatus}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="p-3 bg-slate-600/30 rounded-lg">
                  <span className="text-gray-400 text-sm block">Previous Mileage</span>
                  <p className="text-white font-semibold">{event.prevMileage.toLocaleString()} km</p>
                </div>
                <div className="p-3 bg-slate-600/30 rounded-lg">
                  <span className="text-gray-400 text-sm block">New Mileage</span>
                  <p className="text-white font-semibold">{event.newMileage.toLocaleString()} km</p>
                </div>
                <div className="p-3 bg-red-600/20 rounded-lg border border-red-600/30">
                  <span className="text-red-400 text-sm block">Delta Change</span>
                  <p className="text-red-400 font-semibold">{event.deltaKm} km</p>
                </div>
                <div className="p-3 bg-slate-600/30 rounded-lg">
                  <span className="text-gray-400 text-sm block">Detection Reason</span>
                  <p className="text-white font-semibold text-sm">{event.detectionReason}</p>
                </div>
              </div>

              {event.resolvedBy && (
                <div className="flex items-center text-sm text-gray-400">
                  <User className="w-4 h-4 mr-2" />
                  <span>Resolved by: {event.resolvedBy}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {events.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-red-600/20 rounded-xl border border-red-600/30">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-gray-300 text-sm">Total Rollbacks</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{events.length}</p>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-xl">
            <div className="flex items-center mb-2">
              <TrendingDown className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-gray-300 text-sm">Total Mileage Lost</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {Math.abs(events.reduce((sum, e) => sum + e.deltaKm, 0))} km
            </p>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-xl">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-gray-300 text-sm">Resolved Events</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {events.filter(e => e.resolutionStatus === 'resolved').length}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};
