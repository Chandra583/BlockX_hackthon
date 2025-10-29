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
  X
} from 'lucide-react';
import { PurchaseAPI, type PurchaseRequest } from '../../api/purchase';
import { formatPrice } from '../../utils/formatCurrency';
import { BuyerPurchaseFlow } from './BuyerPurchaseFlow';
import toast from 'react-hot-toast';

interface BuyerRequestsListProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestUpdate?: () => void;
}

export const BuyerRequestsList: React.FC<BuyerRequestsListProps> = ({
  isOpen,
  onClose,
  onRequestUpdate
}) => {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [showPurchaseFlow, setShowPurchaseFlow] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'fund' | 'verify' | 'view'>('fund');
  const [fundAmount, setFundAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen]);

  const handleOpenPurchaseFlow = (request: PurchaseRequest) => {
    setSelectedRequest(request);
    setShowPurchaseFlow(true);
  };

  const handleClosePurchaseFlow = () => {
    setShowPurchaseFlow(false);
    setSelectedRequest(null);
    fetchRequests(); // Refresh the list
  };

  const handleAction = (request: PurchaseRequest, action: 'fund' | 'verify' | 'view') => {
    setSelectedRequest(request);
    setActionType(action);
    if (action === 'fund') {
      setFundAmount(request.offeredPrice);
    }
    setShowActionModal(true);
  };

  const executeAction = async () => {
    if (!selectedRequest) return;

    try {
      setIsProcessing(true);
      
      switch (actionType) {
        case 'fund':
          await PurchaseAPI.mockFundEscrow(
            selectedRequest.id,
            fundAmount,
            undefined,
            `fund_${selectedRequest.id}_${Date.now()}`
          );
          toast.success('Escrow funded successfully!');
          break;
        case 'verify':
          const verifyResult = await PurchaseAPI.verifyPurchase(selectedRequest.id);
          if (verifyResult.data.verificationPassed) {
            toast.success('Verification passed! Ready for transfer.');
          } else {
            toast.error('Verification failed. Check the details.');
          }
          break;
      }

      setShowActionModal(false);
      setSelectedRequest(null);
      fetchRequests();
      
      if (onRequestUpdate) {
        onRequestUpdate();
      }
    } catch (error: any) {
      console.error('Failed to execute action:', error);
      toast.error(error.message || 'Failed to execute action');
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
      case 'escrow_pending': return 'text-purple-400 bg-purple-400/20';
      case 'escrow_funded': return 'text-purple-400 bg-purple-400/20';
      case 'verifying': return 'text-orange-400 bg-orange-400/20';
      case 'verification_passed': return 'text-emerald-400 bg-emerald-400/20';
      case 'verification_failed': return 'text-red-400 bg-red-400/20';
      case 'transfer_pending': return 'text-blue-400 bg-blue-400/20';
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
      case 'escrow_pending': return <CreditCard className="w-4 h-4" />;
      case 'escrow_funded': return <CreditCard className="w-4 h-4" />;
      case 'verifying': return <Zap className="w-4 h-4" />;
      case 'verification_passed': return <CheckSquare className="w-4 h-4" />;
      case 'verification_failed': return <AlertCircle className="w-4 h-4" />;
      case 'transfer_pending': return <ArrowRight className="w-4 h-4" />;
      case 'sold': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case 'accepted': return { action: 'fund', label: 'Fund Escrow', color: 'green' };
      case 'escrow_funded': return { action: 'verify', label: 'Verify Purchase', color: 'blue' };
      case 'verification_passed': return { action: 'view', label: 'Awaiting Transfer', color: 'blue' };
      case 'sold': return { action: 'view', label: 'Completed', color: 'green' };
      default: return null;
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
                  <div className="p-2 bg-green-600/20 rounded-xl">
                    <Car className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">My Purchase Requests</h2>
                    <p className="text-sm text-slate-300">Track your vehicle purchase progress</p>
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
                    <div className="w-8 h-8 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                    <span className="ml-3 text-slate-300">Loading requests...</span>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-12">
                    <Car className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-300 mb-2">No Purchase Requests</h3>
                    <p className="text-slate-400">You haven't made any purchase requests yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => {
                      const nextAction = getNextAction(request.status);
                      return (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {/* Vehicle Info */}
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="p-2 bg-slate-700/50 rounded-lg">
                                  <Car className="w-5 h-5 text-slate-300" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-white">
                                    {request.vehicle?.make} {request.vehicle?.model} ({request.vehicle?.year})
                                  </h3>
                                  <p className="text-sm text-slate-400">
                                    VIN: {request.vehicle?.vin} • Mileage: {request.vehicle?.currentMileage?.toLocaleString()} km
                                  </p>
                                </div>
                              </div>

                              {/* Seller Info */}
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="p-2 bg-slate-700/50 rounded-lg">
                                  <User className="w-5 h-5 text-slate-300" />
                                </div>
                                <div>
                                  <p className="text-sm text-slate-300">
                                    <span className="font-medium">{request.seller?.firstName} {request.seller?.lastName}</span>
                                  </p>
                                  <p className="text-xs text-slate-400">{request.seller?.email}</p>
                                </div>
                              </div>

                              {/* Offer Details */}
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="p-2 bg-slate-700/50 rounded-lg">
                                  <DollarSign className="w-5 h-5 text-slate-300" />
                                </div>
                                <div>
                                  <p className="text-lg font-semibold text-green-400">
                                    {formatPrice(request.offeredPrice)}
                                  </p>
                                  {request.counterPrice && (
                                    <p className="text-sm text-blue-400">
                                      Counter offer: {formatPrice(request.counterPrice)}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Verification Results */}
                              {request.verificationResults && (
                                <div className="mb-3">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Shield className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-300">Verification Results</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className={`flex items-center space-x-1 ${request.verificationResults.telemetryCheck ? 'text-green-400' : 'text-red-400'}`}>
                                      <div className={`w-2 h-2 rounded-full ${request.verificationResults.telemetryCheck ? 'bg-green-400' : 'bg-red-400'}`} />
                                      <span>Telemetry</span>
                                    </div>
                                    <div className={`flex items-center space-x-1 ${request.verificationResults.trustScoreCheck ? 'text-green-400' : 'text-red-400'}`}>
                                      <div className={`w-2 h-2 rounded-full ${request.verificationResults.trustScoreCheck ? 'bg-green-400' : 'bg-red-400'}`} />
                                      <span>Trust Score</span>
                                    </div>
                                    <div className={`flex items-center space-x-1 ${request.verificationResults.blockchainCheck ? 'text-green-400' : 'text-red-400'}`}>
                                      <div className={`w-2 h-2 rounded-full ${request.verificationResults.blockchainCheck ? 'bg-green-400' : 'bg-red-400'}`} />
                                      <span>Blockchain</span>
                                    </div>
                                    <div className={`flex items-center space-x-1 ${request.verificationResults.storageCheck ? 'text-green-400' : 'text-red-400'}`}>
                                      <div className={`w-2 h-2 rounded-full ${request.verificationResults.storageCheck ? 'bg-green-400' : 'bg-red-400'}`} />
                                      <span>Storage</span>
                                    </div>
                                  </div>
                                  {request.verificationResults.failureReasons && (
                                    <div className="mt-2 p-2 bg-red-900/20 border border-red-500/20 rounded-lg">
                                      <p className="text-xs text-red-400">
                                        {request.verificationResults.failureReasons.join(', ')}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Status */}
                              <div className="flex items-center space-x-2">
                                <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                  {getStatusIcon(request.status)}
                                  <span className="capitalize">{request.status.replace('_', ' ')}</span>
                                </div>
                                <span className="text-xs text-slate-400">
                                  {new Date(request.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            {nextAction && (
                              <div className="flex flex-col space-y-2 ml-4">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleOpenPurchaseFlow(request)}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                                    nextAction.color === 'green'
                                      ? 'bg-green-600/20 hover:bg-green-600/30 text-green-400 hover:text-green-300'
                                      : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300'
                                  }`}
                                >
                                  {nextAction.action === 'fund' && <CreditCard className="w-4 h-4" />}
                                  {nextAction.action === 'verify' && <Zap className="w-4 h-4" />}
                                  {nextAction.action === 'view' && <Eye className="w-4 h-4" />}
                                  <span>Continue Purchase</span>
                                </motion.button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Action Modal */}
            <AnimatePresence>
              {showActionModal && selectedRequest && (
                <div className="fixed inset-0 z-60 overflow-y-auto">
                  <div className="flex min-h-full items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                      onClick={() => setShowActionModal(false)}
                    />

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="relative w-full max-w-md mx-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700/50"
                    >
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-white mb-4">
                          {actionType === 'fund' && 'Fund Escrow (Mock Payment)'}
                          {actionType === 'verify' && 'Verify Purchase'}
                          {actionType === 'view' && 'Purchase Status'}
                        </h3>

                        {actionType === 'fund' && (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Payment Amount
                            </label>
                            <input
                              type="number"
                              value={fundAmount}
                              onChange={(e) => setFundAmount(Number(e.target.value))}
                              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                              min="0"
                              step="100"
                            />
                            <p className="text-xs text-slate-400 mt-1">
                              This is a mock payment for demo purposes
                            </p>
                          </div>
                        )}

                        {actionType === 'verify' && (
                          <div className="mb-4">
                            <p className="text-slate-300">
                              This will run verification checks on the vehicle including:
                            </p>
                            <ul className="text-sm text-slate-400 mt-2 space-y-1">
                              <li>• Recent telemetry data (within 24h)</li>
                              <li>• Trust score validation (≥50)</li>
                              <li>• Blockchain transaction confirmation</li>
                              <li>• Storage reference validation</li>
                            </ul>
                          </div>
                        )}

                        <p className="text-slate-300 mb-6">
                          {actionType === 'fund' && 'Are you ready to fund the escrow with this amount?'}
                          {actionType === 'verify' && 'Are you ready to run verification checks?'}
                          {actionType === 'view' && 'This purchase is awaiting seller confirmation for transfer.'}
                        </p>

                        <div className="flex space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowActionModal(false)}
                            className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg font-medium transition-colors"
                          >
                            Cancel
                          </motion.button>
                          {actionType !== 'view' && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={executeAction}
                              disabled={isProcessing || (actionType === 'fund' && (!fundAmount || fundAmount <= 0))}
                              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            >
                              {isProcessing ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  <span>Processing...</span>
                                </>
                              ) : (
                                <>
                                  <span>{actionType === 'fund' ? 'Fund Escrow' : 'Verify'}</span>
                                  <ArrowRight className="w-4 h-4" />
                                </>
                              )}
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* Purchase Flow Modal */}
            {selectedRequest && (
              <BuyerPurchaseFlow
                request={selectedRequest}
                onClose={handleClosePurchaseFlow}
                onUpdate={() => {
                  fetchRequests();
                  if (onRequestUpdate) {
                    onRequestUpdate();
                  }
                }}
              />
            )}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
