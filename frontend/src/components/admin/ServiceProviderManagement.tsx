import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Star,
  Wrench,
  Calendar
} from 'lucide-react';

interface ServiceProvider {
  _id: string;
  userId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  companyName: string;
  licenseNumber: string;
  verificationStatus: 'pending' | 'verified' | 'suspended' | 'rejected';
  serviceAreas: Array<{
    city: string;
    state: string;
    radius: number;
  }>;
  capabilities: Array<{
    deviceType: string;
    installationType: string;
    estimatedTime: number;
    cost: number;
  }>;
  metrics: {
    totalInstallations: number;
    successfulInstallations: number;
    averageRating: number;
    onTimePercentage: number;
  };
  currentAssignments: Array<{
    deviceId: string;
    scheduledDate: string;
    status: string;
    priority: string;
  }>;
  isActive: boolean;
  joinedAt: string;
}

const ServiceProviderManagement: React.FC = () => {
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('providers');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/service-providers');
      if (response.ok) {
        const data = await response.json();
        setServiceProviders(data.data?.serviceProviders || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyProvider = async (providerId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/service-providers/${providerId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus: status })
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to verify provider:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      verified: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      suspended: { color: 'bg-red-100 text-red-800', icon: XCircle },
      rejected: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredProviders = serviceProviders.filter(provider => {
    const matchesSearch = 
      provider.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.userId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.userId.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || provider.verificationStatus === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Service Provider Management</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add Provider
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button 
            onClick={() => setActiveTab('providers')}
            className={`border-b-2 py-2 px-1 text-sm font-medium ${
              activeTab === 'providers' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Service Providers
          </button>
          <button 
            onClick={() => setActiveTab('installations')}
            className={`border-b-2 py-2 px-1 text-sm font-medium ${
              activeTab === 'installations' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Pending Installations
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`border-b-2 py-2 px-1 text-sm font-medium ${
              activeTab === 'dashboard' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Dashboard
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'providers' && (
        <div className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search providers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="grid gap-4">
            {filteredProviders.map((provider) => (
              <div key={provider._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{provider.companyName}</h3>
                      {getStatusBadge(provider.verificationStatus)}
                      {provider.isActive ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-2">
                      {provider.userId.firstName} {provider.userId.lastName} • {provider.userId.email}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {provider.serviceAreas.length} areas
                      </span>
                      <span className="flex items-center">
                        <Wrench className="w-4 h-4 mr-1" />
                        {provider.capabilities.length} capabilities
                      </span>
                      <span className="flex items-center">
                        <Star className="w-4 h-4 mr-1" />
                        {provider.metrics.averageRating.toFixed(1)} rating
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Total Jobs:</span>
                        <p className="font-semibold">{provider.metrics.totalInstallations}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Success Rate:</span>
                        <p className="font-semibold">
                          {provider.metrics.totalInstallations > 0 
                            ? Math.round((provider.metrics.successfulInstallations / provider.metrics.totalInstallations) * 100)
                            : 0}%
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">On Time:</span>
                        <p className="font-semibold">{provider.metrics.onTimePercentage}%</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Current Jobs:</span>
                        <p className="font-semibold">{provider.currentAssignments.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {provider.verificationStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => handleVerifyProvider(provider._id, 'verified')}
                          className="px-3 py-1 text-sm border border-green-600 text-green-600 rounded hover:bg-green-50 flex items-center"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Verify
                        </button>
                        <button
                          onClick={() => handleVerifyProvider(provider._id, 'rejected')}
                          className="px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50 flex items-center"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </button>
                      </>
                    )}
                    <button className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'installations' && (
        <div className="text-center py-8">
          <p className="text-gray-500">Pending installations will be displayed here</p>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Providers</p>
                <p className="text-2xl font-bold text-gray-900">{serviceProviders.length}</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {serviceProviders.filter(p => p.verificationStatus === 'verified').length} verified
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Providers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {serviceProviders.filter(p => p.isActive).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Currently available</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Verification</p>
                <p className="text-2xl font-bold text-gray-900">
                  {serviceProviders.filter(p => p.verificationStatus === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Awaiting approval</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {serviceProviders.length > 0 
                    ? (serviceProviders.reduce((sum, p) => sum + p.metrics.averageRating, 0) / serviceProviders.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Overall provider rating</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceProviderManagement;