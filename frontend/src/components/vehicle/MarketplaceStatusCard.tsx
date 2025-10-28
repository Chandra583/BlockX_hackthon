import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ExternalLink, CheckCircle, Minus, Calendar } from 'lucide-react';
import { formatPrice } from '../../utils/formatCurrency';

interface MarketplaceStatusCardProps {
  vehicle: {
    id: string;
    isForSale?: boolean;
    listingStatus?: string;
    price?: number;
    description?: string;
    updatedAt?: string;
  };
  onListForSale?: () => void;
}

export const MarketplaceStatusCard: React.FC<MarketplaceStatusCardProps> = ({
  vehicle,
  onListForSale
}) => {
  const isListed = vehicle.isForSale && vehicle.listingStatus === 'active';
  const canList = !isListed && onListForSale;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-green-600/20 rounded-xl">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Marketplace Status</h3>
            <p className="text-slate-400 text-sm">Vehicle listing information</p>
          </div>
        </div>
      </div>

      {/* Status Content */}
      <div className="space-y-4">
        {/* Listing Status */}
        <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
          <div className="flex items-center space-x-3">
            {isListed ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <Minus className="w-5 h-5 text-slate-400" />
            )}
            <span className="text-slate-300 font-medium">Listing Status</span>
          </div>
          <div className="flex items-center space-x-2">
            {isListed ? (
              <>
                <span className="text-green-400 font-semibold">Listed</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </>
            ) : (
              <span className="text-slate-400">Not Listed</span>
            )}
          </div>
        </div>

        {/* Price Display */}
        {isListed && vehicle.price && (
          <div className="p-4 bg-slate-700/30 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 font-medium">Asking Price</span>
              <span className="text-2xl font-bold text-green-400">
                {formatPrice(vehicle.price)}
              </span>
            </div>
            {vehicle.description && (
              <p className="text-slate-400 text-sm mt-2 line-clamp-2">
                {vehicle.description}
              </p>
            )}
          </div>
        )}

        {/* Listed Date */}
        {isListed && vehicle.updatedAt && (
          <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-blue-400" />
              <span className="text-slate-300 font-medium">Listed Date</span>
            </div>
            <span className="text-white text-sm">
              {new Date(vehicle.updatedAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        )}

        {/* Marketplace Link */}
        {isListed && (
          <div className="p-4 bg-slate-700/30 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Marketplace Link</span>
              <motion.a
                href={`/marketplace/vehicle/${vehicle.id}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span className="text-sm font-medium">View Listing</span>
                <ExternalLink className="w-4 h-4" />
              </motion.a>
            </div>
          </div>
        )}

        {/* List for Sale Button */}
        {canList && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onListForSale}
            className="w-full p-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-green-500/25"
          >
            <div className="flex items-center justify-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>List Vehicle for Sale</span>
            </div>
          </motion.button>
        )}

        {/* Already Listed Message */}
        {isListed && (
          <div className="space-y-3">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-300 text-sm">
                  Your vehicle is currently listed on the marketplace
                </span>
              </div>
            </div>
            
            {/* View Listing Button */}
            <motion.a
              href={`/marketplace/vehicle/${vehicle.id}`}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full p-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-blue-500/25 flex items-center justify-center space-x-2"
            >
              <ExternalLink className="w-5 h-5" />
              <span>View Marketplace Listing</span>
            </motion.a>
          </div>
        )}
      </div>
    </motion.div>
  );
};
