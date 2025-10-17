import React, { useEffect, useState } from 'react';
import { 
  Wrench, 
  Search, 
  Filter, 
  User,
  Car,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  UserPlus,
  Calendar
} from 'lucide-react';
import { LoadingSpinner, EmptyState, Badge, Button, Card, Input, Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui';

interface PendingInstall {
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
  status: 'pending';
  requestedAt: string;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  notes?: string;
  estimatedDuration?: number;
  priority: 'low' | 'medium' | 'high';
}

interface ServiceProvider {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: {
    city: string;
    state: string;
  };
  rating: number;
  activeInstalls: number;
  completedInstalls: number;
  specialties: string[];
}

export const AdminInstalls: React.FC = () => {
  const [pendingInstalls, setPendingInstalls] = useState<PendingInstall[]>([]);
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedInstall, setSelectedInstall] = useState<string | null>(null);
  const [selectedServiceProvider, setSelectedServiceProvider] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Mock pending installs
        const mockPendingInstalls: PendingInstall[] = [
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
            status: 'pending',
            requestedAt: '2024-01-20T10:00:00Z',
            location: {
              address: '123 Main St',
              city: 'New York',
              state: 'NY',
              zipCode: '10001'
            },
            notes: 'Need device installation for new vehicle',
            estimatedDuration: 120,
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
            status: 'pending',
            requestedAt: '2024-01-21T09:00:00Z',
            location: {
              address: '456 Oak Ave',
              city: 'Los Angeles',
              state: 'CA',
              zipCode: '90210'
            },
            notes: 'Regular device installation',
            estimatedDuration: 90,
            priority: 'medium'
          }
        ];

        // Mock service providers
        const mockServiceProviders: ServiceProvider[] = [
          {
            id: 'sp1',
            firstName: 'Mike',
            lastName: 'Johnson',
            email: 'mike@service.com',
            phone: '+1-555-0789',
            location: {
              city: 'New York',
              state: 'NY'
            },
            rating: 4.8,
            activeInstalls: 2,
            completedInstalls: 45,
            specialties: ['Honda', 'Toyota', 'Ford']
          },
          {
            id: 'sp2',
            firstName: 'Sarah',
            lastName: 'Wilson',
            email: 'sarah@service.com',
            phone: '+1-555-0321',
            location: {
              city: 'Los Angeles',
              state: 'CA'
            },
            rating: 4.9,
            activeInstalls: 1,
            completedInstalls: 38,
            specialties: ['BMW', 'Mercedes', 'Audi']
          }
        ];

        setPendingInstalls(mockPendingInstalls);
        setServiceProviders(mockServiceProviders);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleAssignInstall = async (installId: string, serviceProviderId: string) => {
    try {
      // Mock assignment - replace with actual API call
      console.log(`Assigning install ${installId} to service provider ${serviceProviderId}`);
      
      // Update local state
      setPendingInstalls(prev => prev.filter(install => install.id !== installId));
      setSelectedInstall(null);
      setSelectedServiceProvider(null);
    } catch (error) {
      console.error('Failed to assign install:', error);
    }
  };

  const filteredInstalls = pendingInstalls.filter(install => {
    const matchesSearch = 
      install.vehicleId.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      install.vehicleId.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      install.vehicleId.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      install.ownerId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      install.ownerId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      install.location.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterPriority === 'all' || 
      install.priority === filterPriority;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading install requests..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Install Management</h1>
          <p className="text-gray-600 mt-1">
            Assign device installation requests to service providers
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
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending Requests</TabsTrigger>
          <TabsTrigger value="service-providers">Service Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          {/* Pending Install Requests */}
          {filteredInstalls.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No pending install requests"
              description={searchTerm || filterPriority !== 'all' 
                ? "Try adjusting your search or filter criteria"
                : "All install requests have been assigned"
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredInstalls.map((install) => (
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
                        className={`${getPriorityColor(install.priority)} text-sm`}
                      >
                        <div className="flex items-center space-x-1">
                          {getPriorityIcon(install.priority)}
                          <span className="capitalize">{install.priority} Priority</span>
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
                      <span className="font-medium">{install.location.city}, {install.location.state}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Requested:</span>
                      <span className="font-medium">
                        {new Date(install.requestedAt).toLocaleDateString()}
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
                      onClick={() => setSelectedInstall(install.id)}
                      className="flex items-center space-x-1"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Assign Provider</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="service-providers" className="space-y-6">
          {/* Service Providers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceProviders.map((provider) => (
              <Card key={provider.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {provider.firstName} {provider.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{provider.email}</p>
                      <p className="text-sm text-gray-500">{provider.location.city}, {provider.location.state}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium">{provider.rating}</span>
                    <span className="text-yellow-500">★</span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Active Installs:</span>
                    <span className="font-medium">{provider.activeInstalls}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Completed:</span>
                    <span className="font-medium">{provider.completedInstalls}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Phone:</span>
                    <span className="font-medium">{provider.phone}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Specialties:</p>
                  <div className="flex flex-wrap gap-1">
                    {provider.specialties.map((specialty, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Profile</span>
                  </Button>
                  
                  {selectedInstall && (
                    <Button
                      size="sm"
                      onClick={() => handleAssignInstall(selectedInstall, provider.id)}
                      className="flex items-center space-x-1"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Assign</span>
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminInstalls;

