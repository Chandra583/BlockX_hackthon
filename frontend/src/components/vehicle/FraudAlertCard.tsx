import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, CheckCircle, XCircle, Clock, TrendingDown, AlertCircle, Zap } from 'lucide-react';

interface FraudAlert {
  id: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  detectedAt: string;
  status: 'active' | 'resolved' | 'investigating';
  details?: {
    expectedValue?: number;
    actualValue?: number;
    reason?: string;
  };
}

interface FraudAlertCardProps {
  alerts: FraudAlert[];
  loading?: boolean;
}

export const FraudAlertCard: React.FC<FraudAlertCardProps> = ({ alerts, loading }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-800 border-red-300/50 backdrop-blur-sm';
      case 'medium':
        return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-800 border-yellow-300/50 backdrop-blur-sm';
      case 'low':
        return 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-800 border-blue-300/50 backdrop-blur-sm';
      default:
        return 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-800 border-gray-300/50 backdrop-blur-sm';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <motion.div
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
          <XCircle className="w-6 h-6 text-red-600" />
        </motion.div>;
      case 'medium':
        return <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <AlertTriangle className="w-6 h-6 text-yellow-600" />
        </motion.div>;
      case 'low':
        return <Shield className="w-6 h-6 text-blue-600" />;
      default:
        return <Shield className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <motion.span 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full shadow-lg"
        >
          Active
        </motion.span>;
      case 'resolved':
        return <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-lg">Resolved</span>;
      case 'investigating':
        return <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full shadow-lg">Investigating</span>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative bg-white/60 backdrop-blur-xl rounded-3xl border-2 border-white/40 p-8 shadow-2xl overflow-hidden"
      >
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/40 rounded-2xl w-1/3"></div>
          <div className="h-24 bg-white/40 rounded-2xl"></div>
          <div className="h-24 bg-white/40 rounded-2xl"></div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative bg-white/60 backdrop-blur-xl rounded-3xl border-2 border-white/40 p-8 shadow-2xl overflow-hidden"
    >
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 opacity-10"
        animate={{
          background: [
            "linear-gradient(45deg, #ef4444 0%, #dc2626 100%)",
            "linear-gradient(45deg, #dc2626 0%, #b91c1c 100%)",
            "linear-gradient(45deg, #b91c1c 0%, #ef4444 100%)"
          ]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-lg"
            >
              <Shield className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Fraud Alerts</h3>
              <p className="text-gray-600">Security monitoring & detection</p>
            </div>
          </div>
          {alerts.length > 0 && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl shadow-lg font-bold"
            >
              {alerts.length} Alert{alerts.length !== 1 ? 's' : ''}
            </motion.div>
          )}
        </div>

        {alerts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-12"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">No Fraud Alerts</h4>
            <p className="text-gray-600 font-medium">All vehicle data is validated and secure</p>
            <p className="text-sm text-gray-500 mt-2">System monitoring active</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className={`relative p-6 rounded-2xl border-2 backdrop-blur-sm shadow-lg ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <motion.div
                      whileHover={{ rotate: 10 }}
                      className="p-2 bg-white/60 rounded-xl shadow-sm"
                    >
                      {getSeverityIcon(alert.severity)}
                    </motion.div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-bold text-gray-900">{alert.type}</h4>
                        {getStatusBadge(alert.status)}
                      </div>
                      <p className="text-sm text-gray-700 mb-3 font-medium">{alert.message}</p>
                    
                      {alert.details && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ delay: 0.2 }}
                          className="mt-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 shadow-sm"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {alert.details.expectedValue !== undefined && (
                              <div className="flex items-center justify-between p-3 bg-white/40 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <TrendingDown className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium text-gray-700">Expected:</span>
                                </div>
                                <span className="font-bold text-gray-900">{alert.details.expectedValue.toLocaleString()} km</span>
                              </div>
                            )}
                            {alert.details.actualValue !== undefined && (
                              <div className="flex items-center justify-between p-3 bg-white/40 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                  <span className="text-sm font-medium text-gray-700">Actual:</span>
                                </div>
                                <span className="font-bold text-red-600">{alert.details.actualValue.toLocaleString()} km</span>
                              </div>
                            )}
                          </div>
                          {alert.details.reason && (
                            <div className="mt-4 p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border-l-4 border-red-500">
                              <div className="flex items-center space-x-2">
                                <Zap className="w-4 h-4 text-red-600" />
                                <span className="text-sm font-medium text-gray-700">Reason:</span>
                              </div>
                              <p className="text-sm text-gray-800 mt-1 font-medium">{alert.details.reason}</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                      
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center space-x-2 mt-4 p-3 bg-white/40 rounded-lg"
                      >
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 font-medium">{formatDate(alert.detectedAt)}</span>
                      </motion.div>
                    </div>
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

export default FraudAlertCard;

