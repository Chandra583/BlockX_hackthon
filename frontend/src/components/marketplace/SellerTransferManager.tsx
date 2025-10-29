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
  ArrowRight,
  Zap,
  Eye,
  X,
  Link,
  Copy,
  Calendar,
  MapPin,
  Star,
  TrendingUp,
  FileText,
  Hash,
  Wallet,
  Phone,
  Mail,
  Building,
  Award,
  Lock,
  Unlock,
  Activity,
  Database,
  Globe,
  Key
} from 'lucide-react';
import { PurchaseAPI, type PurchaseRequest } from '../../api/purchase';
import { formatPrice } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';

interface SellerTransferManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onTransferComplete?: () => void;
}

export const SellerTransferManager: React.FC<SellerTransferManagerProps> = ({
  isOpen,
  onClose,
  onTransferComplete
}) => {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await PurchaseAPI.getPurchaseRequests({ role: 'seller' });
      // Filter for requests ready for transfer
      const transferReadyRequests = response.data.filter(
        req => req.status === 'verification_passed' || req.status === 'transfer_pending'
      );
      setRequests(transferReadyRequests);
    } catch (error: any) {
      console.error('Failed to fetch purchase requests:', error);
      toast.error('Failed to load purchase requests');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTransfer = (request: PurchaseRequest) => {
    setSelectedRequest(request);
    setShowConfirmModal(true);
  };

  const executeTransfer = async () => {
    if (!selectedRequest) return;

    try {
      setIsProcessing(true);
      
      const result = await PurchaseAPI.confirmTransfer(selectedRequest._id);
      
      toast.success('Ownership transferred successfully!');
      
      if (result.data.solanaTxHash) {
        toast.success(
          `Transaction recorded: ${result.data.solanaTxHash}`,
          { duration: 5000 }
        );
      }
      
      setShowConfirmModal(false);
      setSelectedRequest(null);
      fetchRequests();
      
      if (onTransferComplete) {
        onTransferComplete();
      }
    } catch (error: any) {
      console.error('Failed to confirm transfer:', error);
      toast.error(error.message || 'Failed to confirm transfer');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_seller': return 'text-yellow-400 bg-yellow-400/20';
      case 'accepted': return 'text-green-400 bg-green-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      case 'counter_offer': return 'text-blue-400 bg-blue-400/20';
      case 'escrow_funded': return 'text-purple-400 bg-purple-400/20';
      case 'verification_passed': return 'text-emerald-400 bg-emerald-400/20';
      case 'verification_failed': return 'text-red-400 bg-red-400/20';
      case 'transfer_pending': return 'text-orange-400 bg-orange-400/20';
      case 'sold': return 'text-green-400 bg-green-400/20';
      default: return 'text-slate-400 bg-slate-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_seller': return <Clock className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'counter_offer': return <MessageSquare className="w-4 h-4" />;
      case 'escrow_funded': return <CreditCard className="w-4 h-4" />;
      case 'verification_passed': return <Shield className="w-4 h-4" />;
      case 'verification_failed': return <AlertCircle className="w-4 h-4" />;
      case 'transfer_pending': return <ArrowRight className="w-4 h-4" />;
      case 'sold': return <CheckSquare className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
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
                  <div className="p-2 bg-purple-600/20 rounded-xl">
                    <ArrowRight className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Transfer Manager</h2>
                    <p className="text-sm text-slate-300">Complete ownership transfers</p>
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
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                    <span className="ml-3 text-slate-300">Loading requests...</span>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-12">
                    <ArrowRight className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-300 mb-2">No Transfer Requests</h3>
                    <p className="text-slate-400">No requests are ready for ownership transfer yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {requests.map((request) => (
                      <motion.div
                        key={request._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:shadow-xl"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Vehicle Information */}
                          <div className="lg:col-span-2 space-y-4">
                            {/* Vehicle Details */}
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
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-slate-400 min-w-[60px]">Name:</span>
                                      <span className="text-slate-300 font-medium">{request.buyerId?.fullName}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Mail className="w-4 h-4 text-slate-400" />
                                      <span className="text-slate-300 text-sm">{request.buyerId?.email}</span>
                                    </div>
                                    {request.buyerId?.walletAddress && (
                                      <div className="flex items-center space-x-2">
                                        <Wallet className="w-4 h-4 text-slate-400" />
                                        <span className="text-slate-300 text-sm font-mono">
                                          {request.buyerId.walletAddress.slice(0, 8)}...{request.buyerId.walletAddress.slice(-8)}
                                        </span>
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => copyToClipboard(request.buyerId?.walletAddress || '')}
                                          className="p-1 rounded bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-slate-300 transition-colors"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </motion.button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Sale Details */}
                            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                              <div className="flex items-start space-x-3">
                                <div className="p-2 bg-emerald-600/20 rounded-lg">
                                  <DollarSign className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-white mb-2">Sale Details</h4>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-400">Final Price:</span>
                                      <span className="text-2xl font-bold text-green-400">₹{request.offeredPrice?.toLocaleString()}</span>
                                    </div>
                                    {request.counterPrice && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Counter Offer:</span>
                                        <span className="text-lg text-blue-400">₹{request.counterPrice?.toLocaleString()}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-400">Request Date:</span>
                                      <span className="text-slate-300">{new Date(request.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Verification Results */}
                            {request.verificationResults && (
                              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                                <div className="flex items-start space-x-3">
                                  <div className="p-2 bg-green-600/20 rounded-lg">
                                    <Shield className="w-5 h-5 text-green-400" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-white mb-2">Verification Results</h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                      <div className={`flex items-center space-x-2 ${request.verificationResults.telemetryCheck ? 'text-green-400' : 'text-red-400'}`}>
                                        <Activity className="w-4 h-4" />
                                        <span>Telemetry {request.verificationResults.telemetryCheck ? '✓' : '✗'}</span>
                                      </div>
                                      <div className={`flex items-center space-x-2 ${request.verificationResults.trustScoreCheck ? 'text-green-400' : 'text-red-400'}`}>
                                        <Award className="w-4 h-4" />
                                        <span>Trust Score {request.verificationResults.trustScoreCheck ? '✓' : '✗'}</span>
                                      </div>
                                      <div className={`flex items-center space-x-2 ${request.verificationResults.blockchainCheck ? 'text-green-400' : 'text-red-400'}`}>
                                        <Database className="w-4 h-4" />
                                        <span>Blockchain {request.verificationResults.blockchainCheck ? '✓' : '✗'}</span>
                                      </div>
                                      <div className={`flex items-center space-x-2 ${request.verificationResults.storageCheck ? 'text-green-400' : 'text-red-400'}`}>
                                        <Globe className="w-4 h-4" />
                                        <span>Storage {request.verificationResults.storageCheck ? '✓' : '✗'}</span>
                                      </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-400 text-sm">Verified at:</span>
                                        <span className="text-slate-300 text-sm">
                                          {new Date(request.verificationResults.verifiedAt || '').toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Transaction History */}
                            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                              <div className="flex items-start space-x-3">
                                <div className="p-2 bg-purple-600/20 rounded-lg">
                                  <Clock className="w-5 h-5 text-purple-400" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-white mb-2">Transaction Timeline</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                                      <span className="text-slate-300">Request Created</span>
                                      <span className="text-slate-400 ml-auto">{new Date(request.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 rounded-full bg-green-400" />
                                      <span className="text-slate-300">Seller Accepted</span>
                                      <span className="text-slate-400 ml-auto">Completed</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                                      <span className="text-slate-300">Escrow Funded</span>
                                      <span className="text-slate-400 ml-auto">Completed</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                      <span className="text-slate-300">Verification Passed</span>
                                      <span className="text-slate-400 ml-auto">Completed</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                      <span className="text-slate-300">Transfer Pending</span>
                                      <span className="text-slate-400 ml-auto">In Progress</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Panel */}
                          <div className="lg:col-span-1">
                            <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/30">
                              <h4 className="font-semibold text-white mb-4 text-center">Transfer Actions</h4>
                              
                              {/* Status Badge */}
                              <div className="mb-4">
                                <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                                  {getStatusIcon(request.status)}
                                  <span className="capitalize">{request.status.replace('_', ' ')}</span>
                                </div>
                              </div>

                              {/* Transfer Button */}
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleConfirmTransfer(request)}
                                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600/20 to-purple-500/20 hover:from-purple-600/30 hover:to-purple-500/30 text-purple-400 hover:text-purple-300 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 border border-purple-600/30 hover:border-purple-600/50"
                              >
                                <ArrowRight className="w-5 h-5" />
                                <span>Confirm Transfer</span>
                              </motion.button>

                              {/* Additional Info */}
                              <div className="mt-4 pt-4 border-t border-slate-700/50">
                                <div className="text-center">
                                  <p className="text-xs text-slate-400 mb-2">This will:</p>
                                  <ul className="text-xs text-slate-300 space-y-1">
                                    <li>• Transfer vehicle ownership</li>
                                    <li>• Create Solana transaction</li>
                                    <li>• Release escrow funds</li>
                                    <li>• Update ownership history</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Confirmation Modal */}
            <AnimatePresence>
              {showConfirmModal && selectedRequest && (
                <div className="fixed inset-0 z-60 overflow-y-auto">
                  <div className="flex min-h-full items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                      onClick={() => setShowConfirmModal(false)}
                    />

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="relative w-full max-w-lg mx-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700/50"
                    >
                      <div className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-purple-600/20 rounded-xl">
                            <ArrowRight className="w-6 h-6 text-purple-400" />
                          </div>
                          <h3 className="text-lg font-bold text-white">Confirm Ownership Transfer</h3>
                        </div>

                        <div className="space-y-4 mb-6">
                          {/* Vehicle Details */}
                          <div className="bg-slate-800/50 rounded-lg p-4">
                            <h4 className="font-medium text-white mb-3 flex items-center space-x-2">
                              <Car className="w-4 h-4 text-blue-400" />
                              <span>Vehicle Details</span>
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Vehicle:</span>
                                <span className="text-white font-medium">
                                  {selectedRequest.vehicleId?.make} {selectedRequest.vehicleId?.vehicleModel} ({selectedRequest.vehicleId?.year})
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">VIN:</span>
                                <span className="text-slate-300 font-mono text-xs">{selectedRequest.vehicleId?.vin}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Vehicle No:</span>
                                <span className="text-slate-300 font-semibold">{selectedRequest.vehicleId?.vehicleNumber}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Mileage:</span>
                                <span className="text-slate-300">{selectedRequest.vehicleId?.currentMileage?.toLocaleString()} km</span>
                              </div>
                            </div>
                          </div>

                          {/* Buyer Details */}
                          <div className="bg-slate-800/50 rounded-lg p-4">
                            <h4 className="font-medium text-white mb-3 flex items-center space-x-2">
                              <User className="w-4 h-4 text-green-400" />
                              <span>Buyer Information</span>
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Name:</span>
                                <span className="text-white font-medium">{selectedRequest.buyerId?.fullName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Email:</span>
                                <span className="text-slate-300">{selectedRequest.buyerId?.email}</span>
                              </div>
                              {selectedRequest.buyerId?.walletAddress && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Wallet:</span>
                                  <span className="text-slate-300 font-mono text-xs">
                                    {selectedRequest.buyerId.walletAddress.slice(0, 8)}...{selectedRequest.buyerId.walletAddress.slice(-8)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Sale Details */}
                          <div className="bg-slate-800/50 rounded-lg p-4">
                            <h4 className="font-medium text-white mb-3 flex items-center space-x-2">
                              <DollarSign className="w-4 h-4 text-emerald-400" />
                              <span>Sale Details</span>
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Final Price:</span>
                                <span className="text-green-400 font-bold text-lg">₹{selectedRequest.offeredPrice?.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Request Date:</span>
                                <span className="text-slate-300">{new Date(selectedRequest.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Verification Status */}
                          {selectedRequest.verificationResults && (
                            <div className="bg-slate-800/50 rounded-lg p-4">
                              <h4 className="font-medium text-white mb-3 flex items-center space-x-2">
                                <Shield className="w-4 h-4 text-green-400" />
                                <span>Verification Status</span>
                              </h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className={`flex items-center space-x-2 ${selectedRequest.verificationResults.telemetryCheck ? 'text-green-400' : 'text-red-400'}`}>
                                  <Activity className="w-4 h-4" />
                                  <span>Telemetry {selectedRequest.verificationResults.telemetryCheck ? '✓' : '✗'}</span>
                                </div>
                                <div className={`flex items-center space-x-2 ${selectedRequest.verificationResults.trustScoreCheck ? 'text-green-400' : 'text-red-400'}`}>
                                  <Award className="w-4 h-4" />
                                  <span>Trust Score {selectedRequest.verificationResults.trustScoreCheck ? '✓' : '✗'}</span>
                                </div>
                                <div className={`flex items-center space-x-2 ${selectedRequest.verificationResults.blockchainCheck ? 'text-green-400' : 'text-red-400'}`}>
                                  <Database className="w-4 h-4" />
                                  <span>Blockchain {selectedRequest.verificationResults.blockchainCheck ? '✓' : '✗'}</span>
                                </div>
                                <div className={`flex items-center space-x-2 ${selectedRequest.verificationResults.storageCheck ? 'text-green-400' : 'text-red-400'}`}>
                                  <Globe className="w-4 h-4" />
                                  <span>Storage {selectedRequest.verificationResults.storageCheck ? '✓' : '✗'}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Blockchain Transaction Info */}
                          <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <Database className="w-4 h-4 text-blue-400" />
                              <span className="text-sm font-medium text-blue-400">Blockchain Transaction</span>
                            </div>
                            <p className="text-xs text-slate-300 mb-2">
                              This will create a Solana memo transaction recording the ownership transfer on devnet.
                            </p>
                            <div className="text-xs text-slate-400">
                              <p>• Transaction will be recorded on Solana devnet</p>
                              <p>• Ownership history will be updated</p>
                              <p>• Escrow funds will be released</p>
                            </div>
                          </div>
                        </div>

                        <p className="text-slate-300 mb-6">
                          Are you sure you want to transfer ownership of this vehicle? This action cannot be undone.
                        </p>

                        <div className="flex space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowConfirmModal(false)}
                            className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg font-medium transition-colors"
                          >
                            Cancel
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={executeTransfer}
                            disabled={isProcessing}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                          >
                            {isProcessing ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <span>Confirm Transfer</span>
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
