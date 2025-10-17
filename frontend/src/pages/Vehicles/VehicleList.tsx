import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Smartphone,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Edit
} from 'lucide-react';
import { useAppSelector } from '../../hooks/redux';
import { LoadingSpinner, EmptyState, Badge, Button, Card, Input } from '../../components/ui';
import { useSocket } from '../../hooks/useSocket';

interface Vehicle {
  id: string;
  vin: string;
  vehicleNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
  currentMileage: number;
  trustScore: number;
  verificationStatus: 'pending' | 'verified' | 'flagged' | 'rejected';
  isForSale: boolean;
  listingStatus: string;
  condition: string;
  hasDevice: boolean;
  deviceStatus?: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export const VehicleList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const socket = useSocket();

  // Load vehicles
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setLoading(true);
        
        // Mock data - replace with actual API call
        const mockVehicles: Vehicle[] = [
          {
            id: '1',
            vin: '1HGBH41JXMN109186',
            vehicleNumber: 'ABC123',
            make: 'Honda',
            model: 'Civic',
            year: 2021,
            color: 'Silver',
            currentMileage: 25000,
            trustScore: 95,
            verificationStatus: 'verified',
            isForSale: false,
            listingStatus: 'not_listed',
            condition: 'excellent',
            hasDevice: true,
            deviceStatus: 'active',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-20T14:45:00Z'
          },
          {
            id: '2',
            vin: '1FTFW1ET5DFC12345',
            vehicleNumber: 'XYZ789',
            make: 'Ford',
            model: 'F-150',
            year: 2020,
            color: 'Black',
            currentMileage: 45000,
            trustScore: 78,
            verificationStatus: 'verified',
            isForSale: true,
            listingStatus: 'active',
            condition: 'good',
            hasDevice: false,
            deviceStatus: 'pending',
            createdAt: '2024-01-10T09:15:00Z',
            updatedAt: '2024-01-18T16:20:00Z'
          },
          {
            id: '3',
            vin: '5NPE34AF4HH123456',
            vehicleNumber: 'DEF456',
            make: 'Hyundai',
            model: 'Elantra',
            year: 2019,
            color: 'White',
            currentMileage: 32000,
            trustScore: 65,
            verificationStatus: 'flagged',
            isForSale: false,
            listingStatus: 'not_listed',
            condition: 'fair',
            hasDevice: false,
            deviceStatus: 'inactive',
            createdAt: '2024-01-05T08:00:00Z',
            updatedAt: '2024-01-19T11:30:00Z'
          }
        ];

        setVehicles(mockVehicles);
      } catch (error) {
        console.error('Failed to load vehicles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVehicles();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleTrustScoreChanged = (data: any) => {
      setVehicles(prev => prev.map(vehicle => 
        vehicle.id === data.vehicleId 
          ? { ...vehicle, trustScore: data.newScore }
          : vehicle
      ));
    };

    const handleDeviceActivated = (data: any) => {
      setVehicles(prev => prev.map(vehicle => 
        vehicle.id === data.vehicleId 
          ? { ...vehicle, hasDevice: true, deviceStatus: 'active' }
          : vehicle
      ));
    };

    socket.on('trustscore_changed', handleTrustScoreChanged);
    socket.on('device_activated', handleDeviceActivated);

    return () => {
      socket.off('trustscore_changed', handleTrustScoreChanged);
      socket.off('device_activated', handleDeviceActivated);
    };
  }, [socket]);

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'flagged':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'rejected':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getDeviceStatusBadge = (vehicle: Vehicle) => {
    if (!vehicle.hasDevice) {
      return (
        <Badge variant="outline" className="text-xs">
          No Device
        </Badge>
      );
    }

    switch (vehicle.deviceStatus) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <Smartphone className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-600">
            <Smartphone className="w-3 h-3 mr-1" />
            Inactive
          </Badge>
        );
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' || 
      vehicle.verificationStatus === filterStatus ||
      (filterStatus === 'for-sale' && vehicle.isForSale);

    return matchesSearch && matchesFilter;
  });

  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    const aValue = a[sortBy as keyof Vehicle];
    const bValue = b[sortBy as keyof Vehicle];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading vehicles..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Vehicles</h1>
          <p className="text-gray-600 mt-1">
            Manage your registered vehicles and their trust scores
          </p>
        </div>
        <Button onClick={() => navigate('/vehicles/register')} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Vehicle</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by VIN, vehicle number, make, or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="flagged">Flagged</option>
            <option value="for-sale">For Sale</option>
          </select>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="trustScore-desc">Trust Score (High)</option>
            <option value="trustScore-asc">Trust Score (Low)</option>
            <option value="make-asc">Make (A-Z)</option>
            <option value="make-desc">Make (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Vehicles Grid */}
      {sortedVehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No vehicles found"
          description={searchTerm || filterStatus !== 'all' 
            ? "Try adjusting your search or filter criteria"
            : "You haven't registered any vehicles yet"
          }
          action={
            !searchTerm && filterStatus === 'all' ? {
              label: 'Register Vehicle',
              onClick: () => navigate('/vehicles/register')
            } : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Car className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-sm text-gray-500">{vehicle.vin}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="outline" 
                    className={`${getTrustScoreColor(vehicle.trustScore)} text-xs`}
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {vehicle.trustScore}%
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Vehicle Number:</span>
                  <span className="font-medium">{vehicle.vehicleNumber}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Mileage:</span>
                  <span className="font-medium">{vehicle.currentMileage.toLocaleString()} mi</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(vehicle.verificationStatus)}
                    <span className="capitalize">{vehicle.verificationStatus}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Device:</span>
                  {getDeviceStatusBadge(vehicle)}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                  className="flex items-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </Button>
                
                {!vehicle.hasDevice && (
                  <Button
                    size="sm"
                    onClick={() => navigate(`/devices?vehicle=${vehicle.id}`)}
                    className="flex items-center space-x-1"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Request Install</span>
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VehicleList;

