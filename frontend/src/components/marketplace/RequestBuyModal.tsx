import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  MessageSquare,
  User,
  Send,
  X,
  CheckCircle,
  AlertCircle,
  Car,
  Shield,
  Calendar,
  Gauge
} from 'lucide-react';
import { MarketplaceAPI } from '../../api/marketplace';
import { formatPrice } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';

interface RequestBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing?: {
    id: string;
    vehicle: {
      id: string;
      make: string;
      model: string;
      year: number;
      vin: string;
      currentMileage: number;
      trustScore: number;
      owner?: {
        firstName?: string;
        lastName?: string;
      };
    };
    price: number;
    negotiable: boolean;
    description?: string;
    listedAt: string;
  } | null;
  onSuccess?: () => void;
}

export const RequestBuyModal: React.FC<RequestBuyModalProps> = ({
  isOpen,
  onClose,
  listing,
  onSuccess
}) => {
  const [price, setPrice] = useState<number>(listing?.price ?? 0);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!price || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!listing?.id) {
      toast.error('Listing not available');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await MarketplaceAPI.requestToBuy({
        listingId: listing.vehicle.id,
        price: price,
        message: message.trim()
      });

      setStep('success');
      toast.success('Buy request submitted successfully!');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Failed to submit buy request:', error);
      toast.error(error.message || 'Failed to submit buy request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setMessage('');
    setPrice(listing?.price ?? 0);
    onClose();
  };

  const defaultMessages = [
    "I'm interested in purchasing this vehicle. Could we schedule a viewing?",
    "This vehicle looks perfect for my needs. Is it still available?",
    "I'd like to make an offer for this vehicle. When can we discuss?",
    "Could you provide more details about the vehicle's condition and history?"
  ];

  const setDefaultMessage = (msg: string) => {
    setMessage(msg);
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
              onClick={handleClose}
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
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Request to Buy</h2>
                    <p className="text-sm text-slate-300">Send a message to the seller</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClose}
                  className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="p-6">
                {step === 'form' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Vehicle Summary */}
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-slate-700/50 rounded-xl flex items-center justify-center">
                          <Car className="w-8 h-8 text-slate-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {listing?.vehicle?.year ?? 'N/A'} {listing?.vehicle?.make ?? ''} {listing?.vehicle?.model ?? ''}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-slate-300 mb-2">
                            <span className="flex items-center space-x-1">
                              <Gauge className="w-4 h-4" />
                              <span>{listing?.vehicle?.currentMileage != null ? `${listing.vehicle.currentMileage.toLocaleString()} km` : 'N/A'}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Shield className="w-4 h-4" />
                              <span>TrustScore: {listing?.vehicle?.trustScore ?? 'N/A'}/100</span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold text-green-400">
                              {formatPrice(listing?.price)}
                            </div>
                            {listing?.negotiable && (
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs">
                                Negotiable
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seller Info */}
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-600/20 rounded-xl">
                          <User className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-white">Seller</h4>
                          <p className="text-sm text-slate-300">
                            {(listing?.vehicle?.owner?.firstName || 'Seller')} {(listing?.vehicle?.owner?.lastName || '')}
                          </p>
                        </div>
                        <div className="ml-auto text-right">
                          <p className="text-xs text-slate-400">Listed</p>
                          <p className="text-sm text-slate-300">
                            {listing?.listedAt ? new Date(listing.listedAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Message Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Price Input */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Offer Price
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-slate-400" />
                          </div>
                          <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            placeholder="Enter your offer price"
                            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-colors"
                            min="0"
                            step="100"
                            required
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Listed price: {formatPrice(listing?.price)}
                          {listing?.negotiable && ' (Negotiable)'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Your Message
                        </label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Tell the seller why you're interested in this vehicle..."
                          className="w-full p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-colors resize-none"
                          rows={4}
                          required
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          Be specific about your interest and any questions you have
                        </p>
                      </div>

                      {/* Quick Message Templates */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Quick Messages
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                          {defaultMessages.map((msg, index) => (
                            <motion.button
                              key={index}
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setDefaultMessage(msg)}
                              className="p-3 text-left bg-slate-700/30 hover:bg-slate-600/30 border border-slate-600/30 hover:border-slate-500/30 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
                            >
                              {msg}
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="flex space-x-3 pt-4">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleClose}
                          className="flex-1 px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-xl font-medium transition-colors"
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={isSubmitting || !message.trim() || !price || price <= 0}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Send Request</span>
                            </>
                          )}
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <CheckCircle className="w-10 h-10 text-green-400" />
                    </motion.div>
                    
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Request Sent Successfully!
                    </h3>
                    <p className="text-slate-300 mb-6">
                      Your buy request has been sent to {(listing?.vehicle?.owner?.firstName || 'the seller')} {(listing?.vehicle?.owner?.lastName || '')}.
                      They will review your message and get back to you soon.
                    </p>
                    
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 mb-6">
                      <h4 className="text-sm font-medium text-slate-300 mb-2">What happens next?</h4>
                      <div className="space-y-2 text-sm text-slate-400">
                        <p>• The seller will review your message</p>
                        <p>• They may contact you for more details</p>
                        <p>• You can schedule a viewing if interested</p>
                        <p>• Negotiate the final price and terms</p>
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleClose}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                    >
                      Close
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RequestBuyModal;
