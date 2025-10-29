import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  DollarSign,
  MessageSquare,
  Clock,
  User,
  Car,
  Shield,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  CreditCard,
  CheckSquare,
  ArrowRight
} from 'lucide-react';
import { PurchaseAPI, type PurchaseRequest } from '../../api/purchase';
import { formatPrice } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';

interface SellerRequestsListProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestUpdate?: () => void;
}

export const SellerRequestsList: React.FC<SellerRequestsListProps> = ({
  isOpen,
  onClose,
  onRequestUpdate
}) => {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseAction, setResponseAction] = useState<'accept' | 'reject' | 'counter'>('accept');
  const [counterPrice, setCounterPrice] = useState<number>(0);
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await PurchaseAPI.getPurchaseRequests({ role: 'seller' });
      setRequests(response.data);
    } catch (error: any) {
      console.error('Failed to fetch purchase requests:', error);
      toast.error('Failed to load purchase requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = (request: PurchaseRequest, action: 'accept' | 'reject' | 'counter') => {
    setSelectedRequest(request);
    setResponseAction(action);
    if (action === 'counter') {
      setCounterPrice(request.offeredPrice);
    }
    setShowResponseModal(true);
  };

  const confirmResponse = async () => {
    if (!selectedRequest) return;

    try {
      setIsResponding(true);
      
      await PurchaseAPI.respondToRequest(
        selectedRequest._id,
        responseAction,
        responseAction === 'counter' ? counterPrice : undefined
      );

      toast.success(`Request ${responseAction}ed successfully!`);
      setShowResponseModal(false);
      setSelectedRequest(null);
      fetchRequests();
      
      if (onRequestUpdate) {
        onRequestUpdate();
      }
    } catch (error: any) {
      console.error('Failed to respond to request:', error);
      toast.error(error.message || 'Failed to respond to request');
    } finally {
      setIsResponding(false);
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

  const canRespond = (status: string) => {
    return status === 'pending_seller';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-4xl mx-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700/50"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-600/20 rounded-xl">
                    <MessageSquare className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Purchase Requests</h2>
                    <p className="text-sm text-slate-300">Manage incoming purchase requests</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={fetchRequests}
                    disabled={loading}
                    className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                    <span className="ml-3 text-slate-300">Loading requests...</span>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-300 mb-2">No Purchase Requests</h3>
                    <p className="text-slate-400">You don't have any pending purchase requests yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {requests.map((request) => (
                      <motion.div
                        key={request._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/70 transition-all duration-300 hover:border-slate-600/50 hover:shadow-xl"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Left Column - Vehicle & Buyer Info */}
                          <div className="lg:col-span-2 space-y-5">
                            {/* Vehicle Information */}
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
                                      <span className="text-slate-400 min-w-[80px]">Color:</span>
                                      <span className="text-slate-300 capitalize">{request.vehicleId?.color}</span>
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

                            {/* Buyer Information */}
                            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                              <div className="flex items-start space-x-3">
                                <div className="p-2 bg-green-600/20 rounded-lg">
                                  <User className="w-5 h-5 text-green-400" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-white mb-2">Buyer Information</h4>
                                  <div className="space-y-1">
                                    <p className="text-slate-300">
                                      <span className="font-medium">{request.buyerId?.fullName}</span>
                                    </p>
                                    <p className="text-sm text-slate-400">
                                      Email: {request.buyerId?.email}
                                    </p>
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

                            {/* Message */}
                            {request.message && (
                              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                                <div className="flex items-start space-x-3">
                                  <div className="p-2 bg-purple-600/20 rounded-lg">
                                    <MessageSquare className="w-5 h-5 text-purple-400" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-white mb-2">Buyer's Message</h4>
                                    <p className="text-slate-300 italic bg-slate-700/30 rounded-lg p-3">
                                      "{request.message}"
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Status & Date */}
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

                          {/* Right Column - Actions */}
                          <div className="lg:col-span-1">
                            {canRespond(request.status) && (
                              <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/30">
                                <h4 className="font-semibold text-white mb-4 text-center">Quick Actions</h4>
                                <div className="space-y-4">
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleRespond(request, 'accept')}
                                    className="w-full px-4 py-3 bg-green-600/20 hover:bg-green-600/30 text-green-400 hover:text-green-300 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 border border-green-600/30 hover:border-green-600/50"
                                  >
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Accept ₹{request.offeredPrice?.toLocaleString()}</span>
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleRespond(request, 'counter')}
                                    className="w-full px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 border border-blue-600/30 hover:border-blue-600/50"
                                  >
                                    <DollarSign className="w-5 h-5" />
                                    <span>Counter Offer</span>
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleRespond(request, 'reject')}
                                    className="w-full px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 border border-red-600/30 hover:border-red-600/50"
                                  >
                                    <XCircle className="w-5 h-5" />
                                    <span>Decline Offer</span>
                                  </motion.button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Response Confirmation Modal */}
            <AnimatePresence>
              {showResponseModal && selectedRequest && (
                <div className="fixed inset-0 z-60 overflow-y-auto">
                  <div className="flex min-h-full items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                      onClick={() => setShowResponseModal(false)}
                    />

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="relative w-full max-w-md mx-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700/50"
                    >
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-white mb-4">
                          {responseAction === 'accept' && 'Accept Purchase Request'}
                          {responseAction === 'reject' && 'Reject Purchase Request'}
                          {responseAction === 'counter' && 'Make Counter Offer'}
                        </h3>

                        {responseAction === 'counter' && (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Counter Offer Price (₹)
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">₹</span>
                              <input
                                type="number"
                                value={counterPrice}
                                onChange={(e) => setCounterPrice(Number(e.target.value))}
                                className="w-full pl-8 pr-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                min="0"
                                step="100"
                                placeholder="Enter counter offer amount"
                              />
                            </div>
                          </div>
                        )}

                        <p className="text-slate-300 mb-6">
                          {responseAction === 'accept' && 'Are you sure you want to accept this purchase request?'}
                          {responseAction === 'reject' && 'Are you sure you want to reject this purchase request?'}
                          {responseAction === 'counter' && 'Are you sure you want to make this counter offer?'}
                        </p>

                        <div className="flex space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowResponseModal(false)}
                            className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg font-medium transition-colors"
                          >
                            Cancel
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={confirmResponse}
                            disabled={isResponding || (responseAction === 'counter' && (!counterPrice || counterPrice <= 0))}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                          >
                            {isResponding ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <span>Confirm</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
