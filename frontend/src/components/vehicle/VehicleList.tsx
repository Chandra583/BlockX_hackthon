import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Calendar, 
  Gauge, 
  ExternalLink, 
  RefreshCw, 
  Plus,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Hash
} from 'lucide-react';
import { VehicleService, type Vehicle } from '../../services/vehicle';
import { BlockchainService } from '../../services/blockchain';

interface VehicleListProps {
  onVehicleSelect?: (vehicle: Vehicle) => void;
  onEditVehicle?: (vehicle: Vehicle) => void;
  onDeleteVehicle?: (vehicle: Vehicle) => void;
  onViewBlockchainHistory?: (vehicle: Vehicle) => void;
  showActions?: boolean;
  className?: string;
}

interface VehicleWithBlockchain extends Vehicle {
  blockchainHistory?: any[];
  lastMileageUpdate?: string;
  transactionCount?: number;
}

export const VehicleList: React.FC<VehicleListProps> = ({
  onVehicleSelect,
  onEditVehicle,
  onDeleteVehicle,
  onViewBlockchainHistory,
  showActions = true,
  className = ''
}) => {
  const [vehicles, setVehicles] = useState<VehicleWithBlockchain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch vehicles from API
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Test database connection first
      try {
        const dbTest = await VehicleService.testDatabase();
        console.log('Database test result:', dbTest);
      } catch (dbError) {
        console.error('Database test failed:', dbError);
      }
      
      // Get user's vehicles
      const response = await VehicleService.getUserVehicles();
      console.log('Vehicle API response:', response);
      const vehiclesData = response.data.vehicles;
      console.log('Vehicles data:', vehiclesData);
      
      // For each vehicle, fetch blockchain history
      const vehiclesWithBlockchain = await Promise.all(
        vehiclesData.map(async (vehicle) => {
          try {
            const blockchainHistory = await VehicleService.getVehicleBlockchainHistory(vehicle.id);
            return {
              ...vehicle,
              blockchainHistory: blockchainHistory.data || [],
              transactionCount: blockchainHistory.data?.length || 0,
              lastMileageUpdate: blockchainHistory.data?.[0]?.timestamp || null
            };
          } catch (err) {
            console.warn(`Failed to fetch blockchain history for vehicle ${vehicle.id}:`, err);
            return {
              ...vehicle,
              blockchainHistory: [],
              transactionCount: 0,
              lastMileageUpdate: null
            };
          }
        })
      );
      
      setVehicles(vehiclesWithBlockchain);
    } catch (err: any) {
      console.error('Failed to fetch vehicles:', err);
      setError(err.response?.data?.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  // Refresh vehicles
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVehicles();
    setRefreshing(false);
  };

  // Load vehicles on component mount
  useEffect(() => {
    fetchVehicles();
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get vehicle status color
  const getStatusColor = (vehicle: VehicleWithBlockchain) => {
    if (vehicle.verificationStatus === 'rejected') return 'text-red-700 bg-red-100';
    if (vehicle.isForSale) return 'text-green-600 bg-green-100';
    if (vehicle.verificationStatus === 'verified') return 'text-blue-600 bg-blue-100';
    if (vehicle.verificationStatus === 'pending') return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  // Get vehicle status text
  const getStatusText = (vehicle: VehicleWithBlockchain) => {
    if (vehicle.verificationStatus === 'rejected') return 'Rejected';
    if (vehicle.isForSale) return 'For Sale';
    if (vehicle.verificationStatus === 'verified') return 'Verified';
    if (vehicle.verificationStatus === 'pending') return 'Pending';
    return 'Active';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading vehicles...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Vehicles</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchVehicles}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Vehicles Found</h3>
          <p className="text-gray-600 mb-4">You haven't registered any vehicles yet.</p>
          <button
            onClick={() => onVehicleSelect?.(null as any)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Register Your First Vehicle
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">My Vehicles</h2>
            <p className="text-sm text-gray-600 mt-1">
              {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} registered
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            title="Refresh vehicles"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => onVehicleSelect?.(vehicle)}
            >
              {/* Vehicle Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Car className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {VehicleService.getVehicleDisplayName(vehicle)}
                    </h3>
                    <p className="text-sm text-gray-500 font-mono">{vehicle.vin}</p>
                    <p className="text-sm text-gray-600 font-mono">{vehicle.vehicleNumber}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle)}`}>
                  {getStatusText(vehicle)}
                </span>
              </div>
              {vehicle.verificationStatus === 'rejected' && vehicle.rejectionReason && (
                <div className="mt-2 p-2 border border-red-200 bg-red-50 rounded text-xs text-red-700">
                  <strong>Rejected:</strong> {vehicle.rejectionReason}
                </div>
              )}

              {/* Vehicle Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{vehicle.year}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Gauge className="w-4 h-4 mr-2" />
                  <span>{VehicleService.formatMileage(vehicle.mileage)}</span>
                </div>
                {vehicle.color && (
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-4 h-4 mr-2 rounded-full bg-gray-400" style={{ backgroundColor: vehicle.color.toLowerCase() }}></div>
                    <span className="capitalize">{vehicle.color}</span>
                  </div>
                )}
              </div>

              {/* Blockchain Info */}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                    <span>Blockchain Verified</span>
                  </div>
                  <span className="text-gray-500">
                    {vehicle.transactionCount} transaction{vehicle.transactionCount !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {vehicle.lastMileageUpdate && (
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>Last update: {formatDate(vehicle.lastMileageUpdate)}</span>
                  </div>
                )}

                {vehicle.blockchainAddress && (
                  <div className="mt-2">
                    <a
                      href={BlockchainService.getSolanaAddressUrl(vehicle.blockchainAddress, 'devnet')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View on Explorer
                    </a>
                  </div>
                )}
              </div>

              {/* Actions */}
              {showActions && (
                <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onVehicleSelect?.(vehicle);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditVehicle?.(vehicle);
                    }}
                    className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                    title="Edit vehicle"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {onViewBlockchainHistory && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewBlockchainHistory(vehicle);
                      }}
                      className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="View blockchain history"
                    >
                      <Hash className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteVehicle?.(vehicle);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete vehicle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VehicleList;
