import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Search, Filter, User, CheckCircle, Clock, X, Loader2 } from 'lucide-react';
import { AdminService } from '../../services/admin';
import { InstallationService } from '../../services/installation';
import toast from 'react-hot-toast';

interface InstallRequest {
  id: string;
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    vin: string;
  };
  owner: {
    id: string;
    name: string;
    email: string;
  };
  status: 'requested' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  requestedAt: string;
  serviceProvider?: {
    id: string;
    name: string;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deviceId?: string;
}

interface ServiceProvider {
  id: string;
  name: string;
  email: string;
}

const AdminInstalls: React.FC = () => {
  const [installRequests, setInstallRequests] = useState<InstallRequest[]>([]);
  
  // Debug effect to see when installRequests changes
  useEffect(() => {
    console.log('installRequests state updated:', installRequests);
  }, [installRequests]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [selectedServiceProvider, setSelectedServiceProvider] = useState<Record<string, string>>({});
  const [assigning, setAssigning] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchInstallRequests();
    fetchServiceProviders();
  }, []);

  const fetchInstallRequests = async () => {
    try {
      setLoading(true);
      // Fetch real installation requests from API
      const response = await InstallationService.getInstallationRequests();
      
      // Debug log to see the actual response structure
      console.log('Installation requests response:', response);
      
      const requests = response.data.requests.map((request: any) => {
        // Debug log to see each request structure
        console.log('Processing request:', request);
        console.log('Request id:', request.id);
        
        const mappedRequest: InstallRequest = {
          id: request.id || request._id,  // Handle both id and _id
          vehicle: {
            id: request.vehicle?._id || request.vehicleId || '',
            make: request.vehicle?.make || 'Unknown',
            model: request.vehicle?.vehicleModel || request.vehicle?.model || 'Unknown',
            year: request.vehicle?.year || 0,
            vin: request.vehicle?.vin || 'Unknown'
          },
          owner: {
            id: request.owner?._id || request.ownerId || '',
            name: `${request.owner?.firstName || ''} ${request.owner?.lastName || ''}`.trim() || 'Unknown',
            email: request.owner?.email || 'Unknown'
          },
          status: request.status,
          requestedAt: request.createdAt,
          serviceProvider: request.serviceProvider ? {
            id: request.serviceProvider._id || request.serviceProviderId || '',
            name: `${request.serviceProvider?.firstName || ''} ${request.serviceProvider?.lastName || ''}`.trim() || 
                  request.serviceProvider?.companyName || 'Unknown Service Provider'
          } : undefined,
          priority: request.priority || 'medium',
          deviceId: request.deviceId
        };
        
        console.log('Mapped request:', mappedRequest);
        console.log('Mapped request id:', mappedRequest.id);
        
        return mappedRequest;
      });
      
      console.log('All mapped requests:', requests);
      setInstallRequests(requests);
    } catch (error) {
      console.error('Failed to fetch install requests:', error);
      toast.error('Failed to fetch installation requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceProviders = async () => {
    try {
      // Fetch service providers from user list with role 'service'
      const response = await AdminService.getUsers({ role: 'service' });
      console.log('Service providers response:', response);
      const providers: ServiceProvider[] = response.data.users.map((user: any) => ({
        id: user._id || user.id,  // Handle both _id and id
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      }));
      console.log('Mapped service providers:', providers);
      setServiceProviders(providers);
    } catch (error) {
      console.error('Failed to fetch service providers:', error);
      toast.error('Failed to fetch service providers');
    }
  };

  const handleAssignServiceProvider = async (installId: string) => {
    // Add guard to prevent undefined IDs
    console.log('handleAssignServiceProvider called with installId:', installId);
    
    if (!installId) {
      console.error('Missing installation request ID');
      toast.error('Unable to assign: request ID missing');
      return;
    }
    
    // Additional validation to ensure it's a valid string
    if (typeof installId !== 'string' || installId.trim() === '') {
      console.error('Invalid installation request ID:', installId);
      toast.error('Unable to assign: invalid request ID');
      return;
    }
    
    const serviceProviderId = selectedServiceProvider[installId];
    console.log('Selected service provider ID:', serviceProviderId);
    
    if (!serviceProviderId) {
      toast.error('Please select a service provider');
      return;
    }
    
    // Additional validation for service provider ID
    if (typeof serviceProviderId !== 'string' || serviceProviderId.trim() === '') {
      console.error('Invalid service provider ID:', serviceProviderId);
      toast.error('Please select a valid service provider');
      return;
    }
    
    try {
      setAssigning(prev => ({ ...prev, [installId]: true }));
      
      console.log('Calling assignInstallationRequest with:', { installId, serviceProviderId });
      await AdminService.assignInstallationRequest(installId, serviceProviderId);
      
      // Optimistically update the UI
      setInstallRequests(prevRequests => 
        prevRequests.map(request => 
          request.id === installId 
            ? { 
                ...request, 
                status: 'assigned',
                serviceProvider: serviceProviders.find(p => p.id === serviceProviderId)
              } 
            : request
        )
      );
      
      // Clear the selection for this request
      setSelectedServiceProvider(prev => {
        const newSelection = { ...prev };
        delete newSelection[installId];
        return newSelection;
      });
      
      toast.success('Provider assigned successfully');
    } catch (error: any) {
      console.error('Failed to assign service provider:', error);
      toast.error(error.response?.data?.message || 'Failed to assign service provider. Please try again.');
    } finally {
      setAssigning(prev => ({ ...prev, [installId]: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = installRequests.filter(request => {
    const matchesSearch = 
      request.vehicle.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.owner.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Debug log to see filtered requests
  console.log('Filtered requests:', filteredRequests);

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
          <h1 className="text-2xl font-bold text-gray-900">Installation Requests</h1>
          <p className="text-gray-600">Manage and assign device installation requests</p>
        </div>
        <button 
          onClick={fetchInstallRequests}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <RefreshIcon className="h-4 w-4 mr-2" />
          Refresh
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
            placeholder="Search by VIN, owner name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="block w-full sm:w-auto pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All Statuses</option>
          <option value="requested">Requested</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
          <Filter className="w-5 h-5 mr-2" />
          More Filters
        </button>
      </div>

      {/* Install Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No installation requests found</h3>
          <p className="text-gray-500">There are currently no pending installation requests.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Provider
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request, index) => {
                  // Check if request has a valid ID
                  const hasValidId = request.id && typeof request.id === 'string' && request.id.trim() !== '';
                  
                  return (
                    <motion.tr
                      key={request.id || `index-${index}`} // Fallback to index if id is undefined
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {request.vehicle.year} {request.vehicle.make} {request.vehicle.model}
                        </div>
                        <div className="text-sm text-gray-500">{request.vehicle.vin}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.owner.name}</div>
                        <div className="text-sm text-gray-500">{request.owner.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.serviceProvider ? request.serviceProvider.name : 'Not assigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {request.status === 'requested' ? (
                          <div className="flex items-center space-x-2">
                            <select
                              value={selectedServiceProvider[request.id] || ''}
                              onChange={(e) => setSelectedServiceProvider(prev => ({
                                ...prev,
                                [request.id]: e.target.value
                              }))}
                              className="block w-full pl-3 pr-10 py-1 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                              disabled={!hasValidId}
                            >
                              <option value="">Select Provider</option>
                              {serviceProviders.map(provider => (
                                <option key={provider.id} value={provider.id}>
                                  {provider.name} ({provider.email})
                                </option>
                              ))}
                            </select>
                            {hasValidId ? (
                              <button
                                onClick={() => {
                                  console.log('Assign button clicked, request.id:', request.id);
                                  handleAssignServiceProvider(request.id);
                                }}
                                disabled={assigning[request.id]}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                              >
                                {assigning[request.id] ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                            ) : (
                              <span className="text-red-500 text-sm" title="Request ID is missing - cannot assign">
                                ID Missing
                              </span>
                            )}
                          </div>
                        ) : request.status === 'assigned' ? (
                          <span className="inline-flex items-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Assigned
                          </span>
                        ) : (
                          <span className="text-gray-500 capitalize">{request.status.replace('_', ' ')}</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Add RefreshIcon component
const RefreshIcon: React.FC<{className?: string}> = ({className}) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export default AdminInstalls;