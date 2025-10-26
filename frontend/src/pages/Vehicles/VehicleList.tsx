import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, 
  Plus, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc,
  Grid3X3,
  List,
  Download,
  RefreshCw,
  Settings,
  TrendingUp,
  Shield,
  Smartphone,
  AlertTriangle
} from 'lucide-react';
import { VehicleService } from '../../services/vehicle';
import { InstallationService } from '../../services/installation';
import { TelemetryService } from '../../services/telemetry';
import { TrustService } from '../../services/trust';
import { VehicleCard } from '../../components/vehicle/VehicleCard';
import toast from 'react-hot-toast';
import useSocket from '../../hooks/useSocket';

interface Vehicle {
  id: string;
  vin: string;
  vehicleNumber: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  currentMileage: number;
  trustScore: number;
  verificationStatus?: string;
  isForSale?: boolean;
  createdAt: string;
  lastOBDUpdate?: string;
  deviceId?: string;
  blockchainTx?: string;
  fraudAlerts?: number;
}

import type { InstallationRequestSummaryItem } from '../../services/installation';

// Filter and Sort Types
interface FilterState {
  status: string;
  trustScoreRange: [number, number];
  deviceConnected: boolean | null;
  verified: boolean | null;
}

interface SortState {
  field: 'createdAt' | 'mileage' | 'trustScore' | 'lastUpdate';
  direction: 'asc' | 'desc';
}

// Filter Modal Component
const FilterModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}> = ({ isOpen, onClose, filters, onFiltersChange }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-bold text-white mb-6">Filter Vehicles</h3>
          
          <div className="space-y-6">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Status</label>
              <div className="grid grid-cols-2 gap-2">
                {['all', 'verified', 'pending', 'flagged'].map((status) => (
                  <button
                    key={status}
                    onClick={() => onFiltersChange({ ...filters, status })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filters.status === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Trust Score Range */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Trust Score: {filters.trustScoreRange[0]} - {filters.trustScoreRange[1]}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.trustScoreRange[0]}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  trustScoreRange: [parseInt(e.target.value), filters.trustScoreRange[1]]
                })}
                className="w-full"
              />
            </div>

            {/* Device Connected */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Device Status</label>
              <div className="space-y-2">
                {[
                  { value: null, label: 'All' },
                  { value: true, label: 'Connected' },
                  { value: false, label: 'Not Connected' }
                ].map((option) => (
                  <label key={option.label} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="deviceConnected"
                      checked={filters.deviceConnected === option.value}
                      onChange={() => onFiltersChange({ ...filters, deviceConnected: option.value })}
                      className="text-blue-600"
                    />
                    <span className="text-gray-300">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700/50 text-gray-300 rounded-lg hover:bg-slate-600/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const VehicleList: React.FC = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  
  // State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [installationSummary, setInstallationSummary] = useState<Record<string, InstallationRequestSummaryItem>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingOBD, setLoadingOBD] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortState>({ field: 'createdAt', direction: 'desc' });
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    trustScoreRange: [0, 100],
    deviceConnected: null,
    verified: null
  });

  // Computed filtered and sorted vehicles
  const filteredAndSortedVehicles = useMemo(() => {
    let filtered = vehicles;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(vehicle => 
        vehicle.vin.toLowerCase().includes(term) ||
        vehicle.vehicleNumber.toLowerCase().includes(term) ||
        vehicle.make.toLowerCase().includes(term) ||
        vehicle.model.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(vehicle => {
        if (filters.status === 'verified') return vehicle.verificationStatus === 'verified';
        if (filters.status === 'pending') return vehicle.verificationStatus === 'pending';
        if (filters.status === 'flagged') return (vehicle.fraudAlerts && vehicle.fraudAlerts > 0);
        return true;
      });
    }

    // Trust score filter
    filtered = filtered.filter(vehicle => 
      vehicle.trustScore >= filters.trustScoreRange[0] && 
      vehicle.trustScore <= filters.trustScoreRange[1]
    );

    // Device connected filter
    if (filters.deviceConnected !== null) {
      filtered = filtered.filter(vehicle => {
        const hasDevice = installationSummary[vehicle.id]?.status === 'completed';
        return filters.deviceConnected ? hasDevice : !hasDevice;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy.field) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'mileage':
          aValue = a.currentMileage;
          bValue = b.currentMileage;
          break;
        case 'trustScore':
          aValue = a.trustScore;
          bValue = b.trustScore;
          break;
        case 'lastUpdate':
          aValue = new Date(a.lastOBDUpdate || a.createdAt).getTime();
          bValue = new Date(b.lastOBDUpdate || b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (sortBy.direction === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return filtered;
  }, [vehicles, searchTerm, filters, sortBy, installationSummary]);

  // Fetch data
  const fetchVehiclesAndInstallationSummary = async () => {
    try {
      setLoading(true);
      
      // Fetch vehicles
      const vehicleResponse = await VehicleService.getUserVehicles();
      
      // Map the response to our interface
      const mappedVehicles = vehicleResponse.data.vehicles.map(vehicle => ({
        id: vehicle.id,
        vin: vehicle.vin,
        vehicleNumber: vehicle.vehicleNumber || '',
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        currentMileage: vehicle.currentMileage || 0,
        trustScore: (vehicle as any).trustScore || 100,
        verificationStatus: vehicle.verificationStatus,
        isForSale: vehicle.isForSale,
        createdAt: vehicle.createdAt,
        lastOBDUpdate: (vehicle as any).lastOBDUpdate,
        deviceId: (vehicle as any).deviceId,
        blockchainTx: (vehicle as any).blockchainTx,
        fraudAlerts: (vehicle as any).fraudAlerts || 0
      }));
      
      setVehicles(mappedVehicles);
      
      // Fetch installation request summary
      const summaryResponse = await InstallationService.getInstallationRequestSummary();
      setInstallationSummary(summaryResponse.data);
      
      // Fetch OBD data for each vehicle
      
      await fetchOBDDataForVehicles(mappedVehicles);
    } catch (error) {
      console.error('Failed to fetch vehicles or installation summary:', error);
      toast.error('Failed to load vehicles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch OBD data for vehicles
  const fetchOBDDataForVehicles = async (vehicles: Vehicle[]) => {
    if (vehicles.length === 0) return;
    
    try {
      setLoadingOBD(true);
      const obdPromises = vehicles.map(async (vehicle) => {
        try {
          const obdResponse = await TelemetryService.getLatestOBDData(vehicle.id);
          // Extract data from the correct structure
          const latestData = obdResponse.data?.latest;
          return {
            vehicleId: vehicle.id,
            lastOBDUpdate: latestData?.lastReading?.recordedAt,
            deviceId: latestData?.deviceID,
            mileage: latestData?.lastReading?.mileage
          };
        } catch (error) {
          console.warn(`Failed to fetch OBD data for vehicle ${vehicle.id}:`, error);
          return {
            vehicleId: vehicle.id,
            lastOBDUpdate: null,
            deviceId: null,
            mileage: null
          };
        }
      });

      const obdResults = await Promise.all(obdPromises);
      
      // Update vehicles with OBD data
      setVehicles(prevVehicles => 
        prevVehicles.map(vehicle => {
          const obdData = obdResults.find(obd => obd.vehicleId === vehicle.id);
          const installationData = installationSummary[vehicle.id];
          
          return {
            ...vehicle,
            lastOBDUpdate: obdData?.lastOBDUpdate || vehicle.lastOBDUpdate,
            deviceId: obdData?.deviceId || installationData?.deviceId || vehicle.deviceId,
            currentMileage: obdData?.mileage || vehicle.currentMileage
          };
        })
      );
    } catch (error) {
      console.error('Failed to fetch OBD data:', error);
      toast.error('Failed to load OBD data for some vehicles');
    } finally {
      setLoadingOBD(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVehiclesAndInstallationSummary();
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  // Event handlers
  const handleViewDetails = (vehicleId: string) => {
    navigate(`/vehicles/${vehicleId}`);
  };

  const handleEdit = (vehicleId: string) => {
    navigate(`/vehicles/${vehicleId}/edit`);
  };

  const handleDelete = async (vehicleId: string) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await VehicleService.deleteVehicle(vehicleId);
        setVehicles(prev => prev.filter(v => v.id !== vehicleId));
        toast.success('Vehicle deleted successfully');
      } catch (error) {
        console.error('Failed to delete vehicle:', error);
        toast.error('Failed to delete vehicle');
      }
    }
  };

  const handleGenerateReport = (vehicleId: string) => {
    // TODO: Implement report generation
    toast.success('Report generation started');
  };

  const handleListMarketplace = (vehicleId: string) => {
    navigate(`/marketplace/list/${vehicleId}`);
  };

  const handleUpdateMileage = (vehicleId: string) => {
    navigate(`/vehicles/${vehicleId}/mileage`);
  };

  // Socket listeners for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('vehicle_updated', (updatedVehicle: any) => {
        setVehicles(prev => 
          prev.map(v => v.id === updatedVehicle.id ? { ...v, ...updatedVehicle } : v)
        );
      });

      socket.on('telemetry_updated', (data: any) => {
        setVehicles(prev => 
          prev.map(v => v.id === data.vehicleId ? { ...v, lastOBDUpdate: data.timestamp } : v)
        );
      });

      return () => {
        socket.off('vehicle_updated');
        socket.off('telemetry_updated');
      };
    }
  }, [socket]);

  // Initial load
  useEffect(() => {
    fetchVehiclesAndInstallationSummary();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-8 bg-slate-700/50 rounded-lg w-48 animate-pulse"></div>
                <div className="h-4 bg-slate-700/30 rounded w-64 animate-pulse"></div>
              </div>
              <div className="h-10 bg-slate-700/50 rounded-lg w-40 animate-pulse"></div>
            </div>
            
            {/* Search Skeleton */}
            <div className="flex gap-4">
              <div className="h-12 bg-slate-700/50 rounded-xl flex-1 animate-pulse"></div>
              <div className="h-12 bg-slate-700/50 rounded-xl w-32 animate-pulse"></div>
            </div>
            
            {/* Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 animate-pulse">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <div className="h-6 bg-slate-700/50 rounded w-32"></div>
                      <div className="h-6 bg-slate-700/50 rounded w-12"></div>
                    </div>
                    <div className="h-4 bg-slate-700/30 rounded w-24"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-700/30 rounded w-full"></div>
                      <div className="h-3 bg-slate-700/30 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <motion.div 
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6 mb-6 lg:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              My Vehicles
            </h1>
            <p className="text-gray-400 text-sm sm:text-base lg:text-lg">
              Manage your registered vehicles and their blockchain records
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Car className="w-3 h-3 sm:w-4 sm:h-4" />
                {filteredAndSortedVehicles.length} vehicles
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                {filteredAndSortedVehicles.filter(v => v.verificationStatus === 'verified').length} verified
              </span>
              <span className="flex items-center gap-1">
                <Smartphone className="w-3 h-3 sm:w-4 sm:h-4" />
                {filteredAndSortedVehicles.filter(v => installationSummary[v.id]?.status === 'completed').length} with devices
              </span>
              {loadingOBD && (
                <span className="flex items-center gap-1 text-blue-400">
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  Loading OBD data...
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <motion.button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-slate-700/50 text-gray-300 rounded-xl hover:bg-slate-600/50 transition-colors disabled:opacity-50 text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </motion.button>
            
            <motion.button
              onClick={() => navigate('/owner/vehicles/register')}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Register Vehicle</span>
              <span className="sm:hidden">Register</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Search and Controls */}
        <motion.div 
          className="flex flex-col lg:flex-row gap-4 mb-6 lg:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 text-sm sm:text-base"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Sort */}
            <select
              value={`${sortBy.field}-${sortBy.direction}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setSortBy({ field: field as any, direction: direction as any });
              }}
              className="px-3 sm:px-4 py-2 sm:py-3 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="trustScore-desc">Trust Score (High)</option>
              <option value="trustScore-asc">Trust Score (Low)</option>
              <option value="mileage-desc">Mileage (High)</option>
              <option value="mileage-asc">Mileage (Low)</option>
              <option value="lastUpdate-desc">Last Update</option>
            </select>
            
            {/* View Mode */}
            <div className="flex bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Grid view"
              >
                <Grid3X3 className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
                title="List view"
              >
                <List className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
            
            {/* Filters */}
            <motion.button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl text-gray-300 hover:text-white hover:bg-slate-700/60 transition-colors text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Filters</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Vehicle Grid/List */}
        <AnimatePresence mode="wait">
          {filteredAndSortedVehicles.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center"
            >
              <Car className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">No vehicles found</h3>
              <p className="text-gray-400 mb-8 text-lg">
                {searchTerm || filters.status !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Get started by registering your first vehicle'
                }
              </p>
              <motion.button
                onClick={() => navigate('/owner/vehicles/register')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-5 h-5" />
                Register Vehicle
              </motion.button>
            </motion.div>
          ) : (
            <motion.div 
              key="vehicles"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`grid gap-4 sm:gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' 
                  : 'grid-cols-1'
              }`}
            >
              {filteredAndSortedVehicles.map((vehicle, index) => (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <VehicleCard
                    vehicle={vehicle}
                    installationRequest={installationSummary[vehicle.id]}
                    onViewDetails={handleViewDetails}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onGenerateReport={handleGenerateReport}
                    onListMarketplace={handleListMarketplace}
                    onUpdateMileage={handleUpdateMileage}
                  />
                </motion.div>
              ))}
              
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Modal */}
        <FilterModal
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>
    </div>
  );
};

export default VehicleList;