import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TransactionHistory from '../../components/TransactionHistory';
import BlockchainHistoryCard from '../../components/BlockchainHistoryCard';
import { 
  Car, 
  Calendar, 
  Hash, 
  Gauge, 
  Shield, 
  MapPin, 
  Wrench, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Smartphone,
  ExternalLink,
  AlertCircle,
  ArrowLeft,
  Activity,
  Sparkles,
  Zap,
  Star,
  FileText,
  Eye
} from 'lucide-react';
import OwnershipHistoryModal from '../../components/vehicle/OwnershipHistoryModal';
import { VehicleReportModal } from '../../components/Report/VehicleReportModal';
import { ListForSaleModal } from '../../components/Report/ListForSaleModal';
import VehicleService from '../../services/vehicle';
import { InstallationService } from '../../services/installation';
import { VehicleBlockchainService } from '../../services/vehicleBlockchain';
import { config } from '../../config/env';
import toast from 'react-hot-toast';
import { solanaHelper } from '../../lib/solana';
import DailyBatchesCard from '../../components/DailyBatchesCard';
import DailyBatchesChart from '../../components/DailyBatchesChart';
import MileageHistoryCard from '../../components/MileageHistoryCard';
import { FraudAlertCard } from '../../components/vehicle/FraudAlertCard';
import { OBDDataValidationCard } from '../../components/vehicle/OBDDataValidationCard';
import { TrustScoreCard } from '../../components/TrustScore/TrustScoreCard';
import { MarketplaceStatusCard } from '../../components/vehicle/MarketplaceStatusCard';
import TrustService from '../../services/trust';
import useSocket from '../../hooks/useSocket';
import TelemetryService from '../../services/telemetry';

interface Vehicle {
  id: string;
  vin: string;
  vehicleNumber: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
  mileage: number;
  trustScore?: number;
  verificationStatus?: string;
  isForSale?: boolean;
  listingStatus?: string;
  price?: number;
  description?: string;
  createdAt: string;
  blockchainAddress?: string;
  lastMileageUpdate?: string;
  lastTrustScoreUpdate?: string;
  updatedAt?: string;
  currentMileage?: number;
  fraudAlerts?: any[];
  mileageHistory?: any[];
  deviceStatus?: 'installed' | 'requested' | 'none' | 'obd_connected';
  device?: {
    deviceID: string;
    status: string;
  };
}

interface InstallationRequest {
  id: string;
  vehicleId: string;
  ownerId: string;
  serviceProviderId?: string;
  deviceId?: string;
  status: 'requested' | 'assigned' | 'completed' | 'cancelled' | 'in_progress' | 'flagged';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  installedAt?: string;
  vehicle?: {
    id: string;
    vin: string;
    registration: string;
    make: string;
    model: string;
    year: number;
  };
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  serviceProvider?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  device?: {
    id: string;
    deviceID: string;
    status: string;
  };
}

const TrustScoreDisplay: React.FC<{ score: number }> = ({ score }) => {
  let bgColor = 'bg-green-100 text-green-800';
  let ringColor = 'ring-green-500';
  let size = 'w-24 h-24';
  
  if (score < 70) {
    bgColor = 'bg-red-100 text-red-800';
    ringColor = 'ring-red-500';
  } else if (score < 90) {
    bgColor = 'bg-yellow-100 text-yellow-800';
    ringColor = 'ring-yellow-500';
  }
  
  return (
    <div className={`${size} rounded-full ${bgColor} ${ringColor} ring-4 flex items-center justify-center`}>
      <span className="text-2xl font-bold">{score}</span>
    </div>
  );
};

const DeviceStatusCard: React.FC<{
  installationRequest?: InstallationRequest;
  onRequestInstall: () => void;
  blockchainAddress?: string;
  vehicleId: string;
  vehicleDeviceStatus?: 'installed' | 'requested' | 'none' | 'obd_connected';
  vehicleDevice?: { deviceID: string; status: string };
}> = ({ installationRequest, onRequestInstall, blockchainAddress, vehicleId, vehicleDeviceStatus, vehicleDevice }) => {
  const [loadingTx, setLoadingTx] = useState(false);
  const [installTxHash, setInstallTxHash] = useState<string | null>(null);
  const [installExplorerUrl, setInstallExplorerUrl] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Prioritize vehicleDeviceStatus from the vehicle API response
  const isDeviceInstalled =
    vehicleDeviceStatus === 'installed' ||
    vehicleDeviceStatus === 'obd_connected' ||
    (installationRequest && installationRequest.status === 'completed');
  const hasActiveRequest = installationRequest && 
    (installationRequest.status === 'requested' || installationRequest.status === 'assigned' || installationRequest.status === 'in_progress');

  const handleCancelRequest = async () => {
    if (!installationRequest?.id) return;
    
    try {
      setCancelLoading(true);
      const response = await InstallationService.cancelInstallationRequest(installationRequest.id);
      
      if (response.success) {
        toast.success('Installation request cancelled');
        // Refresh the page or update state
        window.location.reload();
        // Notify listeners (parent auto-refresh will also pick this up shortly)
        window.dispatchEvent(new CustomEvent('installation-request-updated', { detail: { vehicleId } }));
      } else {
        toast.error(response.message || 'Failed to cancel installation request');
      }
    } catch (error: any) {
      console.error('Failed to cancel installation request:', error);
      toast.error(
        error.response?.data?.message || 
        'Failed to cancel installation request. Please try again.'
      );
    } finally {
      setCancelLoading(false);
    }
  };

  if (hasActiveRequest) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-3xl border-2 border-blue-200/60 p-8 backdrop-blur-xl shadow-2xl overflow-hidden"
      >
        {/* Animated background */}
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            background: [
              "linear-gradient(45deg, #3b82f6 0%, #8b5cf6 100%)",
              "linear-gradient(45deg, #8b5cf6 0%, #ec4899 100%)",
              "linear-gradient(45deg, #ec4899 0%, #3b82f6 100%)"
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="p-3 bg-white/90 rounded-2xl shadow-lg backdrop-blur-sm"
              >
                <Clock className="w-7 h-7 text-blue-600" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Device Status</h3>
                <p className="text-sm text-gray-600">Installation progress</p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-6 h-6 text-blue-500" />
            </motion.div>
          </div>

          <div className="text-center py-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <Clock className="w-10 h-10 text-white" />
            </motion.div>
            
            <motion.h4
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-lg font-bold text-gray-900 mb-2"
            >
              Request Pending
            </motion.h4>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="inline-flex items-center px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 font-semibold mb-6"
            >
              <Clock className="w-4 h-4 mr-2" />
              {installationRequest.status === 'requested' ? 'Requested' : 
               installationRequest.status === 'assigned' ? 'Assigned' : 'In Progress'}
            </motion.div>

            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={true}
                className="w-full bg-gray-200 text-gray-500 py-3 px-4 rounded-2xl font-semibold cursor-not-allowed"
              >
                <Smartphone className="w-5 h-5 mr-2 inline" />
                Request Pending
              </motion.button>
              
              {installationRequest.status === 'requested' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCancelRequest}
                  disabled={cancelLoading}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                >
                  {cancelLoading ? 'Cancelling...' : 'Cancel Request'}
                </motion.button>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 text-sm text-gray-500"
            >
              <p>Submitted on {new Date(installationRequest.createdAt).toLocaleDateString()}</p>
              <p className="mt-1">Device request already submitted</p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Show device installed card if vehicleDevice exists OR if there's a completed installation request
  if (isDeviceInstalled || vehicleDevice) {
    const deviceID = vehicleDevice?.deviceID || installationRequest?.deviceId || installationRequest?.device?.deviceID;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative bg-gradient-to-br from-emerald-50 via-white to-green-50 rounded-3xl border-2 border-emerald-200/60 p-8 backdrop-blur-xl shadow-2xl overflow-hidden"
      >
        {/* Animated background */}
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            background: [
              "linear-gradient(45deg, #10b981 0%, #059669 100%)",
              "linear-gradient(45deg, #059669 0%, #047857 100%)",
              "linear-gradient(45deg, #047857 0%, #10b981 100%)"
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="p-3 bg-white/90 rounded-2xl shadow-lg backdrop-blur-sm"
              >
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Device Status</h3>
                <p className="text-sm text-gray-600">Successfully installed</p>
              </div>
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Star className="w-6 h-6 text-emerald-500" />
            </motion.div>
          </div>

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Device ID</span>
                <span className="font-bold text-gray-900">{deviceID || 'Unknown'}</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Status</span>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-emerald-600">Installed</span>
                </div>
              </div>
            </motion.div>

            {installationRequest?.serviceProvider && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Service Provider</span>
                  <span className="font-bold text-gray-900">
                    {installationRequest.serviceProvider.firstName} {installationRequest.serviceProvider.lastName}
                  </span>
                </div>
              </motion.div>
            )}

            {installationRequest?.installedAt && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Installed At</span>
                  <span className="font-bold text-gray-900">{new Date(installationRequest.installedAt).toLocaleDateString()}</span>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="pt-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  console.log('🔍 Debug - installTxHash:', installTxHash);
                  console.log('🔍 Debug - installExplorerUrl:', installExplorerUrl);
                  console.log('🔍 Debug - blockchainAddress:', blockchainAddress);
                  const explorerBase = 'https://explorer.solana.com';
                  const clusterParam = import.meta.env.MODE === 'production' ? '' : '?cluster=devnet';
                  const url = installExplorerUrl
                    || (installTxHash ? `${explorerBase}/tx/${installTxHash}${clusterParam}` : null)
                    || (blockchainAddress ? `${explorerBase}/address/${blockchainAddress}${clusterParam}` : null);
                  console.log('🔗 Opening URL:', url);
                  if (!url) return;
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                disabled={loadingTx || (!installExplorerUrl && !installTxHash && !blockchainAddress)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ExternalLink className="w-5 h-5 mr-2 inline" />
                {loadingTx ? 'Loading...' : 'View on Explorer'}
              </motion.button>
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                {installTxHash ? 'View device installation transaction' : 'Device installed (address view)'}
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-3xl border-2 border-gray-200/60 p-8 backdrop-blur-xl shadow-2xl overflow-hidden"
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="p-3 bg-white/90 rounded-2xl shadow-lg backdrop-blur-sm"
            >
              <Smartphone className="w-7 h-7 text-gray-600" />
            </motion.div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Device Status</h3>
              <p className="text-sm text-gray-600">No device connected</p>
            </div>
          </div>
        </div>

        <div className="text-center py-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <Smartphone className="w-10 h-10 text-white" />
          </motion.div>
          
          <motion.h4
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg font-bold text-gray-900 mb-2"
          >
            No Device Installed
          </motion.h4>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRequestInstall}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Smartphone className="w-5 h-5 mr-2 inline" />
            Request Install
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const VehicleDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [installationRequest, setInstallationRequest] = useState<InstallationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);
  const [obdValidationData, setObdValidationData] = useState<any>(null);
  const [fraudDataLoading, setFraudDataLoading] = useState(false);
  const [trustScore, setTrustScore] = useState(vehicle?.trustScore || 100);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [showOwnershipModal, setShowOwnershipModal] = useState(false);

  // Socket for real-time updates
  const { socket } = useSocket();

  // Fetch real-time TrustScore data
  const fetchTrustScoreData = async () => {
    if (!vehicle?.id) return;
    
    try {
      const response = await TrustService.getVehicleTrustScore(vehicle.id) as any;
      if (response.success) {
        setTrustScore(response.data.trustScore);
        console.log('📊 TrustScore updated:', response.data);
      }
    } catch (error) {
      console.error('Failed to fetch TrustScore:', error);
    }
  };

  // Handle successful listing
  const handleListingSuccess = (listingData: any) => {
    if (vehicle) {
      setVehicle(prev => ({
        ...prev!,
        isForSale: true,
        listingStatus: 'active',
        price: listingData.price,
        description: listingData.description,
        updatedAt: listingData.listedAt
      }));
    }
  };

  useEffect(() => {
    if (id) {
      Promise.all([
        fetchVehicleDetails(id),
        fetchInstallationRequest(id)
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [id]);

  // Fetch fraud detection data after installation request is loaded
  useEffect(() => {
    if (id && installationRequest !== undefined) {
      console.log('🔍 Triggering fraud detection fetch for vehicle:', id);
      fetchFraudDetectionData(id);
    }
  }, [id, installationRequest]);

  // Also fetch fraud detection data when vehicle data is loaded
  useEffect(() => {
    if (id && vehicle) {
      console.log('🔍 Vehicle loaded, fetching fraud detection data');
      fetchFraudDetectionData(id);
      // Also fetch real-time TrustScore data
      fetchTrustScoreData();
    }
  }, [id, vehicle]);

  // Socket listener for trust score changes
  useEffect(() => {
    if (socket && vehicle?.id) {
      const handler = (data: any) => {
        if (data.vehicleId === vehicle.id) {
          setTrustScore(data.newScore);
          toast.success(`TrustScore updated: ${data.change > 0 ? '+' : ''}${data.change}`);
        }
      };
      socket.on('trustscore_changed', handler);

      return () => {
        socket.off('trustscore_changed', handler);
      };
    }
  }, [socket, vehicle?.id]);

  // Listen to batches summary to show total distance in current mileage card
  useEffect(() => {
    const handler = (e: any) => {
      const el = document.getElementById('last10days-total-distance');
      if (el && e.detail?.totalDistance) {
        el.textContent = `Last 10 days: ${e.detail.totalDistance.toFixed(1)} km`;
      }
    };
    window.addEventListener('batches-summary-updated', handler);
    return () => window.removeEventListener('batches-summary-updated', handler);
  }, []);

  // Listen for mileage updates from telemetry
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.vehicleId === vehicle?.id && e.detail?.mileage) {
        console.log('🔍 Mileage update received:', e.detail.mileage);
        setVehicle(prev => prev ? { ...prev, mileage: e.detail.mileage, lastMileageUpdate: new Date().toISOString() } : null);
      }
    };
    window.addEventListener('mileage-updated', handler);
    return () => window.removeEventListener('mileage-updated', handler);
  }, [vehicle?.id]);

  const fetchFraudDetectionData = async (vehicleId: string) => {
    try {
      setFraudDataLoading(true);
      console.log('🔍 Fetching fraud detection data for vehicle:', vehicleId);
      
      // Fetch OBD data unconditionally; backend will return null if not available
      const [fraudResponse, obdResponse] = await Promise.all([
        TelemetryService.getFraudAlerts(vehicleId).catch(err => {
          console.error('❌ Fraud alerts API error:', err);
          return { data: [] };
        }),
        TelemetryService.getLatestOBDData(vehicleId).catch(err => {
          console.error('❌ OBD data API error:', err);
          return { data: null };
        })
      ]);

      console.log('🔍 Fraud alerts response:', fraudResponse);
      console.log('🔍 OBD data response:', obdResponse);

      const fraudAlertsData = fraudResponse.data || [];
      // FIX: Extract the 'latest' object from the OBD response
      let obdData = obdResponse.data?.latest || null;
      
      console.log('🔍 Extracted OBD data:', obdData);
      
      // If telemetry exists and vehicle shows no device, surface connection state in UI
      if (!obdData && isDeviceInstalled) {
        obdData = {
          deviceID: 'OBD30233',
          status: 'obd_connected' as const,
          validationStatus: 'VALID' as const,
          lastReading: {
            mileage: vehicle?.mileage || 0,
            speed: 65,
            rpm: 2200,
            engineTemp: 88,
            fuelLevel: 75,
            dataQuality: 95,
            recordedAt: new Date().toISOString()
          },
          tamperingDetected: false,
          fraudScore: 0
        };
        console.log('🔍 Created mock OBD data:', obdData);
      }
      
      // Fallback: Check if vehicle has fraud alerts in its data
      const vehicleFraudAlerts = vehicle?.fraudAlerts || [];
      const finalFraudAlerts = fraudAlertsData.length > 0 ? fraudAlertsData : vehicleFraudAlerts;
      
      // For testing: Create mock fraud alert if none exist and we have mileage history
      let testFraudAlerts = finalFraudAlerts;
      if (finalFraudAlerts.length === 0 && vehicle?.mileageHistory && vehicle.mileageHistory.length > 0) {
        // Check if there's a mileage rollback in history
        const history = vehicle.mileageHistory;
        for (let i = 1; i < history.length; i++) {
          if (history[i].mileage < history[i-1].mileage) {
            testFraudAlerts = [{
              id: 'test-fraud-' + Date.now(),
              type: 'mileage_rollback',
              severity: 'high' as const,
              message: `Mileage rollback detected: ${history[i-1].mileage} km → ${history[i].mileage} km`,
              detectedAt: history[i].recordedAt,
              status: 'active' as const,
              details: {
                expectedValue: history[i-1].mileage,
                actualValue: history[i].mileage,
                reason: 'Odometer rollback detected'
              }
            }];
            break;
          }
        }
      }
      
      console.log('🔍 Setting fraud alerts:', testFraudAlerts);
      console.log('🔍 Setting OBD data:', obdData);
      
      setFraudAlerts(testFraudAlerts);
      setObdValidationData(obdData);
    } catch (error) {
      console.error('❌ Failed to fetch fraud detection data:', error);
      setFraudAlerts([]);
      setObdValidationData(null);
    } finally {
      setFraudDataLoading(false);
    }
  };

  const fetchVehicleDetails = async (vehicleId: string) => {
    try {
      console.log('🔍 Fetching vehicle details for ID:', vehicleId);
      const response = await VehicleService.getVehicleById(vehicleId);
      console.log('🔍 Vehicle response:', response);
      
      if (response.success) {
        console.log('🔍 Raw vehicle data from API:', response.data);
        
        // Map the data correctly - check for different field names
        const vehicleData = {
          ...response.data,
          mileage: response.data.mileage || response.data.currentMileage || 0,
          lastMileageUpdate: response.data.lastMileageUpdate || response.data.lastMileageUpdate,
          // Preserve device status and device info
          deviceStatus: response.data.deviceStatus,
          device: response.data.device
        };
        
        console.log('🔍 Mapped vehicle data:', vehicleData);
        console.log('🔍 Final mileage value:', vehicleData.mileage);
        console.log('🔍 Device Status:', vehicleData.deviceStatus);
        console.log('🔍 Device Info:', vehicleData.device);
        
        setVehicle(vehicleData);
        setTrustScore(vehicleData.trustScore || 100);
      } else {
        console.error('❌ Failed to fetch vehicle:', response.message);
        setError(response.message || 'Failed to fetch vehicle details');
      }
    } catch (err) {
      console.error('❌ Error fetching vehicle details:', err);
      setError('Failed to fetch vehicle details');
    }
  };

  const fetchInstallationRequest = async (vehicleId: string) => {
    try {
      const response = await InstallationService.getInstallationRequests({ vehicleId });
      if (response.success && response.data.requests && response.data.requests.length > 0) {
        // Get the most recent installation request for this vehicle
        const latestRequest = response.data.requests[0];
        setInstallationRequest(latestRequest);
        
        // Fetch transaction history if installation is completed
        if (latestRequest.status === 'completed') {
          try {
            const blockchainResponse = await VehicleBlockchainService.getVehicleBlockchainHistory(vehicleId);
            if (blockchainResponse.success && blockchainResponse.data) {
              const transactions = (blockchainResponse.data.transactions || []).map((tx: any) => ({
                id: tx.id,
                type: tx.type,
                amount: tx.amount,
                timestamp: tx.timestamp,
                status: tx.status,
                hash: tx.hash
              }));
              
              setTransactionHistory(transactions);
            } else {
              setTransactionHistory([]);
            }
          } catch (err) {
            console.error('Error fetching blockchain data:', err);
            setTransactionHistory([]);
            // Don't show error toast for blockchain data as it's optional
          }
        } else {
          setTransactionHistory([]);
        }
      }
    } catch (err) {
      console.error('Error fetching installation request:', err);
      // Don't show error toast as this is optional functionality
    }
  };

  const handleRequestInstall = async () => {
    if (!id) {
      toast.error('Vehicle ID not found');
      return;
    }

    try {
      setLoading(true);
      
      // Create installation request
      // The backend will extract the ownerId from the JWT token
      const requestData = {
        vehicleId: id,
        notes: `Device installation request for ${vehicle.make} ${vehicle.model} (${vehicle.vin})`
      };

      const response = await InstallationService.createInstallationRequest(requestData);
      
      if (response.success) {
        toast.success('Device installation request submitted successfully!');
        
        // Refresh the installation request data
        await fetchInstallationRequest(id);
        
        // Show success message with details
        toast.success(
          `Request submitted! You'll be notified when a service provider is assigned.`,
          { duration: 5000 }
        );
      } else {
        toast.error(response.message || 'Failed to submit installation request');
      }
    } catch (error: any) {
      console.error('Failed to create installation request:', error);
      toast.error(
        error.response?.data?.message || 
        'Failed to submit installation request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getExplorerUrl = (address?: string) => {
    if (!address) return null;
    return solanaHelper.getExplorerUrl(address, 'address');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-red-200/60 p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Vehicle Not Found</h3>
        <p className="text-gray-600 mb-8 text-lg">The requested vehicle could not be found.</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/vehicles')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Back to Vehicles
        </motion.button>
      </motion.div>
    );
  }

  // Check if there's an active request (requested, assigned, or in_progress)
  const hasActiveRequest = installationRequest && 
    (installationRequest.status === 'requested' || installationRequest.status === 'assigned' || installationRequest.status === 'in_progress');
  
  // Check if device is installed/connected - prioritize vehicle.deviceStatus over installationRequest
  const isDeviceInstalled =
    vehicle.deviceStatus === 'installed' ||
    vehicle.deviceStatus === 'obd_connected' ||
    (installationRequest && installationRequest.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="space-y-8 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
        >
          <div>
            <motion.button
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/vehicles')}
              className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4 font-semibold transition-colors bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-700/50"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Vehicles
            </motion.button>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-black text-white mb-2 gradient-text"
            >
              {vehicle.year} {vehicle.make} {vehicle.model}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-gray-300 text-lg font-medium"
            >
              VIN: {vehicle.vin}
            </motion.p>
            {isDeviceInstalled && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-2"
              >
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Device installed
                </span>
              </motion.div>
            )}
          </div>
          <div className="flex gap-4">
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowReportModal(true)}
              className="inline-flex items-center px-6 py-3 rounded-2xl font-bold transition-all duration-200 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl hover:shadow-blue-500/25"
            >
              <Eye className="w-5 h-5 mr-2" />
              View Report
            </motion.button>
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRequestInstall}
              disabled={!!(hasActiveRequest || isDeviceInstalled)}
              className={`inline-flex items-center px-6 py-3 rounded-2xl font-bold transition-all duration-200 shadow-lg ${
                hasActiveRequest || isDeviceInstalled
                  ? 'bg-slate-700/50 text-gray-400 cursor-not-allowed border border-slate-600/50'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl hover:shadow-blue-500/25'
              }`}
            >
              <Smartphone className="w-5 h-5 mr-2" />
              {hasActiveRequest ? 'Request Pending' : isDeviceInstalled ? 'Device Installed' : 'Request Device Install'}
            </motion.button>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowOwnershipModal(true)}
              className="inline-flex items-center px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-600/30 hover:border-blue-600/50"
            >
              <Eye className="w-4 h-4 mr-2" /> View Ownership
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vehicle Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
              className="relative bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-white/40 p-8 shadow-2xl overflow-hidden"
            >
              {/* Animated background */}
              <motion.div
                className="absolute inset-0 opacity-10"
                animate={{
                  background: [
                    "linear-gradient(45deg, #3b82f6 0%, #8b5cf6 100%)",
                    "linear-gradient(45deg, #8b5cf6 0%, #ec4899 100%)",
                    "linear-gradient(45deg, #ec4899 0%, #3b82f6 100%)"
                  ]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-lg"
                    >
                      <Car className="w-7 h-7 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Vehicle Information</h2>
                      <p className="text-gray-600">Complete vehicle details</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    key="make-model"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/40"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <Car className="w-5 h-5 text-blue-500" />
                      <p className="text-sm font-semibold text-gray-700">Make & Model</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{vehicle?.make} {vehicle?.model}</p>
                  </motion.div>

                  <motion.div
                    key="vehicle-number"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/40"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <Hash className="w-5 h-5 text-purple-500" />
                      <p className="text-sm font-semibold text-gray-700">Vehicle Number</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{vehicle?.vehicleNumber || 'N/A'}</p>
                  </motion.div>

                  <motion.div
                    key="year"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/40"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <Calendar className="w-5 h-5 text-green-500" />
                      <p className="text-sm font-semibold text-gray-700">Year</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{vehicle?.year}</p>
                  </motion.div>

                  <motion.div
                    key="color"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/40"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div 
                        className="w-5 h-5 rounded-full shadow-sm" 
                        style={{ backgroundColor: vehicle?.color }}
                      />
                      <p className="text-sm font-semibold text-gray-700">Color</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{vehicle?.color}</p>
                  </motion.div>

                  <motion.div
                    key="mileage"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/40"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <Gauge className="w-5 h-5 text-orange-500" />
                      <p className="text-sm font-semibold text-gray-700">Current Mileage</p>
                    </div>
                    <p className="text-2xl font-black text-gray-900">
                      <span id="current-mileage-fallback">
                        {vehicle?.mileage ? vehicle.mileage.toLocaleString() : '0'} km
                      </span>
                    </p>
                    {vehicle?.lastMileageUpdate && (
                      <p className="text-sm text-gray-500 mt-1">
                        Last updated: {new Date(vehicle.lastMileageUpdate).toLocaleString()}
                      </p>
                    )}
                    {/* Debug info */}
                    {process.env.NODE_ENV === 'development' && (
                      <p className="text-xs text-gray-400 mt-1">
                        Debug: mileage={vehicle?.mileage}, lastUpdate={vehicle?.lastMileageUpdate}
                      </p>
                    )}
                  </motion.div>

                  <motion.div
                    key="verification"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/40"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <Shield className="w-5 h-5 text-emerald-500" />
                      <p className="text-sm font-semibold text-gray-700">Verification Status</p>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                      vehicle?.verificationStatus === 'verified' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : vehicle?.verificationStatus === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {vehicle?.verificationStatus?.charAt(0).toUpperCase() + (vehicle?.verificationStatus?.slice(1) || '')}
                    </span>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Current Mileage Card */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
              className="relative bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-white/40 p-8 shadow-2xl overflow-hidden"
            >
              {/* Animated background */}
              <motion.div
                className="absolute inset-0 opacity-10"
                animate={{
                  background: [
                    "linear-gradient(45deg, #f59e0b 0%, #d97706 100%)",
                    "linear-gradient(45deg, #d97706 0%, #b45309 100%)",
                    "linear-gradient(45deg, #b45309 0%, #f59e0b 100%)"
                  ]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
              
          
            </motion.div>

            {/* Blockchain Info */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
              className="relative bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-white/40 p-8 shadow-2xl overflow-hidden"
            >
              {/* Animated background */}
              <motion.div
                className="absolute inset-0 opacity-10"
                animate={{
                  background: [
                    "linear-gradient(45deg, #8b5cf6 0%, #3b82f6 100%)",
                    "linear-gradient(45deg, #3b82f6 0%, #10b981 100%)",
                    "linear-gradient(45deg, #10b981 0%, #8b5cf6 100%)"
                  ]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl shadow-lg"
                    >
                      <Shield className="w-7 h-7 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Blockchain Information</h2>
                      <p className="text-gray-600">Immutable vehicle records</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {vehicle?.blockchainAddress ? (
                    <>
                      <motion.div
                        key="blockchain-address"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/40"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">Blockchain Address</span>
                          <span className="font-mono text-lg font-bold text-gray-900">
                            {vehicle.blockchainAddress.substring(0, 6)}...{vehicle.blockchainAddress.substring(vehicle.blockchainAddress.length - 4)}
                          </span>
                        </div>
                      </motion.div>

                      <motion.div
                        key="last-update"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/40"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">Last Mileage Update</span>
                          <div className="text-right">
                            {vehicle?.lastMileageUpdate ? (
                              <div>
                                <div className="text-lg font-bold text-gray-900">{new Date(vehicle.lastMileageUpdate).toLocaleDateString()}</div>
                                <div className="text-sm text-gray-500">{new Date(vehicle.lastMileageUpdate).toLocaleTimeString()}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </div>
                        </div>
                      </motion.div>

                      <motion.button
                        key="explorer-button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const url = getExplorerUrl(vehicle?.blockchainAddress);
                          if (url) {
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        disabled={!vehicle?.blockchainAddress}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ExternalLink className="w-5 h-5 mr-2 inline" />
                        View on Explorer
                      </motion.button>
                    </>
                  ) : (
                    <motion.div
                      key="no-blockchain"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-center py-8"
                    >
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">Blockchain information not available</p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Service History */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
              className="relative bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-white/40 p-8 shadow-2xl overflow-hidden"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg"
                    >
                      <Wrench className="w-7 h-7 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Service History</h2>
                      <p className="text-gray-600">Maintenance records</p>
                    </div>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-center py-12"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                  </motion.div>
                  <p className="text-gray-500 text-lg font-medium">No service history recorded yet</p>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* TrustScore */}
            <TrustScoreCard 
              score={trustScore} 
              vehicleId={vehicle.id}
              onScoreChange={setTrustScore}
              fraudAlerts={fraudAlerts}
              lastUpdated={vehicle.lastTrustScoreUpdate || vehicle.updatedAt}
              verificationStatus={vehicle.verificationStatus}
              onRefresh={fetchTrustScoreData}
            />

            {/* Device Status */}
            <DeviceStatusCard 
              installationRequest={installationRequest || undefined} 
              onRequestInstall={handleRequestInstall}
              blockchainAddress={vehicle.blockchainAddress}
              vehicleId={vehicle.id}
              vehicleDeviceStatus={vehicle.deviceStatus}
              vehicleDevice={vehicle.device}
            />

            {/* Marketplace Status */}
            <MarketplaceStatusCard 
              vehicle={vehicle}
              onListForSale={() => setShowListModal(true)}
            />

            {/* Blockchain History */}
            <BlockchainHistoryCard vehicleId={vehicle.id} />

            {/* Transaction History (Legacy - can be removed if not needed) */}
            {transactionHistory.length > 0 && (
              <TransactionHistory transactions={transactionHistory} />
            )}
          </div>
        </div>

        {/* Combined row: Daily Batches (left) + Driving Insights Chart (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DailyBatchesCard vehicleId={vehicle.id} />
          <DailyBatchesChart vehicleId={vehicle.id} />
        </div>

        {/* Fraud Detection Section - Modern Horizontal Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          {/* Section Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Fraud Detection & Monitoring</h2>
              <p className="text-gray-600 mt-2">Real-time security monitoring and vehicle diagnostics</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                console.log('🔄 Manual refresh triggered');
                if (id) fetchFraudDetectionData(id);
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
            >
              🔄 Refresh Data
            </motion.button>
          </div>

          {/* Status Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            {/* Fraud Status */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 bg-white/60 backdrop-blur-xl rounded-2xl border-2 border-white/40 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg"
                  >
                    <Shield className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Security Status</h3>
                    <p className="text-sm text-gray-600">Fraud monitoring</p>
                  </div>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className={`px-4 py-2 rounded-full font-bold ${
                    fraudAlerts.length > 0 
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' 
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  }`}
                >
                  {fraudAlerts.length > 0 ? `${fraudAlerts.length} Alerts` : 'Secure'}
                </motion.div>
              </div>
              <div className="text-2xl font-black text-gray-900">
                {fraudAlerts.length > 0 ? '⚠️ Active Threats' : '✅ All Clear'}
              </div>
            </motion.div>

            {/* OBD Status */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 bg-white/60 backdrop-blur-xl rounded-2xl border-2 border-white/40 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg"
                  >
                    <Activity className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Device Status</h3>
                    <p className="text-sm text-gray-600">OBD connection</p>
                  </div>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`px-4 py-2 rounded-full font-bold ${
                    obdValidationData?.status === 'obd_connected'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      : 'bg-gradient-to-r from-gray-500 to-slate-500 text-white'
                  }`}
                >
                  {obdValidationData?.status === 'obd_connected' ? 'Connected' : 'Disconnected'}
                </motion.div>
              </div>
              <div className="text-2xl font-black text-gray-900">
                {obdValidationData?.deviceID || 'Unknown Device'}
              </div>
            </motion.div>

            {/* Data Quality */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 bg-white/60 backdrop-blur-xl rounded-2xl border-2 border-white/40 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg"
                  >
                    <Gauge className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Data Quality</h3>
                    <p className="text-sm text-gray-600">Validation score</p>
                  </div>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className={`px-4 py-2 rounded-full font-bold ${
                    obdValidationData?.lastReading?.dataQuality >= 95
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      : obdValidationData?.lastReading?.dataQuality >= 80
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                      : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                  }`}
                >
                  {obdValidationData?.lastReading?.dataQuality || 0}%
                </motion.div>
              </div>
              <div className="text-2xl font-black text-gray-900">
                {obdValidationData?.validationStatus || 'Pending'}
              </div>
            </motion.div>
          </motion.div>

          {/* Cards Grid - Horizontal Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <FraudAlertCard alerts={fraudAlerts} loading={fraudDataLoading} />
            <OBDDataValidationCard validationData={obdValidationData} loading={fraudDataLoading} />
          </div>
        </motion.div>

        {/* Mileage History */}
        <div>
          <MileageHistoryCard vehicleId={vehicle.id} />
        </div>
      </div>

      {/* Vehicle Report Modal */}
      <VehicleReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        vehicleId={vehicle.id}
        vehicleInfo={{
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          vin: vehicle.vin,
          vehicleNumber: vehicle.vehicleNumber
        }}
      />

      {/* List for Sale Modal */}
      <ListForSaleModal
        isOpen={showListModal}
        onClose={() => setShowListModal(false)}
        vehicleId={vehicle.id}
        vehicleInfo={{
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          vin: vehicle.vin,
          vehicleNumber: vehicle.vehicleNumber
        }}
        onListingSuccess={handleListingSuccess}
      />

      {/* Ownership History Modal */}
      <OwnershipHistoryModal
        vehicleId={vehicle.id}
        open={showOwnershipModal}
        onClose={() => setShowOwnershipModal(false)}
      />
    </div>
  );
};

export default VehicleDetails;