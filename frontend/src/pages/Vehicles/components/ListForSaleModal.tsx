import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ListForSaleModalProps {
  vehicle: {
    id: string;
    vin: string;
    make: string;
    model: string;
    year: number;
    currentMileage: number;
  };
  onClose: () => void;
  onList: (data: any) => void;
}

export const ListForSaleModal: React.FC<ListForSaleModalProps> = ({ vehicle, onClose, onList }) => {
  const [formData, setFormData] = useState({
    price: '',
    negotiable: true,
    description: '',
    agreeToShare: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (!formData.agreeToShare) {
      toast.error('Please agree to share the full report with buyers');
      return;
    }

    setLoading(true);
    try {
      await onList({
        price: parseFloat(formData.price),
        negotiable: formData.negotiable,
        description: formData.description
      });
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-slate-800 rounded-2xl p-8 w-full max-w-2xl border border-slate-700/50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="p-3 bg-green-600/20 rounded-xl mr-4">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">List Vehicle for Sale</h2>
                <p className="text-gray-400">Create a marketplace listing for your vehicle</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Vehicle Info */}
          <div className="p-6 bg-slate-700/30 rounded-xl mb-8">
            <h3 className="text-lg font-semibold text-white mb-2">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">VIN:</span>
                <p className="text-white font-mono">{vehicle.vin}</p>
              </div>
              <div>
                <span className="text-gray-400">Mileage:</span>
                <p className="text-white">{vehicle.currentMileage.toLocaleString()} km</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Asking Price (₹)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="Enter asking price"
                className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your vehicle, its condition, features, etc."
                rows={4}
                className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Negotiable Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="negotiable"
                checked={formData.negotiable}
                onChange={(e) => setFormData(prev => ({ ...prev, negotiable: e.target.checked }))}
                className="w-5 h-5 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500 focus:ring-2"
              />
              <label htmlFor="negotiable" className="ml-3 text-gray-300">
                Price is negotiable
              </label>
            </div>

            {/* Agreement */}
            <div className="p-4 bg-blue-600/10 rounded-xl border border-blue-600/20">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="agreeToShare"
                  checked={formData.agreeToShare}
                  onChange={(e) => setFormData(prev => ({ ...prev, agreeToShare: e.target.checked }))}
                  className="w-5 h-5 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500 focus:ring-2 mt-0.5"
                  required
                />
                <label htmlFor="agreeToShare" className="ml-3 text-sm text-gray-300">
                  I agree to share the full vehicle report (including TrustScore, OBD data, and fraud alerts) with potential buyers to ensure transparency and build trust in the marketplace.
                </label>
              </div>
            </div>

            {/* Important Notice */}
            <div className="p-4 bg-yellow-600/10 rounded-xl border border-yellow-600/20">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" />
                <div className="text-sm text-yellow-300">
                  <p className="font-semibold mb-1">Important Notice:</p>
                  <p>By listing your vehicle, you agree to share comprehensive vehicle data including TrustScore, telemetry history, and any fraud alerts. This transparency helps build buyer confidence and ensures fair transactions.</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 px-6 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.price || !formData.agreeToShare}
                className="flex-1 py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <CheckCircle className="w-5 h-5 mr-2" />
                )}
                {loading ? 'Listing...' : 'List for Sale'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
