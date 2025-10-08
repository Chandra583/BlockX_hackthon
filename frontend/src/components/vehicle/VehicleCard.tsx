import React from 'react';
import { 
  Car, 
  Calendar, 
  Gauge, 
  ExternalLink, 
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { type Vehicle } from '../../services/vehicle';
import { BlockchainService } from '../../services/blockchain';

interface VehicleCardProps {
  vehicle: Vehicle;
  onView?: (vehicle: Vehicle) => void;
  onEdit?: (vehicle: Vehicle) => void;
  onDelete?: (vehicle: Vehicle) => void;
  showActions?: boolean;
  className?: string;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  className = ''
}) => {
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get vehicle status color
  const getStatusColor = (vehicle: Vehicle) => {
    if (vehicle.isForSale) return 'text-green-600 bg-green-100';
    if (vehicle.verificationStatus === 'verified') return 'text-blue-600 bg-blue-100';
    if (vehicle.verificationStatus === 'pending') return 'text-yellow-600 bg-yellow-100';
    if (vehicle.verificationStatus === 'rejected') return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  // Get vehicle status text
  const getStatusText = (vehicle: Vehicle) => {
    if (vehicle.isForSale) return 'For Sale';
    if (vehicle.verificationStatus === 'verified') return 'Verified';
    if (vehicle.verificationStatus === 'pending') return 'Pending Verification';
    if (vehicle.verificationStatus === 'rejected') return 'Rejected';
    return 'Active';
  };

  // Get status icon
  const getStatusIcon = (vehicle: Vehicle) => {
    if (vehicle.isForSale) return <DollarSign className="w-4 h-4" />;
    if (vehicle.verificationStatus === 'verified') return <CheckCircle className="w-4 h-4" />;
    if (vehicle.verificationStatus === 'pending') return <Clock className="w-4 h-4" />;
    if (vehicle.verificationStatus === 'rejected') return <AlertTriangle className="w-4 h-4" />;
    return <Car className="w-4 h-4" />;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${className}`}>
      {/* Vehicle Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h3>
              <p className="text-sm text-gray-500 font-mono">{vehicle.vin}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(vehicle)}`}>
              {getStatusIcon(vehicle)}
              <span className="ml-1">{getStatusText(vehicle)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{vehicle.year}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Gauge className="w-4 h-4 mr-2" />
            <span>{vehicle.mileage.toLocaleString()} miles</span>
          </div>
          {vehicle.color && (
            <div className="flex items-center text-sm text-gray-600">
              <div 
                className="w-4 h-4 mr-2 rounded-full border border-gray-300" 
                style={{ backgroundColor: vehicle.color.toLowerCase() }}
              ></div>
              <span className="capitalize">{vehicle.color}</span>
            </div>
          )}
          {vehicle.bodyType && (
            <div className="flex items-center text-sm text-gray-600">
              <Car className="w-4 h-4 mr-2" />
              <span className="capitalize">{vehicle.bodyType.replace('_', ' ')}</span>
            </div>
          )}
        </div>

        {/* Additional Details */}
        {(vehicle.fuelType || vehicle.transmission) && (
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
            {vehicle.fuelType && (
              <div>
                <span className="font-medium">Fuel:</span> {vehicle.fuelType}
              </div>
            )}
            {vehicle.transmission && (
              <div>
                <span className="font-medium">Transmission:</span> {vehicle.transmission}
              </div>
            )}
          </div>
        )}

        {/* Blockchain Information */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">Blockchain Status</h4>
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">Verified</span>
            </div>
          </div>
          
          {vehicle.blockchainAddress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Blockchain Address:</span>
                <span className="font-mono text-gray-700">
                  {vehicle.blockchainAddress.slice(0, 8)}...{vehicle.blockchainAddress.slice(-8)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Network:</span>
                <span className="text-gray-700">Solana Devnet</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Registered:</span>
                <span className="text-gray-700">{formatDate(vehicle.createdAt)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Marketplace Info */}
        {vehicle.isForSale && (
          <div className="bg-green-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-green-700">
                <DollarSign className="w-4 h-4 mr-2" />
                <span className="font-medium">Listed for Sale</span>
              </div>
              {vehicle.price && (
                <span className="text-lg font-bold text-green-700">
                  ${vehicle.price.toLocaleString()}
                </span>
              )}
            </div>
            {vehicle.description && (
              <p className="text-sm text-green-600 mt-2">{vehicle.description}</p>
            )}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              {vehicle.blockchainAddress && (
                <a
                  href={BlockchainService.getSolanaAddressUrl(vehicle.blockchainAddress, 'devnet')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View on Explorer
                </a>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onView?.(vehicle)}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="View details"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => onEdit?.(vehicle)}
                className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                title="Edit vehicle"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete?.(vehicle)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete vehicle"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleCard;
