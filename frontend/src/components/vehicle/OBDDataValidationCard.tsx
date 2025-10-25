import React from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, XCircle, AlertTriangle, Clock, Gauge, Zap, TrendingUp, Thermometer, Fuel, Smartphone } from 'lucide-react';

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
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl shadow-lg font-bold"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Valid</span>
          </motion.div>
        );
      case 'INVALID':
        return (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl shadow-lg font-bold"
          >
            <XCircle className="w-5 h-5" />
            <span>Invalid</span>
          </motion.div>
        );
      case 'SUSPICIOUS':
        return (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl shadow-lg font-bold"
          >
            <AlertTriangle className="w-5 h-5" />
            <span>Suspicious</span>
          </motion.div>
        );
      case 'IMPOSSIBLE_DISTANCE':
        return (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl shadow-lg font-bold"
          >
            <XCircle className="w-5 h-5" />
            <span>Impossible Distance</span>
          </motion.div>
        );
      case 'ROLLBACK_DETECTED':
        return (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl shadow-lg font-bold"
          >
            <XCircle className="w-5 h-5" />
            <span>Odometer Rollback</span>
          </motion.div>
        );
      default:
        return (
          <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-500 to-slate-500 text-white rounded-2xl shadow-lg font-bold">
            <Clock className="w-5 h-5" />
            <span>Pending</span>
          </div>
        );
    }
  };

  const getDeviceStatusColor = (status: string) => {
    if (!status) return 'text-gray-500';
    
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
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative bg-white/60 backdrop-blur-xl rounded-3xl border-2 border-white/40 p-8 shadow-2xl overflow-hidden"
      >
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/40 rounded-2xl w-1/2"></div>
          <div className="h-32 bg-white/40 rounded-2xl"></div>
        </div>
      </motion.div>
    );
  }

  if (!validationData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative bg-white/60 backdrop-blur-xl rounded-3xl border-2 border-white/40 p-8 shadow-2xl overflow-hidden"
      >
        <div className="text-center py-12">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <Activity className="w-10 h-10 text-white" />
          </motion.div>
          <h4 className="text-xl font-bold text-gray-900 mb-2">No OBD Data Available</h4>
          <p className="text-gray-600 font-medium">Device not connected or no recent readings</p>
          <p className="text-sm text-gray-500 mt-2">Check device installation status</p>
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
            "linear-gradient(45deg, #3b82f6 0%, #1d4ed8 100%)",
            "linear-gradient(45deg, #1d4ed8 0%, #1e40af 100%)",
            "linear-gradient(45deg, #1e40af 0%, #3b82f6 100%)"
          ]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg"
            >
              <Activity className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Recent OBD Data</h3>
              <p className="text-gray-600">Real-time vehicle diagnostics</p>
            </div>
          </div>
          {getValidationStatusBadge(validationData.validationStatus || 'PENDING')}
        </div>

        {/* Device Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-white/40 rounded-xl">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Device ID:</span>
              </div>
              <span className="font-bold text-gray-900">{validationData.deviceID || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/40 rounded-xl">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Status:</span>
              </div>
              <span className={`font-bold capitalize ${getDeviceStatusColor(validationData.status)}`}>
                {validationData.status?.replace('_', ' ') || 'Unknown'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Latest Reading */}
        {validationData.lastReading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-2xl border border-blue-300/50 shadow-lg"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="p-2 bg-blue-500 rounded-xl"
                  >
                    <Gauge className="w-5 h-5 text-white" />
                  </motion.div>
                  <span className="text-sm font-bold text-gray-700">Mileage</span>
                </div>
                <p className="text-2xl font-black text-gray-900">{validationData.lastReading.mileage.toLocaleString()} km</p>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-2xl border border-green-300/50 shadow-lg"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="p-2 bg-green-500 rounded-xl"
                  >
                    <TrendingUp className="w-5 h-5 text-white" />
                  </motion.div>
                  <span className="text-sm font-bold text-gray-700">Speed</span>
                </div>
                <p className="text-2xl font-black text-gray-900">{validationData.lastReading.speed} km/h</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl border border-purple-300/50 shadow-lg"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="p-2 bg-purple-500 rounded-xl"
                  >
                    <Activity className="w-5 h-5 text-white" />
                  </motion.div>
                  <span className="text-sm font-bold text-gray-700">RPM</span>
                </div>
                <p className="text-2xl font-black text-gray-900">{validationData.lastReading.rpm.toLocaleString()}</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="p-4 bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm rounded-2xl border border-orange-300/50 shadow-lg"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="p-2 bg-orange-500 rounded-xl"
                  >
                    <Thermometer className="w-5 h-5 text-white" />
                  </motion.div>
                  <span className="text-sm font-bold text-gray-700">Engine Temp</span>
                </div>
                <p className="text-2xl font-black text-gray-900">{validationData.lastReading.engineTemp}°C</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm rounded-2xl border border-yellow-300/50 shadow-lg"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="p-2 bg-yellow-500 rounded-xl"
                  >
                    <Fuel className="w-5 h-5 text-white" />
                  </motion.div>
                  <span className="text-sm font-bold text-gray-700">Fuel Level</span>
                </div>
                <p className="text-2xl font-black text-gray-900">{validationData.lastReading.fuelLevel}%</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="p-4 bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 backdrop-blur-sm rounded-2xl border border-indigo-300/50 shadow-lg"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="p-2 bg-indigo-500 rounded-xl"
                  >
                    <Zap className="w-5 h-5 text-white" />
                  </motion.div>
                  <span className="text-sm font-bold text-gray-700">Data Quality</span>
                </div>
                <p className="text-2xl font-black text-gray-900">{validationData.lastReading.dataQuality}%</p>
              </motion.div>
            </div>

            {/* Tampering Warning */}
            {validationData.tamperingDetected && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="p-6 bg-gradient-to-r from-red-500/20 to-red-600/20 backdrop-blur-sm border-2 border-red-300/50 rounded-2xl shadow-lg"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    className="p-2 bg-red-500 rounded-xl"
                  >
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </motion.div>
                  <span className="text-lg font-bold text-red-900">Tampering Detected!</span>
                </div>
                <p className="text-sm text-red-800 font-medium">
                  Suspicious data pattern detected. Fraud score: {validationData.fraudScore}%
                </p>
              </motion.div>
            )}

            {/* Last Updated */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40"
            >
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Last updated</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{formatDate(validationData.lastReading.recordedAt)}</span>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default OBDDataValidationCard;
