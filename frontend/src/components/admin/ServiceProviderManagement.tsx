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
  Calendar,
  Eye,
  UserCheck,
  UserX,
  Activity,
  Award,
  TrendingUp,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  Button, 
  Card, 
  Badge, 
  StatCard, 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent,
  SearchInput,
  EmptyState,
  PageLoader,
  Modal,
  ConfirmationModal,
  StatusBadge
} from '../ui';
import toast from 'react-hot-toast';

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

// New interface for service provider registration form
interface ServiceProviderFormData {
  userId: string;
  companyName: string;
  licenseNumber: string;
  contactInfo: {
    phone: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  serviceAreas: Array<{
    city: string;
    state: string;
    radius: number;
  }>;
  capabilities: Array<{
    deviceType: string;
    installationType: 'basic' | 'advanced' | 'expert';
    estimatedTime: number;
    cost: number;
  }>;
  paymentInfo: {
    ratePerHour: number;
    minimumCharge: number;
    paymentMethod: 'bank_transfer' | 'check' | 'digital_wallet';
  };
}

const ServiceProviderManagement: React.FC = () => {
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showAddProviderModal, setShowAddProviderModal] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Form state for adding new service provider
  const [formData, setFormData] = useState<ServiceProviderFormData>({
    userId: '',
    companyName: '',
    licenseNumber: '',
    contactInfo: {
      phone: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      }
    },
    serviceAreas: [{ city: '', state: '', radius: 50 }],
    capabilities: [{ deviceType: 'ESP32_Telematics', installationType: 'basic', estimatedTime: 60, cost: 100 }],
    paymentInfo: {
      ratePerHour: 50,
      minimumCharge: 100,
      paymentMethod: 'bank_transfer'
    }
  });

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
        toast.success(`Provider ${status === 'verified' ? 'verified' : 'rejected'} successfully`);
        fetchData();
      } else {
        toast.error('Failed to update provider status');
      }
    } catch (error) {
      console.error('Failed to verify provider:', error);
      toast.error('Failed to update provider status');
    }
  };

  const openConfirmationModal = (provider: ServiceProvider, action: 'verify' | 'reject') => {
    const isVerify = action === 'verify';
    setConfirmationModal({
      isOpen: true,
      title: `${isVerify ? 'Verify' : 'Reject'} Service Provider`,
      message: `Are you sure you want to ${isVerify ? 'verify' : 'reject'} ${provider.companyName}? This action will ${isVerify ? 'allow them to receive job assignments' : 'prevent them from receiving new jobs'}.`,
      variant: isVerify ? 'info' : 'danger',
      onConfirm: () => {
        handleVerifyProvider(provider._id, isVerify ? 'verified' : 'rejected');
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const viewProviderDetails = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setShowProviderModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle nested properties
    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => {
        const updated = { ...prev };
        let current: any = updated;
        
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        return updated;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle service area changes
  const handleServiceAreaChange = (index: number, field: string, value: string | number) => {
    setFormData(prev => {
      const updatedAreas = [...prev.serviceAreas];
      updatedAreas[index] = { ...updatedAreas[index], [field]: value };
      return { ...prev, serviceAreas: updatedAreas };
    });
  };

  // Add a new service area
  const addServiceArea = () => {
    setFormData(prev => ({
      ...prev,
      serviceAreas: [...prev.serviceAreas, { city: '', state: '', radius: 50 }]
    }));
  };

  // Remove a service area
  const removeServiceArea = (index: number) => {
    if (formData.serviceAreas.length > 1) {
      setFormData(prev => ({
        ...prev,
        serviceAreas: prev.serviceAreas.filter((_, i) => i !== index)
      }));
    }
  };

  // Handle capability changes
  const handleCapabilityChange = (index: number, field: string, value: string | number) => {
    setFormData(prev => {
      const updatedCapabilities = [...prev.capabilities];
      updatedCapabilities[index] = { ...updatedCapabilities[index], [field]: value };
      return { ...prev, capabilities: updatedCapabilities };
    });
  };

  // Add a new capability
  const addCapability = () => {
    setFormData(prev => ({
      ...prev,
      capabilities: [...prev.capabilities, { deviceType: 'ESP32_Telematics', installationType: 'basic', estimatedTime: 60, cost: 100 }]
    }));
  };

  // Remove a capability
  const removeCapability = (index: number) => {
    if (formData.capabilities.length > 1) {
      setFormData(prev => ({
        ...prev,
        capabilities: prev.capabilities.filter((_, i) => i !== index)
      }));
    }
  };

  // Handle form submission
  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/service-providers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Service provider registered successfully');
        setShowAddProviderModal(false);
        // Reset form
        setFormData({
          userId: '',
          companyName: '',
          licenseNumber: '',
          contactInfo: {
            phone: '',
            email: '',
            address: {
              street: '',
              city: '',
              state: '',
              zipCode: ''
            }
          },
          serviceAreas: [{ city: '', state: '', radius: 50 }],
          capabilities: [{ deviceType: 'ESP32_Telematics', installationType: 'basic', estimatedTime: 60, cost: 100 }],
          paymentInfo: {
            ratePerHour: 50,
            minimumCharge: 100,
            paymentMethod: 'bank_transfer'
          }
        });
        fetchData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to register service provider');
      }
    } catch (error) {
      console.error('Failed to register service provider:', error);
      toast.error('Failed to register service provider');
    }
  };

  // Calculate statistics
  const stats = {
    total: serviceProviders.length,
    verified: serviceProviders.filter(p => p.verificationStatus === 'verified').length,
    pending: serviceProviders.filter(p => p.verificationStatus === 'pending').length,
    active: serviceProviders.filter(p => p.isActive).length,
    averageRating: serviceProviders.length > 0 
      ? serviceProviders.reduce((sum, p) => sum + p.metrics.averageRating, 0) / serviceProviders.length
      : 0
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
    return <PageLoader text="Loading service providers..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Provider Management</h1>
          <p className="text-gray-600 mt-1">Manage and verify service providers in your network</p>
        </div>
        <Button 
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowAddProviderModal(true)}
        >
          Add Provider
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger 
            value="dashboard" 
            icon={<Activity className="w-4 h-4" />}
            badge={stats.pending > 0 ? <Badge variant="warning" size="sm">{stats.pending}</Badge> : undefined}
          >
            Dashboard
          </TabsTrigger>
          <TabsTrigger 
            value="providers" 
            icon={<Users className="w-4 h-4" />}
          >
            Providers ({stats.total})
          </TabsTrigger>
          <TabsTrigger 
            value="installations" 
            icon={<Wrench className="w-4 h-4" />}
          >
            Installations
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Providers"
              value={stats.total}
              icon={<Users className="w-6 h-6" />}
              trend={{ value: 12, isPositive: true }}
            />
            <StatCard
              title="Verified"
              value={stats.verified}
              icon={<CheckCircle className="w-6 h-6" />}
              trend={{ value: 8, isPositive: true }}
            />
            <StatCard
              title="Pending"
              value={stats.pending}
              icon={<Clock className="w-6 h-6" />}
              trend={{ value: 3, isPositive: false }}
            />
            <StatCard
              title="Avg. Rating"
              value={stats.averageRating.toFixed(1)}
              icon={<Star className="w-6 h-6" />}
              suffix="/5"
            />
          </div>
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers">
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchInput
                placeholder="Search providers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="suspended">Suspended</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Providers List */}
            {filteredProviders.length === 0 ? (
              <EmptyState
                icon={<Users className="w-16 h-16" />}
                title="No providers found"
                description="No service providers match your current search criteria."
                action={{
                  label: "Clear Filters",
                  onClick: () => {
                    setSearchTerm('');
                    setFilterStatus('all');
                  }
                }}
              />
            ) : (
              <div className="grid gap-6">
                {filteredProviders.map((provider, index) => (
                  <motion.div
                    key={provider._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card hover className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {provider.companyName}
                            </h3>
                            <StatusBadge 
                              status={provider.verificationStatus as any}
                              icon={provider.verificationStatus === 'verified' ? <CheckCircle className="w-3 h-3" /> : 
                                    provider.verificationStatus === 'pending' ? <Clock className="w-3 h-3" /> : 
                                    <XCircle className="w-3 h-3" />}
                            />
                            <Badge variant={provider.isActive ? 'success' : 'secondary'}>
                              {provider.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-3">
                            {provider.userId.firstName} {provider.userId.lastName} • {provider.userId.email}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {provider.serviceAreas.length} areas
                            </span>
                            <span className="flex items-center gap-1">
                              <Wrench className="w-4 h-4" />
                              {provider.capabilities.length} capabilities
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4" />
                              {provider.metrics.averageRating.toFixed(1)}/5
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<Eye className="w-4 h-4" />}
                            onClick={() => viewProviderDetails(provider)}
                          >
                            View
                          </Button>
                          {provider.verificationStatus === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="success"
                                icon={<UserCheck className="w-4 h-4" />}
                                onClick={() => openConfirmationModal(provider, 'verify')}
                              >
                                Verify
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                icon={<UserX className="w-4 h-4" />}
                                onClick={() => openConfirmationModal(provider, 'reject')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Installations Tab */}
        <TabsContent value="installations">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Installation Management</h3>
            <p className="text-gray-500 mb-6">Manage device installation requests and assignments</p>
            <Button variant="primary">View Installations</Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Provider Details Modal */}
      <Modal
        isOpen={showProviderModal}
        onClose={() => setShowProviderModal(false)}
        title={selectedProvider ? `${selectedProvider.companyName} Details` : ''}
        size="lg"
      >
        {selectedProvider && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Company Information</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Company:</span> {selectedProvider.companyName}</p>
                  <p><span className="text-gray-500">License:</span> {selectedProvider.licenseNumber}</p>
                  <p><span className="text-gray-500">Contact:</span> {selectedProvider.userId.firstName} {selectedProvider.userId.lastName}</p>
                  <p><span className="text-gray-500">Email:</span> {selectedProvider.userId.email}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Performance Metrics</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Total Installations:</span> {selectedProvider.metrics.totalInstallations}</p>
                  <p><span className="text-gray-500">Successful:</span> {selectedProvider.metrics.successfulInstallations}</p>
                  <p><span className="text-gray-500">Average Rating:</span> {selectedProvider.metrics.averageRating.toFixed(1)}/5</p>
                  <p><span className="text-gray-500">On-Time Rate:</span> {selectedProvider.metrics.onTimePercentage}%</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Service Areas</h4>
              <div className="flex flex-wrap gap-2">
                {selectedProvider.serviceAreas.map((area, index) => (
                  <Badge key={index} variant="secondary">
                    {area.city}, {area.state} ({area.radius}km)
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Capabilities</h4>
              <div className="space-y-2">
                {selectedProvider.capabilities.map((capability, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">{capability.deviceType} - {capability.installationType}</span>
                    <div className="text-xs text-gray-500">
                      {capability.estimatedTime}min • ${capability.cost}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Provider Modal */}
      <Modal
        isOpen={showAddProviderModal}
        onClose={() => setShowAddProviderModal(false)}
        title="Add New Service Provider"
        size="xl"
      >
        <form onSubmit={handleAddProvider} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                  <input
                    type="text"
                    name="userId"
                    value={formData.userId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter user ID"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter company name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter license number"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Contact Information */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="contactInfo.phone"
                    value={formData.contactInfo.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="contactInfo.email"
                    value={formData.contactInfo.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    name="contactInfo.address.street"
                    value={formData.contactInfo.address.street}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter street address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="contactInfo.address.city"
                    value={formData.contactInfo.address.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter city"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    name="contactInfo.address.state"
                    value={formData.contactInfo.address.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter state"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                  <input
                    type="text"
                    name="contactInfo.address.zipCode"
                    value={formData.contactInfo.address.zipCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter ZIP code"
                  />
                </div>
              </div>
            </div>
            
            {/* Service Areas */}
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Service Areas</h3>
                <Button type="button" variant="outline" size="sm" onClick={addServiceArea}>
                  Add Area
                </Button>
              </div>
              
              {formData.serviceAreas.map((area, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={area.city}
                      onChange={(e) => handleServiceAreaChange(index, 'city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter city"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={area.state}
                      onChange={(e) => handleServiceAreaChange(index, 'state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter state"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Radius (km)</label>
                    <input
                      type="number"
                      value={area.radius}
                      onChange={(e) => handleServiceAreaChange(index, 'radius', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      min="1"
                      max="500"
                    />
                  </div>
                  
                  {formData.serviceAreas.length > 1 && (
                    <div className="md:col-span-4 flex justify-end">
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => removeServiceArea(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Capabilities */}
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Capabilities</h3>
                <Button type="button" variant="outline" size="sm" onClick={addCapability}>
                  Add Capability
                </Button>
              </div>
              
              {formData.capabilities.map((capability, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
                    <select
                      value={capability.deviceType}
                      onChange={(e) => handleCapabilityChange(index, 'deviceType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="ESP32_Telematics">ESP32 Telematics</option>
                      <option value="OBD_Scanner">OBD Scanner</option>
                      <option value="GPS_Tracker">GPS Tracker</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Installation Type</label>
                    <select
                      value={capability.installationType}
                      onChange={(e) => handleCapabilityChange(index, 'installationType', e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="basic">Basic</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time (min)</label>
                    <input
                      type="number"
                      value={capability.estimatedTime}
                      onChange={(e) => handleCapabilityChange(index, 'estimatedTime', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      min="15"
                      max="480"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
                    <input
                      type="number"
                      value={capability.cost}
                      onChange={(e) => handleCapabilityChange(index, 'cost', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      min="0"
                    />
                  </div>
                  
                  {formData.capabilities.length > 1 && (
                    <div className="md:col-span-4 flex justify-end">
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => removeCapability(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Payment Information */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate Per Hour ($)</label>
                  <input
                    type="number"
                    name="paymentInfo.ratePerHour"
                    value={formData.paymentInfo.ratePerHour}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Charge ($)</label>
                  <input
                    type="number"
                    name="paymentInfo.minimumCharge"
                    value={formData.paymentInfo.minimumCharge}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    name="paymentInfo.paymentMethod"
                    value={formData.paymentInfo.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="digital_wallet">Digital Wallet</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={() => setShowAddProviderModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Service Provider
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        variant={confirmationModal.variant}
      />
    </div>
  );
};

export default ServiceProviderManagement;