import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector } from '../../hooks/redux';
import { 
  Car, 
  Heart, 
  Search, 
  DollarSign, 
  Shield, 
  Star,
  MapPin,
  Clock,
  Eye,
  Bell,
  ShoppingCart,
  CheckCircle,
  XCircle,
  CreditCard,
  ArrowRight,
  MessageSquare,
  User,
  Zap,
  TrendingUp,
  Filter,
  Plus,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckSquare,
  X
} from 'lucide-react';
import { PurchaseAPI, type PurchaseRequest } from '../../api/purchase';
import { MarketplaceAPI, type MarketplaceListing } from '../../api/marketplace';
import toast from 'react-hot-toast';

export const BuyerDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'marketplace'>('overview');
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [marketplaceListings, setMarketplaceListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [showPurchaseFlow, setShowPurchaseFlow] = useState(false);
  const [currentStep, setCurrentStep] = useState<'fund' | 'verify' | 'waiting' | 'complete'>('fund');
  const [isProcessing, setIsProcessing] = useState(false);

  // Safety check for user data
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading user data...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchPurchaseRequests();
    } else if (activeTab === 'marketplace') {
      fetchMarketplaceListings();
    }
  }, [activeTab]);

  const fetchPurchaseRequests = async () => {
    try {
      setLoading(true);
      const response = await PurchaseAPI.getPurchaseRequests({ role: 'buyer' });
      setPurchaseRequests(response.data);
    } catch (error: any) {
      console.error('Failed to fetch purchase requests:', error?.message || String(error));
      toast.error('Failed to load purchase requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketplaceListings = async () => {
    try {
      setLoading(true);
      const response = await MarketplaceAPI.getListings();
      setMarketplaceListings(response.data);
    } catch (error: any) {
      console.error('Failed to fetch marketplace listings:', error?.message || String(error));
      toast.error('Failed to load marketplace listings');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPurchaseFlow = (request: PurchaseRequest) => {
    setSelectedRequest(request);
    setCurrentStep(request.status === 'accepted' ? 'fund' : 
                  request.status === 'escrow_funded' ? 'verify' :
                  request.status === 'verification_passed' ? 'waiting' : 'complete');
    setShowPurchaseFlow(true);
  };

  const handleMockFund = async () => {
    if (!selectedRequest) return;
    
    try {
      setIsProcessing(true);
      
      await PurchaseAPI.mockFundEscrow(
        selectedRequest._id,
        selectedRequest.offeredPrice,
        `mock_${Date.now()}`,
        `fund_${selectedRequest._id}`
      );

      toast.success('Payment processed successfully!');
      setCurrentStep('verify');
      fetchPurchaseRequests();
    } catch (error: any) {
      console.error('Failed to fund escrow:', error?.message || String(error));
      toast.error(error?.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedRequest) return;
    
    try {
      setIsProcessing(true);
      
      const response = await PurchaseAPI.verifyPurchase(selectedRequest._id);
      
      if (response.data.verificationPassed) {
        toast.success('Verification passed! Waiting for seller to confirm transfer.');
        setCurrentStep('waiting');
      } else {
        // Show detailed failure reasons
        const failureReasons = response.data.failureReasons || [];
        const checks = response.data.checks || {};
        
        let message = 'Verification failed:\n';
        if (!checks.telemetryCheck) message += '• No recent telemetry data\n';
        if (!checks.trustScoreCheck) message += '• Trust score too low\n';
        if (!checks.blockchainCheck) message += '• Blockchain verification failed\n';
        if (!checks.storageCheck) message += '• Storage verification failed\n';
        
        if (failureReasons.length > 0) {
          message += '\nReasons: ' + failureReasons.join(', ');
        }
        
        toast.error(message);
      }
      
      fetchPurchaseRequests();
    } catch (error: any) {
      console.error('Failed to verify purchase:', error?.message || String(error));
      toast.error(error?.message || 'Failed to verify purchase');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_seller': return 'text-yellow-400 bg-yellow-400/20';
      case 'accepted': return 'text-green-400 bg-green-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      case 'counter_offer': return 'text-blue-400 bg-blue-400/20';
      case 'escrow_funded': return 'text-purple-400 bg-purple-400/20';
      case 'verification_passed': return 'text-emerald-400 bg-emerald-400/20';
      case 'sold': return 'text-green-400 bg-green-400/20';
      default: return 'text-slate-400 bg-slate-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_seller': return <Clock className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'counter_offer': return <DollarSign className="w-4 h-4" />;
      case 'escrow_funded': return <CreditCard className="w-4 h-4" />;
      case 'verification_passed': return <CheckSquare className="w-4 h-4" />;
      case 'sold': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getNextAction = (request: PurchaseRequest) => {
    switch (request.status) {
      case 'accepted': return { action: 'fund', label: 'Fund Escrow', color: 'green' };
      case 'escrow_funded': return { action: 'verify', label: 'Verify Purchase', color: 'blue' };
      case 'verification_passed': return { action: 'waiting', label: 'Waiting for Transfer', color: 'yellow' };
      case 'sold': return { action: 'complete', label: 'Purchase Complete', color: 'green' };
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-b-3xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <ShoppingCart className="w-8 h-8 mr-3" />
              <span className="px-3 py-1 bg-green-800/30 rounded-full text-sm font-medium">
                BUYER ACCESS
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-green-100 text-lg">Vehicle Buyer Dashboard</p>
            <p className="text-green-50 text-sm mt-1">
              Find your perfect vehicle with verified listings and fraud protection
            </p>
          </div>
          <div className="text-right">
            <p className="text-green-200 text-sm">Logged in as</p>
            <p className="font-semibold">{user.email}</p>
            <p className="text-green-200 text-sm">Role: {user.role.toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-8 -mt-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-2">
          <div className="flex space-x-2">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'requests', label: 'Purchase Requests', icon: MessageSquare },
              { id: 'marketplace', label: 'Marketplace', icon: Car }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
    {
      title: 'Viewed Vehicles',
      value: '34',
      change: '+12 this week',
      changeType: 'positive',
      icon: Eye,
      description: 'Recently browsed'
    },
    {
      title: 'Saved Vehicles',
      value: '7',
      change: '+3 new',
      changeType: 'positive',
      icon: Heart,
      description: 'In your wishlist'
    },
    {
      title: 'Budget Range',
                    value: '₹25K-₹50K',
      change: 'Updated today',
      changeType: 'neutral',
      icon: DollarSign,
      description: 'Current budget'
    },
    {
      title: 'Trust Score',
      value: '850',
      change: '+25 points',
      changeType: 'positive',
      icon: Shield,
      description: 'Verification level'
    }
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-400">{stat.title}</p>
                          <p className="text-2xl font-bold text-white">{stat.value}</p>
                          <p className="text-xs text-slate-500">{stat.description}</p>
                        </div>
                        <div className="p-3 bg-slate-700/50 rounded-xl">
                          <Icon className="w-6 h-6 text-slate-300" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center">
                        <span className={`text-sm font-medium ${
                          stat.changeType === 'positive' ? 'text-green-400' : 
                          stat.changeType === 'negative' ? 'text-red-400' : 'text-slate-400'
                        }`}>
                          {stat.change}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
    {
      title: 'Search Vehicles',
      description: 'Find your perfect car with advanced filters',
      icon: Search,
      action: 'Start Search',
                      color: 'bg-blue-500',
                      onClick: () => setActiveTab('marketplace')
                    },
                    {
                      title: 'Purchase Requests',
                      description: 'Manage your vehicle purchase requests',
                      icon: MessageSquare,
                      action: 'View Requests',
                      color: 'bg-emerald-500',
                      onClick: () => setActiveTab('requests')
    },
    {
      title: 'Financing Options',
      description: 'Get pre-approved for auto financing',
      icon: DollarSign,
      action: 'Get Pre-approved',
      color: 'bg-green-500'
    },
    {
      title: 'Vehicle History',
      description: 'Check vehicle history reports',
      icon: Shield,
      action: 'Check History',
      color: 'bg-purple-500'
                    }
                  ].map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:shadow-xl"
                      >
                        <div className="text-center">
                          <div className={`inline-flex p-3 rounded-xl ${action.color} mb-4`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-lg font-medium text-white mb-2">{action.title}</h3>
                          <p className="text-sm text-slate-400 mb-4">{action.description}</p>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={action.onClick}
                            className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-medium transition-all duration-200"
                          >
                            {action.action}
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'requests' && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Purchase Requests</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchPurchaseRequests}
                  disabled={loading}
                  className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </motion.button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                  <span className="ml-3 text-slate-300">Loading requests...</span>
                </div>
              ) : purchaseRequests.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-300 mb-2">No Purchase Requests</h3>
                  <p className="text-slate-400">You don't have any purchase requests yet.</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab('marketplace')}
                    className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-medium transition-all duration-200"
                  >
                    Browse Marketplace
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchaseRequests.map((request) => {
                    const nextAction = getNextAction(request);
  return (
                      <motion.div
                        key={request._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:shadow-xl"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Vehicle Info */}
                          <div className="lg:col-span-2 space-y-4">
                            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                              <div className="flex items-start space-x-3">
                                <div className="p-2 bg-blue-600/20 rounded-lg">
                                  <Car className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-bold text-white text-lg mb-2">
                                    {request.vehicleId?.make} {request.vehicleId?.vehicleModel} ({request.vehicleId?.year})
                                  </h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-slate-400 min-w-[80px]">VIN:</span>
                                      <span className="text-slate-300 font-mono text-xs">{request.vehicleId?.vin}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-slate-400 min-w-[80px]">Vehicle No:</span>
                                      <span className="text-slate-300 font-semibold">{request.vehicleId?.vehicleNumber}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-slate-400 min-w-[80px]">Total Kms:</span>
                                      <span className="text-slate-300">{request.vehicleId?.currentMileage?.toLocaleString()} km</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-slate-400 min-w-[80px]">Trust Score:</span>
                                      <span className={`font-semibold px-2 py-1 rounded-full text-xs ${request.vehicleId?.trustScore >= 70 ? 'text-green-400 bg-green-400/20' : request.vehicleId?.trustScore >= 50 ? 'text-yellow-400 bg-yellow-400/20' : 'text-red-400 bg-red-400/20'}`}>
                                        {request.vehicleId?.trustScore}/100
              </span>
            </div>
          </div>
          </div>
        </div>
      </div>

                            {/* Offer Details */}
                            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                              <div className="flex items-start space-x-3">
                                <div className="p-2 bg-emerald-600/20 rounded-lg">
                                  <DollarSign className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-white mb-2">Offer Details</h4>
                                  <div className="space-y-2">
                                    <p className="text-2xl font-bold text-green-400">
                                      ₹{request.offeredPrice?.toLocaleString()}
                                    </p>
                                    {request.counterPrice && (
                                      <p className="text-lg text-blue-400">
                                        Counter offer: ₹{request.counterPrice?.toLocaleString()}
                                      </p>
                                    )}
                                  </div>
                </div>
                </div>
              </div>

                            {/* Status */}
                            <div className="flex items-center justify-between">
                              <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                                {getStatusIcon(request.status)}
                                <span className="capitalize">{request.status.replace('_', ' ')}</span>
                              </div>
                              <span className="text-sm text-slate-400">
                                Requested: {new Date(request.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

                          {/* Actions */}
                          <div className="lg:col-span-1">
                            {nextAction && (
                              <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/30">
                                <h4 className="font-semibold text-white mb-4 text-center">Next Action</h4>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleOpenPurchaseFlow(request)}
                                  className={`w-full px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 border ${
                                    nextAction.color === 'green'
                                      ? 'bg-green-600/20 hover:bg-green-600/30 text-green-400 hover:text-green-300 border-green-600/30 hover:border-green-600/50'
                                      : nextAction.color === 'blue'
                                      ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border-blue-600/30 hover:border-blue-600/50'
                                      : 'bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 hover:text-yellow-300 border-yellow-600/30 hover:border-yellow-600/50'
                                  }`}
                                >
                                  {nextAction.action === 'fund' && <CreditCard className="w-5 h-5" />}
                                  {nextAction.action === 'verify' && <Zap className="w-5 h-5" />}
                                  {nextAction.action === 'waiting' && <Clock className="w-5 h-5" />}
                                  {nextAction.action === 'complete' && <CheckCircle className="w-5 h-5" />}
                                  <span>{nextAction.label}</span>
                                </motion.button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
          );
        })}
      </div>
              )}
            </motion.div>
          )}

          {activeTab === 'marketplace' && (
            <motion.div
              key="marketplace"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Marketplace</h2>
                <div className="flex items-center space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={fetchMarketplaceListings}
                    disabled={loading}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </motion.button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                  <span className="ml-3 text-slate-300">Loading marketplace...</span>
        </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {marketplaceListings.map((listing, index) => (
                    <motion.div
                      key={listing.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:shadow-xl"
                    >
                      <div className="space-y-4">
                        {/* Vehicle Image */}
                        <div className="w-full h-48 bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-xl flex items-center justify-center">
                          <Car className="w-12 h-12 text-slate-400" />
      </div>

                        {/* Vehicle Info */}
                        <div>
                          <h3 className="font-bold text-white text-lg mb-2">
                            {listing.vehicle.make} {listing.vehicle.model} ({listing.vehicle.year})
                          </h3>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">VIN:</span>
                              <span className="text-slate-300 font-mono text-xs">{listing.vehicle.vin}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Mileage:</span>
                              <span className="text-slate-300">{listing.vehicle.currentMileage?.toLocaleString()} km</span>
                            </div>
            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Trust Score:</span>
                              <span className={`font-semibold px-2 py-1 rounded-full text-xs ${listing.vehicle.trustScore >= 70 ? 'text-green-400 bg-green-400/20' : listing.vehicle.trustScore >= 50 ? 'text-yellow-400 bg-yellow-400/20' : 'text-red-400 bg-red-400/20'}`}>
                                {listing.vehicle.trustScore}/100
                              </span>
            </div>
          </div>
                </div>

                        {/* Price */}
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-green-400">
                            ₹{listing.price?.toLocaleString()}
                          </span>
                          {listing.negotiable && (
                            <span className="text-xs text-slate-400">Negotiable</span>
                    )}
                  </div>

                        {/* Actions */}
                        <div className="flex space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-1 text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Details</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-1 text-sm"
                          >
                            <DollarSign className="w-4 h-4" />
                            <span>Buy</span>
                          </motion.button>
                  </div>
                </div>
                    </motion.div>
            ))}
          </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        </div>

      {/* Purchase Flow Modal */}
      {showPurchaseFlow && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setShowPurchaseFlow(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-2xl mx-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700/50"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-600/20 rounded-xl">
                    <Car className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Purchase Flow</h2>
                    <p className="text-sm text-slate-300">Complete your vehicle purchase</p>
            </div>
          </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPurchaseFlow(false)}
                  className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Vehicle Info */}
                <div className="bg-slate-800/30 rounded-xl p-4 mb-6 border border-slate-700/30">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-600/20 rounded-lg">
                      <Car className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-2">
                        {selectedRequest.vehicleId?.make} {selectedRequest.vehicleId?.vehicleModel} ({selectedRequest.vehicleId?.year})
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400">VIN:</span>
                          <span className="text-slate-300 font-mono text-xs">{selectedRequest.vehicleId?.vin}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400">Vehicle No:</span>
                          <span className="text-slate-300 font-semibold">{selectedRequest.vehicleId?.vehicleNumber}</span>
                        </div>
                  <div className="flex items-center space-x-2">
                          <span className="text-slate-400">Total Kms:</span>
                          <span className="text-slate-300">{selectedRequest.vehicleId?.currentMileage?.toLocaleString()} km</span>
                  </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400">Trust Score:</span>
                          <span className={`font-semibold px-2 py-1 rounded-full text-xs ${selectedRequest.vehicleId?.trustScore >= 70 ? 'text-green-400 bg-green-400/20' : selectedRequest.vehicleId?.trustScore >= 50 ? 'text-yellow-400 bg-yellow-400/20' : 'text-red-400 bg-red-400/20'}`}>
                            {selectedRequest.vehicleId?.trustScore}/100
                    </span>
                  </div>
                </div>
              </div>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-white">Purchase Progress</h4>
                    <span className="text-sm text-slate-400">Step {currentStep === 'fund' ? '1' : currentStep === 'verify' ? '2' : currentStep === 'waiting' ? '3' : '4'} of 4</span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Step 1: Fund */}
                    <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${currentStep === 'fund' ? 'text-blue-400 bg-blue-400/20' : 'text-slate-400 bg-slate-400/20'}`}>
                      <CreditCard className="w-4 h-4" />
                      <span>Fund Escrow</span>
                    </div>
                    
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    
                    {/* Step 2: Verify */}
                    <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${currentStep === 'verify' ? 'text-purple-400 bg-purple-400/20' : 'text-slate-400 bg-slate-400/20'}`}>
                      <Shield className="w-4 h-4" />
                      <span>Verify</span>
                    </div>
                    
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    
                    {/* Step 3: Waiting */}
                    <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${currentStep === 'waiting' ? 'text-yellow-400 bg-yellow-400/20' : 'text-slate-400 bg-slate-400/20'}`}>
                      <Clock className="w-4 h-4" />
                      <span>Transfer</span>
          </div>
                    
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    
                    {/* Step 4: Complete */}
                    <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${currentStep === 'complete' ? 'text-green-400 bg-green-400/20' : 'text-slate-400 bg-slate-400/20'}`}>
                      <CheckCircle className="w-4 h-4" />
                      <span>Complete</span>
          </div>
        </div>
      </div>

                {/* Current Step Content */}
                {currentStep === 'fund' && (
                  <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
                    <div className="text-center mb-6">
                      <div className="p-3 bg-blue-600/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <CreditCard className="w-8 h-8 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Fund Escrow</h3>
                      <p className="text-slate-300">Pay the agreed amount to secure your purchase</p>
                    </div>
                    
                    <div className="bg-slate-700/30 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Amount to Pay:</span>
                        <span className="text-2xl font-bold text-green-400">₹{selectedRequest.offeredPrice?.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleMockFund}
                      disabled={isProcessing}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Processing Payment...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          <span>Pay ₹{selectedRequest.offeredPrice?.toLocaleString()} (Mock)</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                )}

                {currentStep === 'verify' && (
                  <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
                    <div className="text-center mb-6">
                      <div className="p-3 bg-purple-600/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Verify Purchase</h3>
                      <p className="text-slate-300">System will verify vehicle data and blockchain records</p>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleVerify}
                      disabled={isProcessing}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5" />
                          <span>Start Verification</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                )}

                {currentStep === 'waiting' && (
                  <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
                    <div className="text-center mb-6">
                      <div className="p-3 bg-yellow-600/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Clock className="w-8 h-8 text-yellow-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Waiting for Transfer</h3>
                      <p className="text-slate-300">Seller will confirm the ownership transfer</p>
                    </div>
                    
                    <div className="bg-slate-700/30 rounded-lg p-4 mb-6">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-slate-300 font-medium">Seller: {selectedRequest.sellerId?.fullName}</p>
                          <p className="text-sm text-slate-400">Will initiate transfer confirmation</p>
                        </div>
                      </div>
        </div>
                    
            <div className="text-center">
                      <p className="text-slate-400 text-sm">You will be notified once the transfer is complete</p>
                    </div>
                  </div>
                )}

                {currentStep === 'complete' && (
                  <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
                    <div className="text-center mb-6">
                      <div className="p-3 bg-green-600/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Purchase Complete!</h3>
                      <p className="text-slate-300">You now own this vehicle</p>
            </div>
                    
                    <div className="bg-slate-700/30 rounded-lg p-4 mb-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">Final Price:</span>
                          <span className="font-semibold text-green-400">₹{selectedRequest.offeredPrice?.toLocaleString()}</span>
            </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">Transaction Hash:</span>
                          <span className="text-slate-300 font-mono text-xs">0x1234...5678</span>
            </div>
          </div>
        </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowPurchaseFlow(false)}
                      className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>View in My Vehicles</span>
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
      </div>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboard; 