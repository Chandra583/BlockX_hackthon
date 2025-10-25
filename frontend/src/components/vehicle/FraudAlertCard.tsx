import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, CheckCircle, XCircle, Clock } from 'lucide-react';

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
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <Shield className="w-5 h-5 text-blue-600" />;
      default:
        return <Shield className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Active</span>;
      case 'resolved':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Resolved</span>;
      case 'investigating':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Investigating</span>;
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">Fraud Alerts</h3>
        </div>
        {alerts.length > 0 && (
          <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full">
            {alerts.length} Alert{alerts.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No Fraud Alerts</p>
          <p className="text-sm text-gray-500 mt-1">All vehicle data is validated and secure</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`p-4 rounded-lg border-2 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900">{alert.type}</p>
                      {getStatusBadge(alert.status)}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                    
                    {alert.details && (
                      <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs space-y-1">
                        {alert.details.expectedValue !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Expected:</span>
                            <span className="font-medium">{alert.details.expectedValue} km</span>
                          </div>
                        )}
                        {alert.details.actualValue !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Actual:</span>
                            <span className="font-medium">{alert.details.actualValue} km</span>
                          </div>
                        )}
                        {alert.details.reason && (
                          <div className="mt-1 pt-1 border-t border-gray-300">
                            <span className="text-gray-600">Reason:</span>
                            <span className="ml-1 font-medium">{alert.details.reason}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(alert.detectedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default FraudAlertCard;

