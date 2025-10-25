import React from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, XCircle, AlertTriangle, Clock, Gauge } from 'lucide-react';

interface OBDValidationData {
  deviceID: string;
  status: 'obd_connected' | 'device_not_connected' | 'error' | 'discovery_mode';
  validationStatus: 'VALID' | 'INVALID' | 'SUSPICIOUS' | 'IMPOSSIBLE_DISTANCE' | 'PENDING';
  lastReading: {
    mileage: number;
    speed: number;
    rpm: number;
    engineTemp: number;
    fuelLevel: number;
    dataQuality: number;
    recordedAt: string;
  } | null;
  tamperingDetected: boolean;
  fraudScore: number;
}

interface OBDDataValidationCardProps {
  validationData: OBDValidationData | null;
  loading?: boolean;
}

export const OBDDataValidationCard: React.FC<OBDDataValidationCardProps> = ({ validationData, loading }) => {
  const getValidationStatusBadge = (status: string) => {
    switch (status) {
      case 'VALID':
        return (
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">Valid</span>
          </div>
        );
      case 'INVALID':
        return (
          <div className="flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-800 rounded-full">
            <XCircle className="w-4 h-4" />
            <span className="font-medium">Invalid</span>
          </div>
        );
      case 'SUSPICIOUS':
        return (
          <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Suspicious</span>
          </div>
        );
      case 'IMPOSSIBLE_DISTANCE':
        return (
          <div className="flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-800 rounded-full">
            <XCircle className="w-4 h-4" />
            <span className="font-medium">Impossible Distance</span>
          </div>
        );
      case 'ROLLBACK_DETECTED':
        return (
          <div className="flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-800 rounded-full">
            <XCircle className="w-4 h-4" />
            <span className="font-medium">Odometer Rollback</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
            <Clock className="w-4 h-4" />
            <span className="font-medium">Pending</span>
          </div>
        );
    }
  };

  const getDeviceStatusColor = (status: string) => {
    switch (status) {
      case 'obd_connected':
        return 'text-green-600';
      case 'device_not_connected':
        return 'text-gray-500';
      case 'error':
        return 'text-red-600';
      case 'discovery_mode':
        return 'text-yellow-600';
      default:
        return 'text-gray-500';
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
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!validationData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No OBD data available</p>
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
          <Activity className={`w-6 h-6 ${getDeviceStatusColor(validationData.status)}`} />
          <h3 className="text-lg font-semibold text-gray-900">Recent OBD Data</h3>
        </div>
        {getValidationStatusBadge(validationData.validationStatus)}
      </div>

      {/* Device Status */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Device ID:</span>
          <span className="font-medium">{validationData.deviceID}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-gray-600">Status:</span>
          <span className={`font-medium capitalize ${getDeviceStatusColor(validationData.status)}`}>
            {validationData.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Latest Reading */}
      {validationData.lastReading && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Gauge className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-gray-600">Mileage</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{validationData.lastReading.mileage} km</p>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Activity className="w-4 h-4 text-green-600" />
                <span className="text-xs text-gray-600">Speed</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{validationData.lastReading.speed} km/h</p>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg">
              <span className="text-xs text-gray-600">RPM</span>
              <p className="text-lg font-bold text-gray-900">{validationData.lastReading.rpm}</p>
            </div>

            <div className="p-3 bg-orange-50 rounded-lg">
              <span className="text-xs text-gray-600">Engine Temp</span>
              <p className="text-lg font-bold text-gray-900">{validationData.lastReading.engineTemp}°C</p>
            </div>

            <div className="p-3 bg-yellow-50 rounded-lg">
              <span className="text-xs text-gray-600">Fuel Level</span>
              <p className="text-lg font-bold text-gray-900">{validationData.lastReading.fuelLevel}%</p>
            </div>

            <div className="p-3 bg-indigo-50 rounded-lg">
              <span className="text-xs text-gray-600">Data Quality</span>
              <p className="text-lg font-bold text-gray-900">{validationData.lastReading.dataQuality}%</p>
            </div>
          </div>

          {/* Tampering Warning */}
          {validationData.tamperingDetected && (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-900">Tampering Detected!</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Suspicious data pattern detected. Fraud score: {validationData.fraudScore}%
              </p>
            </motion.div>
          )}

          {/* Last Updated */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Last updated</span>
            </div>
            <span className="text-xs text-gray-600">{formatDate(validationData.lastReading.recordedAt)}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default OBDDataValidationCard;
