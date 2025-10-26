import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Car, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Clock,
  Smartphone,
  Shield,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
// Removed TrustScoreCard import to prevent overlay issues

interface VehicleCardProps {
  vehicle: {
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
  };
  installationRequest?: {
    status: string;
    deviceId?: string;
  };
  onViewDetails: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onGenerateReport: (id: string) => void;
  onListMarketplace: (id: string) => void;
  onUpdateMileage: (id: string) => void;
  className?: string;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  installationRequest,
  onViewDetails,
  onEdit,
  onDelete,
  onGenerateReport,
  onListMarketplace,
  onUpdateMileage,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  

  const getStatusBadges = () => {
    const badges = [];
    
    // Verification Status
    if (vehicle.verificationStatus === 'verified') {
      badges.push({
        text: 'Verified',
        icon: <CheckCircle className="w-3 h-3" />,
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      });
    } else if (vehicle.verificationStatus === 'pending') {
      badges.push({
        text: 'Pending',
        icon: <Clock className="w-3 h-3" />,
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      });
    }

    // Device Status
    if (installationRequest?.status === 'completed') {
      badges.push({
        text: 'Installed',
        icon: <Smartphone className="w-3 h-3" />,
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      });
    } else if (installationRequest?.status === 'assigned') {
      badges.push({
        text: 'Assigned',
        icon: <Clock className="w-3 h-3" />,
        color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
      });
    }

    // Fraud Alerts
    if (vehicle.fraudAlerts && vehicle.fraudAlerts > 0) {
      badges.push({
        text: 'Flagged',
        icon: <AlertTriangle className="w-3 h-3" />,
        color: 'bg-red-500/20 text-red-400 border-red-500/30'
      });
    }

    return badges;
  };

  const formatLastUpdate = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      // For older dates, show the actual date
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const statusBadges = getStatusBadges();

  return (
    <motion.div
      className={`group relative bg-gradient-to-br from-slate-800/60 to-slate-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-slate-700/50 shadow-xl sm:shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:scale-[1.02] ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hero Area */}
      <div className="relative p-4 sm:p-6">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-50" />
        
        {/* Header */}
        <div className="relative flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-1 truncate">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 font-mono truncate">
              {vehicle.vin.substring(0, 8)}...{vehicle.vin.substring(vehicle.vin.length - 4)}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
              {vehicle.vehicleNumber}
            </p>
          </div>
          
          {/* TrustScore Badge */}
          <div className="flex-shrink-0 ml-2">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-600"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`${vehicle.trustScore >= 80 ? 'text-green-500' : vehicle.trustScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray={`${vehicle.trustScore}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{vehicle.trustScore}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        {statusBadges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {statusBadges.map((badge, index) => (
              <motion.div
                key={index}
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium border ${badge.color}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-3 h-3 sm:w-4 sm:h-4">{badge.icon}</div>
                <span className="hidden sm:inline">{badge.text}</span>
                <span className="sm:hidden">{badge.text.charAt(0)}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="space-y-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Mileage</p>
            <p className="text-sm sm:text-lg font-semibold text-white">
              {vehicle.currentMileage.toLocaleString()} km
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Last OBD</p>
            <p className="text-xs sm:text-sm text-gray-300">
              {formatLastUpdate(vehicle.lastOBDUpdate)}
            </p>
          </div>
        </div>

        {/* Device & Blockchain Info */}
        <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
          {vehicle.deviceId ? (
            <div className="flex items-center gap-1.5 sm:gap-2 text-green-400">
              <Smartphone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">Device: {vehicle.deviceId}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500">
              <Smartphone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">No device connected</span>
            </div>
          )}
          {vehicle.blockchainTx && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-blue-400">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">Anchored to blockchain</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <motion.div 
        className="bg-slate-800/50 backdrop-blur-sm border-t border-slate-700/50 p-3 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0.7 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex gap-2">
            <motion.button
              onClick={() => onViewDetails(vehicle.id)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors text-xs sm:text-sm font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">View Details</span>
              <span className="sm:hidden">View</span>
            </motion.button>
            
            <motion.button
              onClick={() => onUpdateMileage(vehicle.id)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-700/50 text-gray-300 rounded-lg hover:bg-slate-600/50 transition-colors text-xs sm:text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Update</span>
            </motion.button>
          </div>

          <div className="flex gap-1 justify-end">
            <motion.button
              onClick={() => onGenerateReport(vehicle.id)}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-400 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Generate Report"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
            </motion.button>
            
            <motion.button
              onClick={() => onListMarketplace(vehicle.id)}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-green-400 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="List on Marketplace"
            >
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
            </motion.button>
            
            <motion.button
              onClick={() => onEdit(vehicle.id)}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-amber-400 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Edit Vehicle"
            >
              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
            </motion.button>
            
            <motion.button
              onClick={() => onDelete(vehicle.id)}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-red-400 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Delete Vehicle"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default VehicleCard;