import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  DollarSign,
  CreditCard,
  Shield,
  Clock,
  Car,
  User,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Zap,
  ArrowRight,
  CheckSquare,
  X,
  Eye,
  Copy,
  Calendar,
  Hash,
  Database,
  Globe,
  Activity,
  Award,
  Wallet,
  FileText,
  Link,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Building,
  Lock,
  Unlock,
  Key,
  Search,
  Download,
  Share2
} from 'lucide-react';
import { PurchaseAPI, type PurchaseRequest } from '../../api/purchase';
import toast from 'react-hot-toast';

interface BuyerPurchaseFlowProps {
  request: PurchaseRequest;
  onClose: () => void;
  onUpdate: () => void;
}

export const BuyerPurchaseFlow: React.FC<BuyerPurchaseFlowProps> = ({
  request,
  onClose,
  onUpdate
}) => {
  const [currentStep, setCurrentStep] = useState<'fund' | 'verify' | 'waiting' | 'complete'>('fund');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fundAmount, setFundAmount] = useState(request.offeredPrice);
  const [verificationResults, setVerificationResults] = useState<any>(null);
  const [showExplorer, setShowExplorer] = useState(false);
  const [stepDetails, setStepDetails] = useState<any>(null);

  useEffect(() => {
    // Determine current step based on request status
    switch (request.status) {
      case 'accepted':
        setCurrentStep('fund');
        break;
      case 'escrow_funded':
        setCurrentStep('verify');
        break;
      case 'verification_passed':
        setCurrentStep('waiting');
        break;
      case 'sold':
        setCurrentStep('complete');
        break;
      default:
        setCurrentStep('fund');
    }
  }, [request.status]);

  const handleMockFund = async () => {
    try {
      setIsProcessing(true);
      
      await PurchaseAPI.mockFundEscrow(
        request._id,
        fundAmount,
        `mock_${Date.now()}`,
        `fund_${request._id}`
      );

      toast.success('Payment processed successfully!');
      setCurrentStep('verify');
      onUpdate();
    } catch (error: any) {
      console.error('Failed to fund escrow:', error?.message || String(error));
      toast.error(error?.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerify = async () => {
    try {
      setIsProcessing(true);
      
      const response = await PurchaseAPI.verifyPurchase(request._id);
      setVerificationResults(response.data);
      
      if (response.data.verificationResults?.telemetryCheck && 
          response.data.verificationResults?.trustScoreCheck &&
          response.data.verificationResults?.blockchainCheck &&
          response.data.verificationResults?.storageCheck) {
        toast.success('Verification passed! Waiting for seller to confirm transfer.');
        setCurrentStep('waiting');
      } else {
        toast.error('Verification failed. Please contact support.');
      }
      
      onUpdate();
    } catch (error: any) {
      console.error('Failed to verify purchase:', error);
      toast.error(error.message || 'Failed to verify purchase');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'fund': return <CreditCard className="w-6 h-6" />;
      case 'verify': return <Shield className="w-6 h-6" />;
      case 'waiting': return <Clock className="w-6 h-6" />;
      case 'complete': return <CheckCircle className="w-6 h-6" />;
      default: return <DollarSign className="w-6 h-6" />;
    }
  };

  const getStepColor = (step: string) => {
    switch (step) {
      case 'fund': return 'text-blue-400 bg-blue-400/20';
      case 'verify': return 'text-purple-400 bg-purple-400/20';
      case 'waiting': return 'text-yellow-400 bg-yellow-400/20';
      case 'complete': return 'text-green-400 bg-green-400/20';
      default: return 'text-slate-400 bg-slate-400/20';
    }
  };

  const getStepDetails = (step: string) => {
    const baseDetails = {
      fund: {
        title: 'Fund Escrow',
        description: 'Secure payment held in escrow until verification',
        icon: <CreditCard className="w-5 h-5" />,
        color: 'blue',
        details: [
          { label: 'Payment Method', value: 'Mock Payment (Demo)' },
          { label: 'Amount', value: `₹${fundAmount?.toLocaleString()}` },
          { label: 'Escrow ID', value: `escrow_${request._id.slice(-8)}` },
          { label: 'Payment Ref', value: `mock_${Date.now()}` },
          { label: 'Status', value: request.status === 'escrow_funded' ? 'Completed' : 'Pending' },
          { label: 'Timestamp', value: new Date(request.createdAt).toLocaleString() }
        ]
      },
      verify: {
        title: 'Verification Process',
        description: 'System validates vehicle data and blockchain records',
        icon: <Shield className="w-5 h-5" />,
        color: 'purple',
        details: [
          { label: 'Telemetry Check', value: request.verificationResults?.telemetryCheck ? '✓ Passed' : '✗ Failed', status: request.verificationResults?.telemetryCheck },
          { label: 'Trust Score', value: `${request.vehicleId?.trustScore}/100`, status: request.vehicleId?.trustScore >= 50 },
          { label: 'Blockchain Check', value: request.verificationResults?.blockchainCheck ? '✓ Passed' : '✗ Failed', status: request.verificationResults?.blockchainCheck },
          { label: 'Storage Check', value: request.verificationResults?.storageCheck ? '✓ Passed' : '✗ Failed', status: request.verificationResults?.storageCheck },
          { label: 'Verified At', value: request.verificationResults?.verifiedAt ? new Date(request.verificationResults.verifiedAt).toLocaleString() : 'Not verified' },
          { label: 'Overall Status', value: request.status === 'verification_passed' ? '✓ Passed' : '✗ Failed', status: request.status === 'verification_passed' }
        ]
      },
      waiting: {
        title: 'Transfer Pending',
        description: 'Waiting for seller to confirm ownership transfer',
        icon: <Clock className="w-5 h-5" />,
        color: 'yellow',
        details: [
          { label: 'Seller', value: request.sellerId?.fullName },
          { label: 'Seller Email', value: request.sellerId?.email },
          { label: 'Transfer Status', value: 'Pending Seller Confirmation' },
          { label: 'Escrow Status', value: 'Funded & Locked' },
          { label: 'Verification', value: 'Completed' },
          { label: 'Next Action', value: 'Seller confirms transfer' }
        ]
      },
      complete: {
        title: 'Purchase Complete',
        description: 'Ownership transferred successfully',
        icon: <CheckCircle className="w-5 h-5" />,
        color: 'green',
        details: [
          { label: 'Final Price', value: `₹${request.offeredPrice?.toLocaleString()}` },
          { label: 'Transaction Hash', value: '0x1234...5678' },
          { label: 'Blockchain', value: 'Solana Devnet' },
          { label: 'Ownership', value: 'Transferred to Buyer' },
          { label: 'Escrow', value: 'Released to Seller' },
          { label: 'Completed At', value: new Date().toLocaleString() }
        ]
      }
    };
    return baseDetails[step] || baseDetails.fund;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <AnimatePresence>
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
                onClick={onClose}
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
                      {request.vehicleId?.make} {request.vehicleId?.vehicleModel} ({request.vehicleId?.year})
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400">VIN:</span>
                        <span className="text-slate-300 font-mono text-xs">{request.vehicleId?.vin}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400">Vehicle No:</span>
                        <span className="text-slate-300 font-semibold">{request.vehicleId?.vehicleNumber}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400">Total Kms:</span>
                        <span className="text-slate-300">{request.vehicleId?.currentMileage?.toLocaleString()} km</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400">Trust Score:</span>
                        <span className={`font-semibold px-2 py-1 rounded-full text-xs ${request.vehicleId?.trustScore >= 70 ? 'text-green-400 bg-green-400/20' : request.vehicleId?.trustScore >= 50 ? 'text-yellow-400 bg-yellow-400/20' : 'text-red-400 bg-red-400/20'}`}>
                          {request.vehicleId?.trustScore}/100
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
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-400">Step {currentStep === 'fund' ? '1' : currentStep === 'verify' ? '2' : currentStep === 'waiting' ? '3' : '4'} of 4</span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowExplorer(true)}
                      className="p-1 rounded bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-slate-300 transition-colors"
                      title="View Explorer"
                    >
                      <Eye className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Step 1: Fund */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 rounded-xl border transition-all duration-200 ${getStepColor('fund')} border-slate-700/50 hover:border-slate-600/50`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      {getStepIcon('fund')}
                      <span className="font-medium">Fund Escrow</span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-1">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span>₹{fundAmount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={request.status === 'escrow_funded' ? 'text-green-400' : 'text-yellow-400'}>
                          {request.status === 'escrow_funded' ? '✓ Done' : '⏳ Pending'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Step 2: Verify */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 rounded-xl border transition-all duration-200 ${getStepColor('verify')} border-slate-700/50 hover:border-slate-600/50`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      {getStepIcon('verify')}
                      <span className="font-medium">Verify</span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-1">
                      <div className="flex justify-between">
                        <span>Trust Score:</span>
                        <span>{request.vehicleId?.trustScore}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={request.status === 'verification_passed' ? 'text-green-400' : 'text-yellow-400'}>
                          {request.status === 'verification_passed' ? '✓ Done' : '⏳ Pending'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Step 3: Waiting */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 rounded-xl border transition-all duration-200 ${getStepColor('waiting')} border-slate-700/50 hover:border-slate-600/50`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      {getStepIcon('waiting')}
                      <span className="font-medium">Transfer</span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-1">
                      <div className="flex justify-between">
                        <span>Seller:</span>
                        <span className="truncate">{request.sellerId?.fullName?.split(' ')[0]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={request.status === 'sold' ? 'text-green-400' : 'text-yellow-400'}>
                          {request.status === 'sold' ? '✓ Done' : '⏳ Pending'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Step 4: Complete */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 rounded-xl border transition-all duration-200 ${getStepColor('complete')} border-slate-700/50 hover:border-slate-600/50`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      {getStepIcon('complete')}
                      <span className="font-medium">Complete</span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-1">
                      <div className="flex justify-between">
                        <span>Ownership:</span>
                        <span className={request.status === 'sold' ? 'text-green-400' : 'text-slate-400'}>
                          {request.status === 'sold' ? '✓ Transferred' : '⏳ Pending'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={request.status === 'sold' ? 'text-green-400' : 'text-slate-400'}>
                          {request.status === 'sold' ? '✓ Done' : '⏳ Pending'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
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
                      <span className="text-2xl font-bold text-green-400">₹{fundAmount?.toLocaleString()}</span>
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
                        <span>Pay ₹{fundAmount?.toLocaleString()} (Mock)</span>
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
                        <p className="text-slate-300 font-medium">Seller: {request.sellerId?.fullName}</p>
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
                        <span className="font-semibold text-green-400">₹{request.offeredPrice?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Transaction Hash:</span>
                        <span className="text-slate-300 font-mono text-xs">0x1234...5678</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowExplorer(true)}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <Eye className="w-5 h-5" />
                      <span>View Explorer</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onClose}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>My Vehicles</span>
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Explorer Modal */}
      <AnimatePresence>
        {showExplorer && (
          <div className="fixed inset-0 z-60 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => setShowExplorer(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3 }}
                className="relative w-full max-w-6xl mx-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700/50"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-600/20 rounded-xl">
                      <Search className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Purchase Flow Explorer</h2>
                      <p className="text-sm text-slate-300">Complete transaction details and timeline</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowExplorer(false)}
                      className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Transaction Overview */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Transaction Overview</h3>
                      
                      {/* Vehicle Details */}
                      <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-blue-600/20 rounded-lg">
                            <Car className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-2">Vehicle Information</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Vehicle:</span>
                                <span className="text-slate-300">{request.vehicleId?.make} {request.vehicleId?.vehicleModel} ({request.vehicleId?.year})</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">VIN:</span>
                                <span className="text-slate-300 font-mono text-xs">{request.vehicleId?.vin}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Vehicle No:</span>
                                <span className="text-slate-300 font-semibold">{request.vehicleId?.vehicleNumber}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Mileage:</span>
                                <span className="text-slate-300">{request.vehicleId?.currentMileage?.toLocaleString()} km</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Trust Score:</span>
                                <span className={`font-semibold px-2 py-1 rounded-full text-xs ${request.vehicleId?.trustScore >= 70 ? 'text-green-400 bg-green-400/20' : request.vehicleId?.trustScore >= 50 ? 'text-yellow-400 bg-yellow-400/20' : 'text-red-400 bg-red-400/20'}`}>
                                  {request.vehicleId?.trustScore}/100
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Participants */}
                      <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-green-600/20 rounded-lg">
                            <User className="w-5 h-5 text-green-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-2">Participants</h4>
                            <div className="space-y-3">
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-slate-400 text-sm">Buyer:</span>
                                  <span className="text-slate-300 font-medium">{request.buyerId?.fullName}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  <span className="text-slate-300 text-xs">{request.buyerId?.email}</span>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-slate-400 text-sm">Seller:</span>
                                  <span className="text-slate-300 font-medium">{request.sellerId?.fullName}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  <span className="text-slate-300 text-xs">{request.sellerId?.email}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Financial Details */}
                      <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-emerald-600/20 rounded-lg">
                            <DollarSign className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-2">Financial Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Final Price:</span>
                                <span className="text-green-400 font-bold text-lg">₹{request.offeredPrice?.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Payment Method:</span>
                                <span className="text-slate-300">Mock Payment (Demo)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Escrow Status:</span>
                                <span className="text-slate-300">{request.status === 'escrow_funded' ? 'Funded' : 'Pending'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Request Date:</span>
                                <span className="text-slate-300">{new Date(request.createdAt).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Flow Timeline */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Flow Timeline</h3>
                      
                      {/* Step 1: Fund Escrow */}
                      <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-blue-600/20 rounded-lg">
                            <CreditCard className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-2">Step 1: Fund Escrow</h4>
                            <p className="text-slate-300 text-sm mb-3">Secure payment held in escrow until verification</p>
                            <div className="space-y-2 text-sm">
                              {getStepDetails('fund').details.map((detail, index) => (
                                <div key={index} className="flex justify-between">
                                  <span className="text-slate-400">{detail.label}:</span>
                                  <span className="text-slate-300">{detail.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 2: Verification */}
                      <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-purple-600/20 rounded-lg">
                            <Shield className="w-5 h-5 text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-2">Step 2: Verification Process</h4>
                            <p className="text-slate-300 text-sm mb-3">System validates vehicle data and blockchain records</p>
                            <div className="space-y-2 text-sm">
                              {getStepDetails('verify').details.map((detail, index) => (
                                <div key={index} className="flex justify-between">
                                  <span className="text-slate-400">{detail.label}:</span>
                                  <span className={`${detail.status === true ? 'text-green-400' : detail.status === false ? 'text-red-400' : 'text-slate-300'}`}>
                                    {detail.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 3: Transfer */}
                      <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-yellow-600/20 rounded-lg">
                            <Clock className="w-5 h-5 text-yellow-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-2">Step 3: Transfer Pending</h4>
                            <p className="text-slate-300 text-sm mb-3">Waiting for seller to confirm ownership transfer</p>
                            <div className="space-y-2 text-sm">
                              {getStepDetails('waiting').details.map((detail, index) => (
                                <div key={index} className="flex justify-between">
                                  <span className="text-slate-400">{detail.label}:</span>
                                  <span className="text-slate-300">{detail.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 4: Complete */}
                      <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-green-600/20 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-2">Step 4: Purchase Complete</h4>
                            <p className="text-slate-300 text-sm mb-3">Ownership transferred successfully</p>
                            <div className="space-y-2 text-sm">
                              {getStepDetails('complete').details.map((detail, index) => (
                                <div key={index} className="flex justify-between">
                                  <span className="text-slate-400">{detail.label}:</span>
                                  <span className="text-slate-300">{detail.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Blockchain Details */}
                  <div className="mt-6 bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-purple-600/20 rounded-lg">
                        <Database className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-2">Blockchain Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Network:</span>
                              <span className="text-slate-300">Solana Devnet</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Transaction Hash:</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-slate-300 font-mono text-xs">0x1234...5678</span>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => copyToClipboard('0x1234567890abcdef')}
                                  className="p-1 rounded bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-slate-300 transition-colors"
                                >
                                  <Copy className="w-3 h-3" />
                                </motion.button>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Block Height:</span>
                              <span className="text-slate-300">2,847,392</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Gas Used:</span>
                              <span className="text-slate-300">5,000</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-700/50">
                          <div className="flex items-center space-x-2">
                            <ExternalLink className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-400 text-sm">View on Solana Explorer:</span>
                            <a href="#" className="text-blue-400 hover:text-blue-300 text-sm">solscan.io/tx/0x1234...5678</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};
