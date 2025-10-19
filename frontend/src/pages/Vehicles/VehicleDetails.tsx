import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  AlertCircle
} from 'lucide-react';
import { VehicleService } from '../../services/vehicle';
import { InstallationService } from '../../services/installation';
import { VehicleBlockchainService } from '../../services/vehicleBlockchain';
import { config } from '../../config/env';
import toast from 'react-hot-toast';
import { solanaHelper } from '../../lib/solana';

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
  createdAt: string;
  blockchainAddress?: string;
  lastMileageUpdate?: string;
}

interface InstallationRequest {
  id: string;
  vehicleId: string;
  ownerId: string;
  serviceProviderId?: string;
  deviceId?: string;
  status: 'requested' | 'assigned' | 'completed' | 'cancelled';
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
    size = 'w-24 h-24';
  } else if (score < 90) {
    bgColor = 'bg-yellow-100 text-yellow-800';
    ringColor = 'ring-yellow-500';
    size = 'w-24 h-24';
  }
  
  return (
    <div className="flex flex-col items-center">
      <div className={`${size} rounded-full ${bgColor} ${ringColor} ring-4 flex items-center justify-center`}>
        <span className="text-2xl font-bold">{score}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-gray-900">TrustScore</p>
      <p className="text-xs text-gray-500">
        {score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : 'Needs Attention'}
      </p>
    </div>
  );
};

const DeviceStatusCard: React.FC<{ 
  installationRequest?: InstallationRequest;
  onRequestInstall: () => void;
  blockchainAddress?: string;
  vehicleId?: string;
}> = ({ installationRequest, onRequestInstall, blockchainAddress, vehicleId }) => {
  const [installTxHash, setInstallTxHash] = useState<string | null>(null);
  const [loadingTx, setLoadingTx] = useState(false);

  // Check if there's an active request (requested, assigned, or in_progress)
  const hasActiveRequest = installationRequest && 
    (installationRequest.status === 'requested' || installationRequest.status === 'assigned' || installationRequest.status === 'in_progress');
  
  // Check if device is installed
  const isDeviceInstalled = installationRequest && installationRequest.status === 'completed';

  // Fetch device installation transaction when device is installed
  useEffect(() => {
    const fetchInstallTransaction = async () => {
      if (isDeviceInstalled && vehicleId) {
        try {
          setLoadingTx(true);
          const response = await VehicleBlockchainService.getDeviceInstallTransaction(vehicleId);
          if (response.success) {
            setInstallTxHash(response.data.hash);
          }
        } catch (error) {
          console.error('Failed to fetch install transaction:', error);
        } finally {
          setLoadingTx(false);
        }
      }
    };

    fetchInstallTransaction();
  }, [isDeviceInstalled, vehicleId]);

  if (hasActiveRequest) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Device Status</h2>
        <div className="text-center py-4">
          <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Request Pending</p>
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-4">
            <Clock className="w-3 h-3 mr-1" />
            {installationRequest.status === 'requested' ? 'Requested' : 
             installationRequest.status === 'assigned' ? 'Assigned' : 'In Progress'}
          </div>
          <button
            disabled={true}
            className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
          >
            <Smartphone className="w-4 h-4 mr-1" />
            Request Pending
          </button>
          <p className="text-xs text-gray-500 mt-2">Submitted on {new Date(installationRequest.createdAt).toLocaleDateString()}</p>
          <p className="text-xs text-gray-500 mt-1">Device request already submitted</p>
        </div>
      </motion.div>
    );
  }

  if (isDeviceInstalled && installationRequest?.device) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Device Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Device ID</span>
            <span className="font-medium">{installationRequest.deviceId || installationRequest.device?.deviceID}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Status</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Installed
            </span>
          </div>
          {installationRequest.serviceProvider && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Service Provider</span>
              <span className="font-medium">
                {installationRequest.serviceProvider.firstName} {installationRequest.serviceProvider.lastName}
              </span>
            </div>
          )}
          {installationRequest.installedAt && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Installed At</span>
              <span className="font-medium">{new Date(installationRequest.installedAt).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex space-x-2 pt-2">
            <button 
              onClick={() => {
                if (!installTxHash) return;
                const url = solanaHelper.getExplorerUrl(installTxHash, 'tx');
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
              disabled={!installTxHash || loadingTx}
              className="inline-flex items-center px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              {loadingTx ? 'Loading...' : 'View on Explorer'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {installTxHash ? 'View device installation transaction' : 'Device installed'}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Device Status</h2>
      <div className="text-center py-4">
        <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">No device installed</p>
        <button
          onClick={onRequestInstall}
          className="inline-flex items-center px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Smartphone className="w-4 h-4 mr-1" />
          Request Install
        </button>
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

  // Auto-refresh installation request data every 30 seconds
  useEffect(() => {
    if (!id) return;
    
    const interval = setInterval(() => {
      fetchInstallationRequest(id);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [id]);

  const fetchVehicleDetails = async (vehicleId: string) => {
    try {
      const response = await VehicleService.getVehicleById(vehicleId);
      
      // Map the response to our interface
      const vehicleData = {
        id: response.data.id,
        vin: response.data.vin,
        vehicleNumber: response.data.vehicleNumber || '',
        make: response.data.make,
        model: response.data.model,
        year: response.data.year,
        color: response.data.color,
        bodyType: response.data.bodyType,
        fuelType: response.data.fuelType,
        transmission: response.data.transmission,
        mileage: response.data.mileage || 0,
        trustScore: (response.data as any).trustScore || 100,
        verificationStatus: response.data.verificationStatus,
        isForSale: response.data.isForSale,
        createdAt: response.data.createdAt,
        blockchainAddress: response.data.blockchainAddress,
        lastMileageUpdate: response.data.lastMileageUpdate
      };
      
      setVehicle(vehicleData);
    } catch (err) {
      setError('Failed to fetch vehicle details');
      console.error('Error fetching vehicle:', err);
      toast.error('Can\'t reach vehicle API. Contact support.');
    }
  };

  const fetchInstallationRequest = async (vehicleId: string) => {
    try {
      const response = await InstallationService.getInstallationRequests({ vehicleId });
      if (response.data.requests.length > 0) {
        // Get the most recent request
        const latestRequest = response.data.requests[0];
        setInstallationRequest(latestRequest);
        
        // Extract transaction history from installation request
        const transactions = latestRequest.history?.map((historyItem: any) => ({
          id: historyItem._id,
          type: historyItem.action === 'started' ? 'install_start' : 
                historyItem.action === 'completed' ? 'install_complete' : 'other',
          timestamp: historyItem.at,
          solanaTx: historyItem.meta?.solanaTx,
          arweaveTx: historyItem.meta?.arweaveTx,
          deviceId: historyItem.meta?.deviceId,
          initialMileage: historyItem.meta?.initialMileage,
          ownerName: latestRequest.owner?.fullName,
          serviceProviderName: latestRequest.serviceProvider?.fullName,
          vehicleNumber: latestRequest.vehicle?.vehicleNumber,
          vin: latestRequest.vehicle?.vin
        })) || [];
        
        setTransactionHistory(transactions);
      }
    } catch (err) {
      console.error('Error fetching installation request:', err);
      toast.error('Can\'t reach installation API. Contact support.');
    }
  };

  const handleRequestInstall = () => {
    console.log('Request device installation for vehicle:', id);
    // TODO: Implement installation request logic
  };

  const getExplorerUrl = (address?: string) => {
    if (!address) return null;
    return solanaHelper.getExplorerUrl(address, 'address');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Vehicle Not Found</h3>
        <p className="text-gray-500 mb-6">The requested vehicle could not be found.</p>
        <button
          onClick={() => navigate('/vehicles')}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Back to Vehicles
        </button>
      </div>
    );
  }

  // Check if there's an active request (requested, assigned, or in_progress)
  const hasActiveRequest = installationRequest && 
    (installationRequest.status === 'requested' || installationRequest.status === 'assigned' || installationRequest.status === 'in_progress');
  
  // Check if device is installed
  const isDeviceInstalled = installationRequest && installationRequest.status === 'completed';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/vehicles')}
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-800 mb-2"
          >
            ← Back to Vehicles
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          <p className="text-gray-600">VIN: {vehicle.vin}</p>
        </div>
        <button
          onClick={handleRequestInstall}
          disabled={!!(hasActiveRequest || isDeviceInstalled)}
          className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
            hasActiveRequest || isDeviceInstalled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          <Smartphone className="w-5 h-5 mr-2" />
          {hasActiveRequest ? 'Request Pending' : isDeviceInstalled ? 'Device Installed' : 'Request Device Install'}
        </button>
      </div>
      {(hasActiveRequest || isDeviceInstalled) && (
        <div className="text-sm text-gray-500 mt-1">
          {hasActiveRequest ? 'Device request already submitted' : 'Device installed'}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Car className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Make & Model</p>
                  <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Hash className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Vehicle Number</p>
                  <p className="font-medium">{vehicle.vehicleNumber}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Year</p>
                  <p className="font-medium">{vehicle.year}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: vehicle.color }}></div>
                <div>
                  <p className="text-sm text-gray-500">Color</p>
                  <p className="font-medium">{vehicle.color}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Gauge className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Current Mileage</p>
                  <p className="font-medium">{vehicle.mileage.toLocaleString()} miles</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Verification Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    vehicle.verificationStatus === 'verified' 
                      ? 'bg-green-100 text-green-800' 
                      : vehicle.verificationStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {vehicle.verificationStatus?.charAt(0).toUpperCase() + (vehicle.verificationStatus?.slice(1) || '')}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Blockchain Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Blockchain Information</h2>
            <div className="space-y-3">
              {vehicle.blockchainAddress ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Blockchain Address</span>
                    <span className="font-mono text-sm">{vehicle.blockchainAddress.substring(0, 6)}...{vehicle.blockchainAddress.substring(vehicle.blockchainAddress.length - 4)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Last Mileage Update</span>
                    <span>{vehicle.lastMileageUpdate ? new Date(vehicle.lastMileageUpdate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <button 
                    onClick={() => {
                      const url = getExplorerUrl(vehicle.blockchainAddress);
                      if (url) {
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    disabled={!vehicle.blockchainAddress}
                    className="inline-flex items-center text-sm text-primary-600 hover:text-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View on Explorer
                  </button>
                </>
              ) : (
                <div className="flex items-center text-gray-500">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>Not available</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Service History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Service History</h2>
            <div className="text-center py-8">
              <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No service history recorded yet</p>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* TrustScore */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">TrustScore</h2>
            <div className="flex justify-center">
              <TrustScoreDisplay score={vehicle.trustScore || 100} />
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fraud Alerts</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Verification Status</span>
                <span className="font-medium">Verified</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Last Updated</span>
                <span className="font-medium">Today</span>
              </div>
            </div>
          </motion.div>

          {/* Device Status */}
          <DeviceStatusCard 
            installationRequest={installationRequest || undefined} 
            onRequestInstall={handleRequestInstall}
            blockchainAddress={vehicle.blockchainAddress}
            vehicleId={vehicle.id}
          />

          {/* Blockchain History */}
          <BlockchainHistoryCard vehicleId={vehicle.id} />

          {/* Transaction History (Legacy - can be removed if not needed) */}
          {transactionHistory.length > 0 && (
            <TransactionHistory transactions={transactionHistory} />
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;