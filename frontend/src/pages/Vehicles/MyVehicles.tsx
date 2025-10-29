import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car,
  Calendar,
  User,
  MapPin,
  TrendingUp,
  Shield,
  Clock,
  Eye,
  ExternalLink,
  Copy,
  Download,
  Share2,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Award,
  Activity,
  Database,
  Globe,
  Hash,
  Wallet,
  Mail,
  Phone,
  Building,
  Key,
  Lock,
  Unlock,
  FileText,
  BarChart3,
  PieChart,
  RefreshCw,
  Plus,
  Settings,
  MoreVertical,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { PurchaseAPI, type OwnershipHistory } from '../../api/purchase';
import { VehicleAPI } from '../../api/vehicle';
import toast from 'react-hot-toast';

interface Vehicle {
  _id: string;
  vin: string;
  vehicleNumber: string;
  make: string;
  vehicleModel: string;
  year: number;
  color: string;
  currentMileage: number;
  trustScore: number;
  ownerUserId: string;
  ownerWalletAddress?: string;
  ownershipHistory: Array<{
    ownerUserId: string | {
      _id: string;
      firstName: string;
      lastName: string;
      fullName: string;
      email: string;
      walletAddress?: string;
    };
    ownerWallet?: string;
    fromDate: string;
    toDate?: string;
    txHash?: string;
    saleRecordId?: string;
    note?: string;
    explorerUrl?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface OwnerInfo {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  walletAddress?: string;
}

export const MyVehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [ownershipHistory, setOwnershipHistory] = useState<OwnershipHistory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'current' | 'sold'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'trustScore' | 'mileage'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);

  useEffect(() => {
    fetchMyVehicles();
  }, []);

  const fetchMyVehicles = async () => {
    try {
      setLoading(true);
      // This would be a new API endpoint to get user's owned vehicles
      const response = await VehicleAPI.getMyVehicles();
      setVehicles(response.data);
    } catch (error: any) {
      console.error('Failed to fetch vehicles:', error?.message || String(error));
      toast.error('Failed to load your vehicles');
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnershipHistory = async (vehicleId: string) => {
    try {
      const response = await PurchaseAPI.getOwnershipHistory(vehicleId);
      setOwnershipHistory(response.data);
    } catch (error: any) {
      console.error('Failed to fetch ownership history:', error?.message || String(error));
      toast.error('Failed to load ownership history');
    }
  };

  const handleViewHistory = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    await fetchOwnershipHistory(vehicle._id);
    setShowHistoryModal(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400 bg-green-400/20';
    if (score >= 60) return 'text-yellow-400 bg-yellow-400/20';
    if (score >= 40) return 'text-orange-400 bg-orange-400/20';
    return 'text-red-400 bg-red-400/20';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'text-green-400 bg-green-400/20';
      case 'sold': return 'text-blue-400 bg-blue-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-slate-400 bg-slate-400/20';
    }
  };

  const filteredVehicles = vehicles
    .filter(vehicle => {
      const matchesSearch = 
        vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.vin.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterStatus === 'all' || 
        (filterStatus === 'current' && vehicle.ownerUserId) ||
        (filterStatus === 'sold' && !vehicle.ownerUserId);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'trustScore':
          comparison = a.trustScore - b.trustScore;
          break;
        case 'mileage':
          comparison = a.currentMileage - b.currentMileage;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const toggleVehicleExpansion = (vehicleId: string) => {
    setExpandedVehicle(expandedVehicle === vehicleId ? null : vehicleId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-600/20 rounded-xl">
                <Car className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">My Vehicles</h1>
                <p className="text-slate-300">Manage and view your vehicle ownership history</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchMyVehicles}
                disabled={loading}
                className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-600/20 rounded-lg">
                <Car className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Vehicles</p>
                <p className="text-2xl font-bold text-white">{vehicles.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Award className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Avg Trust Score</p>
                <p className="text-2xl font-bold text-white">
                  {vehicles.length > 0 ? Math.round(vehicles.reduce((sum, v) => sum + v.trustScore, 0) / vehicles.length) : 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total km driven</p>
                <p className="text-2xl font-bold text-white">
                  {vehicles.reduce((sum, v) => sum + v.currentMileage, 0).toLocaleString()} km
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-600/20 rounded-lg">
                <Activity className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Active Ownership</p>
                <p className="text-2xl font-bold text-white">
                  {vehicles.filter(v => v.ownerUserId).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search vehicles by make, model, VIN, or vehicle number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
              >
                <option value="all">All Vehicles</option>
                <option value="current">Currently Owned</option>
                <option value="sold">Previously Owned</option>
              </select>
              
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as any);
                  setSortOrder(order as any);
                }}
                className="px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="trustScore-desc">Highest Trust Score</option>
                <option value="trustScore-asc">Lowest Trust Score</option>
                <option value="mileage-desc">Highest Mileage</option>
                <option value="mileage-asc">Lowest Mileage</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vehicles List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
            <span className="ml-3 text-slate-300">Loading vehicles...</span>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No Vehicles Found</h3>
            <p className="text-slate-400">
              {searchTerm ? 'No vehicles match your search criteria.' : 'You don\'t have any vehicles yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVehicles.map((vehicle) => (
              <motion.div
                key={vehicle._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:shadow-xl"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Vehicle Header */}
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="p-3 bg-blue-600/20 rounded-xl">
                          <Car className="w-8 h-8 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold text-white">
                              {vehicle.make} {vehicle.vehicleModel} ({vehicle.year})
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTrustScoreColor(vehicle.trustScore)}`}>
                              {vehicle.trustScore}/100
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-400">VIN:</span>
                              <span className="text-slate-300 font-mono text-xs">{vehicle.vin}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-400">Vehicle No:</span>
                              <span className="text-slate-300 font-semibold">{vehicle.vehicleNumber}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-400">total km driven:</span>
                              <span className="text-slate-300">{vehicle.currentMileage?.toLocaleString()} km</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-400">Color:</span>
                              <span className="text-slate-300 capitalize">{vehicle.color}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-400">Ownership:</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.ownerUserId ? 'current' : 'sold')}`}>
                                {vehicle.ownerUserId ? 'Current Owner' : 'Previously Owned'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-400">Ownership History:</span>
                              <span className="text-slate-300">{vehicle.ownershipHistory?.length || 0} records</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ownership History Preview */}
                      {vehicle.ownershipHistory && vehicle.ownershipHistory.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-white flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <span>Ownership History</span>
                            </h4>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => toggleVehicleExpansion(vehicle._id)}
                              className="flex items-center space-x-1 text-slate-400 hover:text-slate-300 transition-colors"
                            >
                              <span className="text-sm">
                                {expandedVehicle === vehicle._id ? 'Show Less' : 'Show More'}
                              </span>
                              {expandedVehicle === vehicle._id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </motion.button>
                          </div>
                          
                          <div className="space-y-2">
                            {vehicle.ownershipHistory.slice(0, expandedVehicle === vehicle._id ? undefined : 2).map((record, index) => (
                              <div key={index} className="bg-slate-700/30 rounded-lg p-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-3 flex-1">
                                    <div className={`w-2 h-2 rounded-full mt-2 ${index === 0 ? 'bg-green-400' : 'bg-slate-400'}`} />
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <p className="text-slate-300 font-medium">
                                          {index === 0 ? 'Current Owner' : `Previous Owner ${index}`}
                                        </p>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${index === 0 ? 'text-green-400 bg-green-400/20' : 'text-slate-400 bg-slate-400/20'}`}>
                                          {index === 0 ? 'Active' : 'Previous'}
                                        </span>
                                      </div>
                                      
                                      {/* Owner Details */}
                                      <div className="space-y-1 mb-2">
                                        {record.ownerUserId && typeof record.ownerUserId === 'object' ? (
                                          <div>
                                            <p className="text-slate-200 font-semibold text-sm">
                                              {record.ownerUserId.fullName || `${record.ownerUserId.firstName} ${record.ownerUserId.lastName}`}
                                            </p>
                                            <p className="text-slate-400 text-xs">
                                              {record.ownerUserId.email}
                                            </p>
                                            {record.ownerUserId.walletAddress && (
                                              <div className="flex items-center space-x-1 mt-1">
                                                <Wallet className="w-3 h-3 text-slate-500" />
                                                <span className="text-slate-500 text-xs font-mono">
                                                  {record.ownerUserId.walletAddress.slice(0, 8)}...{record.ownerUserId.walletAddress.slice(-8)}
                                                </span>
                                                <motion.button
                                                  whileHover={{ scale: 1.05 }}
                                                  whileTap={{ scale: 0.95 }}
                                                  onClick={() => copyToClipboard(record.ownerUserId.walletAddress)}
                                                  className="p-1 rounded bg-slate-600/50 hover:bg-slate-500/50 text-slate-400 hover:text-slate-300 transition-colors"
                                                >
                                                  <Copy className="w-3 h-3" />
                                                </motion.button>
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div>
                                            <p className="text-slate-300 text-sm font-mono">
                                              Owner ID: {record.ownerUserId}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Ownership Period */}
                                      <div className="flex items-center space-x-2">
                                        <Calendar className="w-3 h-3 text-slate-500" />
                                        <p className="text-slate-400 text-xs">
                                          {new Date(record.fromDate).toLocaleDateString()} - {record.toDate ? new Date(record.toDate).toLocaleDateString() : 'Present'}
                                        </p>
                                      </div>
                                      
                                      {/* Transaction Note */}
                                      {record.note && (
                                        <div className="mt-2 p-2 bg-slate-600/30 rounded text-xs text-slate-300">
                                          <strong>Note:</strong> {record.note}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Transaction Hash */}
                                  {record.txHash && (
                                    <div className="flex flex-col items-end space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <Database className="w-3 h-3 text-slate-500" />
                                        <span className="text-slate-400 text-xs font-mono">
                                          {record.txHash.slice(0, 8)}...{record.txHash.slice(-8)}
                                        </span>
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => copyToClipboard(record.txHash)}
                                          className="p-1 rounded bg-slate-600/50 hover:bg-slate-500/50 text-slate-400 hover:text-slate-300 transition-colors"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </motion.button>
                                      </div>
                                      {record.explorerUrl && (
                                        <a 
                                          href={record.explorerUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                          <span>View on Explorer</span>
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 ml-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewHistory(vehicle)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600/20 to-blue-500/20 hover:from-blue-600/30 hover:to-blue-500/30 text-blue-400 hover:text-blue-300 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 border border-blue-600/30 hover:border-blue-600/50"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View History</span>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-gradient-to-r from-slate-600/20 to-slate-500/20 hover:from-slate-600/30 hover:to-slate-500/30 text-slate-400 hover:text-slate-300 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 border border-slate-600/30 hover:border-slate-600/50"
                      >
                        <FileText className="w-4 h-4" />
                        <span>View Details</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Ownership History Modal */}
        <AnimatePresence>
          {showHistoryModal && selectedVehicle && ownershipHistory && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                  onClick={() => setShowHistoryModal(false)}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-full max-w-4xl mx-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700/50"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-600/20 rounded-xl">
                        <Clock className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Ownership History</h2>
                        <p className="text-sm text-slate-300">
                          {selectedVehicle.make} {selectedVehicle.vehicleModel} ({selectedVehicle.year})
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowHistoryModal(false)}
                      className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="space-y-4">
                      {ownershipHistory.ownershipHistory.map((record, index) => (
                        <div key={index} className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                          <div className="flex items-start space-x-4">
                            <div className={`p-2 rounded-lg ${index === 0 ? 'bg-green-600/20' : 'bg-slate-600/20'}`}>
                              {index === 0 ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              ) : (
                                <User className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-white">
                                  {index === 0 ? 'Current Owner' : `Previous Owner ${index}`}
                                </h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${index === 0 ? 'text-green-400 bg-green-400/20' : 'text-slate-400 bg-slate-400/20'}`}>
                                  {index === 0 ? 'Active' : 'Previous'}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                  {/* Owner Details */}
                                  {record.ownerUserId && typeof record.ownerUserId === 'object' ? (
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Owner Name:</span>
                                        <span className="text-slate-200 font-semibold">
                                          {record.ownerUserId.fullName || `${record.ownerUserId.firstName} ${record.ownerUserId.lastName}`}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Email:</span>
                                        <span className="text-slate-300">{record.ownerUserId.email}</span>
                                      </div>
                                      {record.ownerUserId.walletAddress && (
                                        <div className="flex justify-between">
                                          <span className="text-slate-400">Wallet:</span>
                                          <div className="flex items-center space-x-2">
                                            <span className="text-slate-300 font-mono text-xs">
                                              {record.ownerUserId.walletAddress.slice(0, 8)}...{record.ownerUserId.walletAddress.slice(-8)}
                                            </span>
                                            <motion.button
                                              whileHover={{ scale: 1.05 }}
                                              whileTap={{ scale: 0.95 }}
                                              onClick={() => copyToClipboard(record.ownerUserId.walletAddress)}
                                              className="p-1 rounded bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-slate-300 transition-colors"
                                            >
                                              <Copy className="w-3 h-3" />
                                            </motion.button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Owner ID:</span>
                                      <span className="text-slate-300 font-mono text-xs">{record.ownerUserId}</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">From Date:</span>
                                    <span className="text-slate-300">{new Date(record.fromDate).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">To Date:</span>
                                    <span className="text-slate-300">
                                      {record.toDate ? new Date(record.toDate).toLocaleString() : 'Present'}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  {record.ownerWallet && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Wallet:</span>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-slate-300 font-mono text-xs">
                                          {record.ownerWallet.slice(0, 8)}...{record.ownerWallet.slice(-8)}
                                        </span>
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => copyToClipboard(record.ownerWallet || '')}
                                          className="p-1 rounded bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-slate-300 transition-colors"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </motion.button>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {record.txHash && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Transaction:</span>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-slate-300 font-mono text-xs">
                                          {record.txHash.slice(0, 8)}...{record.txHash.slice(-8)}
                                        </span>
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => copyToClipboard(record.txHash || '')}
                                          className="p-1 rounded bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-slate-300 transition-colors"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </motion.button>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {record.note && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Note:</span>
                                      <span className="text-slate-300 text-xs">{record.note}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {record.explorerUrl && (
                                <div className="mt-3 pt-3 border-t border-slate-700/50">
                                  <div className="flex items-center space-x-2">
                                    <ExternalLink className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-400 text-sm">View on Explorer:</span>
                                    <a 
                                      href={record.explorerUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-400 hover:text-blue-300 text-sm"
                                    >
                                      {record.explorerUrl}
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MyVehicles;
