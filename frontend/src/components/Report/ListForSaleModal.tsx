import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  X,
  CheckCircle,
  AlertTriangle,
  Car,
  Shield,
  FileText
} from 'lucide-react';
import { ReportService } from '../../services/report';
import type { ListingRequest } from '../../services/report';
import toast from 'react-hot-toast';

interface ListForSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleInfo?: {
    make: string;
    model: string;
    year: number;
    vin: string;
    vehicleNumber: string;
  };
}

export const ListForSaleModal: React.FC<ListForSaleModalProps> = ({
  isOpen,
  onClose,
  vehicleId,
  vehicleInfo
}) => {
  const [formData, setFormData] = useState({
    price: '',
    negotiable: true,
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      setLoading(true);
      
      const listingData: ListingRequest = {
        price,
        negotiable: formData.negotiable,
        description: formData.description || undefined
      };

      await ReportService.listVehicleForSale(vehicleId, listingData);
      
      toast.success('Vehicle listed for sale successfully!');
      onClose();
      
      // Reset form
      setFormData({ price: '', negotiable: true, description: '' });
      setAgreedToTerms(false);
      
    } catch (error: any) {
      console.error('Failed to list vehicle:', error);
      toast.error(error.message || 'Failed to list vehicle for sale');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
              className="relative w-full max-w-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700/50"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">List Vehicle for Sale</h2>
                    {vehicleInfo && (
                      <p className="text-slate-300 text-sm">
                        {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
                      </p>
                    )}
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
                {/* Vehicle Info Card */}
                {vehicleInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-500/20"
                  >
                    <div className="flex items-center space-x-3">
                      <Car className="w-8 h-8 text-blue-400" />
                      <div>
                        <h3 className="font-semibold text-white">
                          {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
                        </h3>
                        <p className="text-sm text-slate-300">
                          VIN: {vehicleInfo.vin} • {vehicleInfo.vehicleNumber}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Price Input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Asking Price (₹)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="Enter asking price"
                        className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                        required
                        min="1"
                        step="1000"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Enter the price you want to sell your vehicle for
                    </p>
                  </div>

                  {/* Negotiable Toggle */}
                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.negotiable}
                        onChange={(e) => handleInputChange('negotiable', e.target.checked)}
                        className="w-5 h-5 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <div>
                        <span className="text-sm font-medium text-slate-300">
                          Price is negotiable
                        </span>
                        <p className="text-xs text-slate-400">
                          Allow buyers to make offers below your asking price
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Additional Description (Optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Add any additional details about your vehicle..."
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Terms and Conditions */}
                  <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white mb-2">
                          Important Information
                        </h4>
                        <ul className="text-xs text-slate-300 space-y-1">
                          <li>• By listing your vehicle, you agree to share the complete vehicle report with potential buyers</li>
                          <li>• The report includes blockchain verification, OBD telemetry history, and TrustScore</li>
                          <li>• Buyers will be able to view all fraud alerts and rollback events</li>
                          <li>• You can remove your listing at any time</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Agreement Checkbox */}
                  <div>
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="w-5 h-5 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2 mt-0.5"
                        required
                      />
                      <div>
                        <span className="text-sm font-medium text-slate-300">
                          I agree to share the complete vehicle report with potential buyers
                        </span>
                        <p className="text-xs text-slate-400 mt-1">
                          This includes blockchain verification, OBD data, fraud analysis, and TrustScore details
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-3 pt-4">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onClose}
                      disabled={loading}
                      className="px-6 py-3 rounded-xl font-semibold transition-colors bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 disabled:opacity-50"
                    >
                      Cancel
                    </motion.button>
                    
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={loading || !agreedToTerms}
                      className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Listing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4" />
                          <span>List for Sale</span>
                        </div>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
