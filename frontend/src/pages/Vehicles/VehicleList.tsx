import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, Plus, Search, Filter, Eye, Edit, Trash2, Clock, CheckCircle, Smartphone } from 'lucide-react';
import { VehicleService } from '../../services/vehicle';
import { InstallationService } from '../../services/installation';
import toast from 'react-hot-toast';

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
}

import type { InstallationRequestSummaryItem } from '../../services/installation';

const TrustScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  let bgColor = 'bg-green-100 text-green-800';
  if (score < 70) bgColor = 'bg-red-100 text-red-800';
  else if (score < 90) bgColor = 'bg-yellow-100 text-yellow-800';
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
      {score}
    </span>
  );
};

const DeviceRequestStatus: React.FC<{ request?: InstallationRequestSummaryItem }> = ({ request }) => {
  if (!request) return null;

  let statusText = '';
  let statusColor = '';
  let statusIcon = <Clock className="w-4 h-4" />;

  switch (request.status) {
    case 'requested':
      statusText = 'Requested';
      statusColor = 'bg-gray-100 text-gray-800';
      statusIcon = <Clock className="w-4 h-4" />;
      break;
    case 'assigned':
      statusText = 'Assigned';
      statusColor = 'bg-blue-100 text-blue-800';
      statusIcon = <Clock className="w-4 h-4" />;
      break;
    case 'completed':
      statusText = 'Installed';
      statusColor = 'bg-green-100 text-green-800';
      statusIcon = <CheckCircle className="w-4 h-4" />;
      break;
    default:
      statusText = 'Unknown';
      statusColor = 'bg-gray-100 text-gray-800';
  }

  return (
    <div className="mt-2">
      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
        {statusIcon}
        <span className="ml-1">{statusText}</span>
      </div>
      {request.deviceId && (
        <p className="text-xs text-gray-500 mt-1">Device: {request.deviceId}</p>
      )}
    </div>
  );
};

const VehicleList: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [installationSummary, setInstallationSummary] = useState<Record<string, InstallationRequestSummaryItem>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    fetchVehiclesAndInstallationSummary();
  }, []);

  useEffect(() => {
    filterVehicles();
  }, [vehicles, searchTerm, installationSummary]);

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
        currentMileage: vehicle.mileage || 0,
        trustScore: (vehicle as any).trustScore || 100, // trustScore might not be in the TS interface but is in the API response
        verificationStatus: vehicle.verificationStatus,
        isForSale: vehicle.isForSale,
        createdAt: vehicle.createdAt
      }));
      
      setVehicles(mappedVehicles);
      
      // Fetch installation request summary
      const summaryResponse = await InstallationService.getInstallationRequestSummary();
      setInstallationSummary(summaryResponse.data);
    } catch (error) {
      console.error('Failed to fetch vehicles or installation summary:', error);
      toast.error('Can\'t reach installation API. Contact support.');
    } finally {
      setLoading(false);
    }
  };

  const filterVehicles = () => {
    if (!searchTerm) {
      setFilteredVehicles(vehicles);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = vehicles.filter(vehicle => 
      vehicle.vin.toLowerCase().includes(term) ||
      vehicle.vehicleNumber.toLowerCase().includes(term) ||
      vehicle.make.toLowerCase().includes(term) ||
      vehicle.model.toLowerCase().includes(term)
    );
    
    setFilteredVehicles(filtered);
  };

  const handleViewDetails = (vehicleId: string) => {
    navigate(`/vehicles/${vehicleId}`);
  };

  const handleEdit = (vehicleId: string) => {
    console.log('Edit vehicle:', vehicleId);
  };

  const handleDelete = (vehicleId: string) => {
    console.log('Delete vehicle:', vehicleId);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            </div>
            <div className="mt-4 h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Vehicles</h1>
          <p className="text-gray-600">Manage your registered vehicles and their blockchain records</p>
        </div>
        <button
          onClick={() => navigate('/vehicles/register')}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Register Vehicle
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            placeholder="Search vehicles by VIN, number, make, or model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
          <Filter className="w-5 h-5 mr-2" />
          Filters
        </button>
      </div>

      {/* Vehicle List */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
          <p className="text-gray-500 mb-6">Get started by registering your first vehicle.</p>
          <button
            onClick={() => navigate('/vehicles/register')}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Register Vehicle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle, index) => {
            const installationRequest = installationSummary[vehicle.id];
            
            return (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-sm text-gray-500">{vehicle.vin}</p>
                    </div>
                    <TrustScoreBadge score={vehicle.trustScore} />
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Vehicle Number</span>
                      <span className="font-medium">{vehicle.vehicleNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Mileage</span>
                      <span className="font-medium">{(vehicle.currentMileage || 0).toLocaleString()} miles</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status</span>
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
                    
                    {/* Device Request Status */}
                    <DeviceRequestStatus request={installationRequest} />
                  </div>
                </div>
                
                <div className="bg-gray-50 px-5 py-3 flex justify-between">
                  <button
                    onClick={() => handleViewDetails(vehicle.id)}
                    className="inline-flex items-center text-sm text-primary-600 hover:text-primary-800"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </button>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(vehicle.id)}
                      className="text-gray-500 hover:text-primary-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(vehicle.id)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VehicleList;