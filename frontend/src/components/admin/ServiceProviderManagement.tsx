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
  TrendingUp
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

const ServiceProviderManagement: React.FC = () => {
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
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
          onClick={() => {/* TODO: Add provider functionality */}}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Providers"
              value={stats.total}
              subtitle={`${stats.verified} verified`}
              icon={<Users className="w-6 h-6" />}
              color="blue"
            />
            <StatCard
              title="Active Providers"
              value={stats.active}
              subtitle="Currently available"
              icon={<Activity className="w-6 h-6" />}
              color="green"
            />
            <StatCard
              title="Pending Verification"
              value={stats.pending}
              subtitle="Awaiting approval"
              icon={<Clock className="w-6 h-6" />}
              color="yellow"
            />
            <StatCard
              title="Average Rating"
              value={stats.averageRating.toFixed(1)}
              subtitle="Overall provider rating"
              icon={<Star className="w-6 h-6" />}
              color="purple"
            />
          </div>

          {/* Recent Activity or Charts could go here */}
          <Card>
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
              <p className="text-gray-600">Provider performance analytics and trends will be displayed here.</p>
            </div>
          </Card>
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers">
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <SearchInput
                  placeholder="Search providers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={() => setSearchTerm('')}
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Status</option>
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
                              {provider.metrics.averageRating.toFixed(1)} rating
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 block">Total Jobs</span>
                              <p className="font-semibold text-gray-900">{provider.metrics.totalInstallations}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 block">Success Rate</span>
                              <p className="font-semibold text-gray-900">
                                {provider.metrics.totalInstallations > 0 
                                  ? Math.round((provider.metrics.successfulInstallations / provider.metrics.totalInstallations) * 100)
                                  : 0}%
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500 block">On Time</span>
                              <p className="font-semibold text-gray-900">{provider.metrics.onTimePercentage}%</p>
                            </div>
                            <div>
                              <span className="text-gray-500 block">Current Jobs</span>
                              <p className="font-semibold text-gray-900">{provider.currentAssignments.length}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {provider.verificationStatus === 'pending' && (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                icon={<UserCheck className="w-4 h-4" />}
                                onClick={() => openConfirmationModal(provider, 'verify')}
                              >
                                Verify
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                icon={<UserX className="w-4 h-4" />}
                                onClick={() => openConfirmationModal(provider, 'reject')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Eye className="w-4 h-4" />}
                            onClick={() => viewProviderDetails(provider)}
                          >
                            View Details
                          </Button>
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
          <EmptyState
            icon={<Wrench className="w-16 h-16" />}
            title="Installation Management"
            description="Device installation tracking and management features will be available here."
            action={{
              label: "Coming Soon",
              onClick: () => toast.info("Installation management features are coming soon!")
            }}
          />
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