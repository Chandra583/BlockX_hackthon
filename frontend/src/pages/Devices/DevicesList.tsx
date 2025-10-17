import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Smartphone, 
  Plus, 
  Search, 
  Filter, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Wrench,
  MapPin,
  Calendar,
  User,
  Car,
  Eye,
  Play,
  Pause
} from 'lucide-react';
import { useAppSelector } from '../../hooks/redux';
import { LoadingSpinner, EmptyState, Badge, Button, Card, Input, Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui';
import { useSocket } from '../../hooks/useSocket';

interface InstallRequest {
  id: string;
  vehicleId: {
    id: string;
    vin: string;
    make: string;
    model: string;
    year: number;
    color: string;
  };
  ownerId: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  serviceProviderId?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  deviceId?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
  requestedAt: string;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  notes?: string;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  estimatedDuration?: number;
  actualDuration?: number;
  cost?: number;
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  feedback?: {
    rating: number;
    comment: string;
    submittedAt: string;
  };
  statusHistory: Array<{
    status: string;
    changedBy: string;
    changedAt: string;
    reason: string;
    notes?: string;
  }>;
}

export const DevicesList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);
  const [installs, setInstalls] = useState<InstallRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('my-requests');
  const [realtimeUpdates, setRealtimeUpdates] = useState(0);
  
  const socket = useSocket();

  // Load install requests
  useEffect(() => {
    const loadInstalls = async () => {
      try {
        setLoading(true);
        
        // Mock data - replace with actual API call
        const mockInstalls: InstallRequest[] = [
          {
            id: '1',
            vehicleId: {
              id: 'v1',
              vin: '1HGBH41JXMN109186',
              make: 'Honda',
              model: 'Civic',
              year: 2021,
              color: 'Silver'
            },
            ownerId: {
              id: 'u1',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com'
            },
            serviceProviderId: {
              id: 'sp1',
              firstName: 'Mike',
              lastName: 'Smith',
              email: 'mike@service.com'
            },
            deviceId: 'DEV-001',
            status: 'in_progress',
            requestedAt: '2024-01-20T10:00:00Z',
            assignedAt: '2024-01-20T11:00:00Z',
            startedAt: '2024-01-20T14:00:00Z',
            notes: 'Installation in progress',
            location: {
              address: '123 Main St',
              city: 'New York',
              state: 'NY',
              zipCode: '10001',
              coordinates: {
                latitude: 40.7128,
                longitude: -74.0060
              }
            },
            estimatedDuration: 120,
            actualDuration: 90,
            cost: 150.00,
            paymentStatus: 'paid',
            statusHistory: [
              {
                status: 'pending',
                changedBy: 'u1',
                changedAt: '2024-01-20T10:00:00Z',
                reason: 'Install request created'
              },
              {
                status: 'assigned',
                changedBy: 'admin',
                changedAt: '2024-01-20T11:00:00Z',
                reason: 'Assigned to service provider'
              },
              {
                status: 'in_progress',
                changedBy: 'sp1',
                changedAt: '2024-01-20T14:00:00Z',
                reason: 'Installation started'
              }
            ]
          },
          {
            id: '2',
            vehicleId: {
              id: 'v2',
              vin: '1FTFW1ET5DFC12345',
              make: 'Ford',
              model: 'F-150',
              year: 2020,
              color: 'Black'
            },
            ownerId: {
              id: 'u1',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com'
            },
            status: 'pending',
            requestedAt: '2024-01-21T09:00:00Z',
            notes: 'Need device installation for new vehicle',
            location: {
              address: '456 Oak Ave',
              city: 'Los Angeles',
              state: 'CA',
              zipCode: '90210'
            },
            estimatedDuration: 90,
            statusHistory: [
              {
                status: 'pending',
                changedBy: 'u1',
                changedAt: '2024-01-21T09:00:00Z',
                reason: 'Install request created'
              }
            ]
          }
        ];

        setInstalls(mockInstalls);
      } catch (error) {
        console.error('Failed to load install requests:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInstalls();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleInstallRequestCreated = (data: any) => {
      setRealtimeUpdates(prev => prev + 1);
      // Add new install request to the list
      const newInstall: InstallRequest = {
        id: `realtime-${Date.now()}`,
        vehicleId: data.vehicleId,
        ownerId: data.ownerId,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        location: data.location,
        statusHistory: [{
          status: 'pending',
          changedBy: data.ownerId.id,
          changedAt: new Date().toISOString(),
          reason: 'Install request created'
        }]
      };
      setInstalls(prev => [newInstall, ...prev]);
    };

    const handleInstallStatusChanged = (data: any) => {
      setRealtimeUpdates(prev => prev + 1);
      setInstalls(prev => prev.map(install => 
        install.id === data.installId 
          ? { ...install, status: data.newStatus }
          : install
      ));
    };

    socket.on('install_request_created', handleInstallRequestCreated);
    socket.on('install_status_changed', handleInstallStatusChanged);

    return () => {
      socket.off('install_request_created', handleInstallRequestCreated);
      socket.off('install_status_changed', handleInstallStatusChanged);
    };
  }, [socket]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Play className="w-4 h-4 text-blue-600" />;
      case 'assigned':
        return <Wrench className="w-4 h-4 text-yellow-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'cancelled':
        return <Pause className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'assigned':
        return 'Assigned';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const filteredInstalls = installs.filter(install => {
    const matchesSearch = 
      install.vehicleId.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      install.vehicleId.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      install.vehicleId.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      install.location.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' || 
      install.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const handleRequestInstall = () => {
    const vehicleId = searchParams.get('vehicle');
    if (vehicleId) {
      navigate(`/devices/request?vehicle=${vehicleId}`);
    } else {
      navigate('/devices/request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading device requests..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Device Installations</h1>
          <p className="text-gray-600 mt-1">
            Manage your device installation requests and track progress
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {realtimeUpdates > 0 && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <Smartphone className="w-4 h-4" />
              <span>{realtimeUpdates} real-time updates</span>
            </div>
          )}
          <Button onClick={handleRequestInstall} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Request Install</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by VIN, make, model, or address..."
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
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
          <TabsTrigger value="all-requests">All Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="my-requests" className="space-y-6">
          {/* Install Requests */}
          {filteredInstalls.length === 0 ? (
            <EmptyState
              icon={Smartphone}
              title="No install requests found"
              description={searchTerm || filterStatus !== 'all' 
                ? "Try adjusting your search or filter criteria"
                : "You haven't requested any device installations yet"
              }
              action={
                !searchTerm && filterStatus === 'all' ? {
                  label: 'Request Installation',
                  onClick: handleRequestInstall
                } : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredInstalls.map((install) => (
                <Card key={install.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-primary-100 rounded-lg">
                        <Smartphone className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {install.vehicleId.year} {install.vehicleId.make} {install.vehicleId.model}
                        </h3>
                        <p className="text-sm text-gray-500">{install.vehicleId.vin}</p>
                        <p className="text-sm text-gray-500">{install.location.address}, {install.location.city}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(install.status)} text-sm`}
                      >
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(install.status)}
                          <span>{getStatusLabel(install.status)}</span>
                        </div>
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Requested:</span>
                      <span className="font-medium">
                        {new Date(install.requestedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {install.assignedAt && (
                      <div className="flex items-center space-x-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">Assigned:</span>
                        <span className="font-medium">
                          {new Date(install.assignedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    {install.estimatedDuration && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">Duration:</span>
                        <span className="font-medium">{install.estimatedDuration} min</span>
                      </div>
                    )}
                  </div>

                  {install.serviceProviderId && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm">
                        <Wrench className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">Service Provider:</span>
                        <span className="font-medium">
                          {install.serviceProviderId.firstName} {install.serviceProviderId.lastName}
                        </span>
                      </div>
                    </div>
                  )}

                  {install.notes && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Notes:</strong> {install.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/installs/${install.id}`)}
                        className="flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </Button>
                      
                      {install.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/installs/${install.id}/edit`)}
                          className="flex items-center space-x-1"
                        >
                          <Wrench className="w-4 h-4" />
                          <span>Edit Request</span>
                        </Button>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      {install.statusHistory.length} status updates
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all-requests" className="space-y-6">
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Requests</h3>
            <p className="text-gray-600">
              This view would show all install requests across the platform (admin/service provider view)
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DevicesList;

