import React, { useEffect, useState } from 'react';
import { 
  Wrench, 
  Search, 
  Filter, 
  Car,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Play,
  Pause,
  User,
  Phone,
  Calendar
} from 'lucide-react';
import { LoadingSpinner, EmptyState, Badge, Button, Card, Input, Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui';

interface AssignedInstall {
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
    phone: string;
  };
  status: 'assigned' | 'in_progress' | 'completed';
  requestedAt: string;
  assignedAt: string;
  startedAt?: string;
  completedAt?: string;
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
  notes?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  deviceId?: string;
  cost?: number;
  priority: 'low' | 'medium' | 'high';
}

export const SPInstalls: React.FC = () => {
  const [assignedInstalls, setAssignedInstalls] = useState<AssignedInstall[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedInstall, setSelectedInstall] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('assigned');

  // Load assigned installs
  useEffect(() => {
    const loadAssignedInstalls = async () => {
      try {
        setLoading(true);
        
        // Mock assigned installs
        const mockAssignedInstalls: AssignedInstall[] = [
          {
            id: 'install1',
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
              email: 'john@example.com',
              phone: '+1-555-0123'
            },
            status: 'in_progress',
            requestedAt: '2024-01-20T10:00:00Z',
            assignedAt: '2024-01-20T11:00:00Z',
            startedAt: '2024-01-20T14:00:00Z',
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
            notes: 'Installation in progress',
            estimatedDuration: 120,
            actualDuration: 90,
            deviceId: 'DEV-001',
            cost: 150.00,
            priority: 'high'
          },
          {
            id: 'install2',
            vehicleId: {
              id: 'v2',
              vin: '1FTFW1ET5DFC12345',
              make: 'Ford',
              model: 'F-150',
              year: 2020,
              color: 'Black'
            },
            ownerId: {
              id: 'u2',
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane@example.com',
              phone: '+1-555-0456'
            },
            status: 'assigned',
            requestedAt: '2024-01-21T09:00:00Z',
            assignedAt: '2024-01-21T10:00:00Z',
            location: {
              address: '456 Oak Ave',
              city: 'Los Angeles',
              state: 'CA',
              zipCode: '90210'
            },
            notes: 'Regular device installation',
            estimatedDuration: 90,
            priority: 'medium'
          },
          {
            id: 'install3',
            vehicleId: {
              id: 'v3',
              vin: '5NPE34AF4HH123456',
              make: 'Hyundai',
              model: 'Elantra',
              year: 2019,
              color: 'White'
            },
            ownerId: {
              id: 'u3',
              firstName: 'Bob',
              lastName: 'Johnson',
              email: 'bob@example.com',
              phone: '+1-555-0789'
            },
            status: 'completed',
            requestedAt: '2024-01-19T08:00:00Z',
            assignedAt: '2024-01-19T09:00:00Z',
            startedAt: '2024-01-19T10:00:00Z',
            completedAt: '2024-01-19T12:00:00Z',
            location: {
              address: '789 Pine St',
              city: 'Chicago',
              state: 'IL',
              zipCode: '60601'
            },
            notes: 'Device installation completed successfully',
            estimatedDuration: 120,
            actualDuration: 120,
            deviceId: 'DEV-002',
            cost: 175.00,
            priority: 'low'
          }
        ];

        setAssignedInstalls(mockAssignedInstalls);
      } catch (error) {
        console.error('Failed to load assigned installs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAssignedInstalls();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Play className="w-4 h-4 text-blue-600" />;
      case 'assigned':
        return <Clock className="w-4 h-4 text-yellow-600" />;
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
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleStartInstallation = async (installId: string, deviceId: string) => {
    try {
      // Mock start installation - replace with actual API call
      console.log(`Starting installation ${installId} with device ${deviceId}`);
      
      // Update local state
      setAssignedInstalls(prev => prev.map(install => 
        install.id === installId 
          ? { 
              ...install, 
              status: 'in_progress', 
              startedAt: new Date().toISOString(),
              deviceId 
            }
          : install
      ));
    } catch (error) {
      console.error('Failed to start installation:', error);
    }
  };

  const handleCompleteInstallation = async (installId: string) => {
    try {
      // Mock complete installation - replace with actual API call
      console.log(`Completing installation ${installId}`);
      
      // Update local state
      setAssignedInstalls(prev => prev.map(install => 
        install.id === installId 
          ? { 
              ...install, 
              status: 'completed', 
              completedAt: new Date().toISOString()
            }
          : install
      ));
    } catch (error) {
      console.error('Failed to complete installation:', error);
    }
  };

  const filteredInstalls = assignedInstalls.filter(install => {
    const matchesSearch = 
      install.vehicleId.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      install.vehicleId.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      install.vehicleId.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      install.ownerId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      install.ownerId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      install.location.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' || 
      install.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading assigned installs..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Installations</h1>
          <p className="text-gray-600 mt-1">
            Manage your assigned device installation requests
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Schedule View</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by VIN, make, model, owner, or location..."
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
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assigned">Assigned</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="space-y-6">
          {/* Assigned Installs */}
          {filteredInstalls.filter(install => install.status === 'assigned').length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No assigned installs"
              description="You don't have any assigned installation requests at the moment"
            />
          ) : (
            <div className="space-y-4">
              {filteredInstalls
                .filter(install => install.status === 'assigned')
                .map((install) => (
                <Card key={install.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-primary-100 rounded-lg">
                        <Wrench className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {install.vehicleId.year} {install.vehicleId.make} {install.vehicleId.model}
                        </h3>
                        <p className="text-sm text-gray-500">{install.vehicleId.vin}</p>
                        <p className="text-sm text-gray-500">
                          Owner: {install.ownerId.firstName} {install.ownerId.lastName}
                        </p>
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
                      <Badge 
                        variant="outline" 
                        className={`${getPriorityColor(install.priority)} text-sm`}
                      >
                        {install.priority} Priority
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Owner:</span>
                      <span className="font-medium">{install.ownerId.firstName} {install.ownerId.lastName}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Location:</span>
                      <span className="font-medium">{install.location.city}, {install.location.state}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Assigned:</span>
                      <span className="font-medium">
                        {new Date(install.assignedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

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
                        onClick={() => setSelectedInstall(install.id)}
                        className="flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </Button>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => {
                        const deviceId = prompt('Enter Device ID:');
                        if (deviceId) {
                          handleStartInstallation(install.id, deviceId);
                        }
                      }}
                      className="flex items-center space-x-1"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start Installation</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-6">
          {/* In Progress Installs */}
          {filteredInstalls.filter(install => install.status === 'in_progress').length === 0 ? (
            <EmptyState
              icon={Play}
              title="No installations in progress"
              description="You don't have any installations currently in progress"
            />
          ) : (
            <div className="space-y-4">
              {filteredInstalls
                .filter(install => install.status === 'in_progress')
                .map((install) => (
                <Card key={install.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Play className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {install.vehicleId.year} {install.vehicleId.make} {install.vehicleId.model}
                        </h3>
                        <p className="text-sm text-gray-500">{install.vehicleId.vin}</p>
                        <p className="text-sm text-gray-500">
                          Device: {install.deviceId}
                        </p>
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
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Owner:</span>
                      <span className="font-medium">{install.ownerId.firstName} {install.ownerId.lastName}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Location:</span>
                      <span className="font-medium">{install.location.address}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Started:</span>
                      <span className="font-medium">
                        {install.startedAt ? new Date(install.startedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInstall(install.id)}
                        className="flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </Button>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handleCompleteInstallation(install.id)}
                      className="flex items-center space-x-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Complete Installation</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          {/* Completed Installs */}
          {filteredInstalls.filter(install => install.status === 'completed').length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="No completed installations"
              description="You haven't completed any installations yet"
            />
          ) : (
            <div className="space-y-4">
              {filteredInstalls
                .filter(install => install.status === 'completed')
                .map((install) => (
                <Card key={install.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {install.vehicleId.year} {install.vehicleId.make} {install.vehicleId.model}
                        </h3>
                        <p className="text-sm text-gray-500">{install.vehicleId.vin}</p>
                        <p className="text-sm text-gray-500">
                          Device: {install.deviceId}
                        </p>
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
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Owner:</span>
                      <span className="font-medium">{install.ownerId.firstName} {install.ownerId.lastName}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Completed:</span>
                      <span className="font-medium">
                        {install.completedAt ? new Date(install.completedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    
                    {install.cost && (
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-500">Cost:</span>
                        <span className="font-medium">${install.cost}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInstall(install.id)}
                        className="flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </Button>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      Duration: {install.actualDuration || install.estimatedDuration} minutes
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SPInstalls;

