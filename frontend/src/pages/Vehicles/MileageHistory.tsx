import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import MileageHistoryTable from '../../components/MileageHistoryTable';
import VehicleService from '../../services/vehicle';

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
  history: Array<{
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
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const MileageHistory: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<MileageHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadMileageHistory = async () => {
    if (!vehicleId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await VehicleService.getMileageHistory(vehicleId);
      
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || 'Failed to load mileage history');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load mileage history');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!vehicleId) return;
    
    try {
      setRefreshing(true);
      await loadMileageHistory();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMileageHistory();
  }, [vehicleId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lg p-8 text-center"
        >
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Mileage History</h3>
          <p className="text-gray-600">Fetching blockchain-verified records...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md"
        >
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2 inline" />
              Go Back
            </button>
            <button
              onClick={loadMileageHistory}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2 inline" />
              Retry
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lg p-8 text-center"
        >
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">No mileage history found for this vehicle.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mileage History</h1>
                <p className="text-gray-600 mt-1">
                  VIN: {data.vin} • Device: {data.lastOBDUpdate.deviceId}
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Current Mileage</p>
                <p className="text-2xl font-bold text-gray-900">{data.currentMileage.toLocaleString()} km</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Service Verified</p>
                <p className="text-2xl font-bold text-gray-900">{data.serviceVerifiedMileage.toLocaleString()} km</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Registered</p>
                <p className="text-2xl font-bold text-gray-900">{data.registeredMileage.toLocaleString()} km</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{data.pagination.total}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mileage History Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <MileageHistoryTable data={data} onRefresh={handleRefresh} />
        </motion.div>
      </div>
    </div>
  );
};

export default MileageHistory;
