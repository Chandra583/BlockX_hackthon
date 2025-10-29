import React from 'react';
import { motion } from 'framer-motion';
import { 
  Car, 
  DollarSign, 
  Eye, 
  Shield, 
  Gauge, 
  Calendar, 
  CheckCircle,
  Image as ImageIcon,
  Star,
  TrendingUp
} from 'lucide-react';
import { formatPrice } from '../../utils/formatCurrency';
import type { MarketplaceListing } from '../../api/marketplace';

interface MarketplaceCardProps {
  listing: MarketplaceListing;
  onViewDetails: (listing: MarketplaceListing) => void;
  onViewReport: (vehicleId: string) => void;
  onRequestToBuy?: (listing: MarketplaceListing) => void;
  showBuyButton?: boolean;
  index?: number;
}

export const MarketplaceCard: React.FC<MarketplaceCardProps> = ({
  listing,
  onViewDetails,
  onViewReport,
  onRequestToBuy,
  showBuyButton = true,
  index = 0
}) => {
  const getConditionColor = (condition: string) => {
    const colors = {
      excellent: 'bg-green-100 text-green-800 border-green-200',
      good: 'bg-blue-100 text-blue-800 border-blue-200',
      fair: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      poor: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[condition as keyof typeof colors] || colors.good;
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getTrustScoreBadge = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group"
    >
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
        {/* Vehicle Image Placeholder */}
        <div className="relative h-48 bg-gradient-to-br from-slate-700/30 to-slate-800/30 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
          <ImageIcon className="w-16 h-16 text-slate-400 group-hover:text-slate-300 transition-colors" />
          
          {/* Trust Score Badge */}
          <div className="absolute top-3 right-3">
            <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getConditionColor(listing.vehicle.condition)}`}>
              {listing.vehicle.condition.charAt(0).toUpperCase() + listing.vehicle.condition.slice(1)}
            </div>
          </div>

          {/* Blockchain Verified Badge */}
          <div className="absolute top-3 left-3">
            <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium border border-green-500/30">
              <CheckCircle className="w-3 h-3" />
              <span>Verified</span>
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">
                {listing.vehicle.year} {listing.vehicle.make} {listing.vehicle.model}
              </h3>
              <p className="text-slate-400 text-sm">{listing.vehicle.color}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-400">
                {formatPrice(listing.price)}
              </p>
              {listing.negotiable && (
                <div className="text-xs text-slate-400 mt-1">Negotiable</div>
              )}
            </div>
          </div>

          {/* Vehicle Stats */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-300">
                <Gauge className="w-4 h-4" />
                <span className="text-sm">{listing.vehicle.currentMileage.toLocaleString()} km</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className={`w-4 h-4 ${getTrustScoreColor(listing.vehicle.trustScore)}`} />
                <span className={`text-sm font-semibold ${getTrustScoreColor(listing.vehicle.trustScore)}`}>
                  {listing.vehicle.trustScore}/100
                </span>
                <span className="text-xs text-slate-400">({getTrustScoreBadge(listing.vehicle.trustScore)})</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-400">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Listed {new Date(listing.listedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>{listing.views} views</span>
              </div>
            </div>
          </div>

          {/* Features Preview */}
          {listing.vehicle.features.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {listing.vehicle.features.slice(0, 3).map((feature, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded-md text-xs"
                  >
                    {feature}
                  </span>
                ))}
                {listing.vehicle.features.length > 3 && (
                  <span className="px-2 py-1 bg-slate-700/50 text-slate-400 rounded-md text-xs">
                    +{listing.vehicle.features.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onViewReport(listing.vehicle.id)}
              className="flex-1 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-1 text-sm"
            >
              <Shield className="w-4 h-4" />
              <span>Report</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onViewDetails(listing)}
              className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-1 text-sm shadow-lg hover:shadow-blue-500/25"
            >
              <Eye className="w-4 h-4" />
              <span>Details</span>
            </motion.button>

            {onRequestToBuy && showBuyButton && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onRequestToBuy(listing)}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-1 text-sm shadow-lg hover:shadow-green-500/25"
              >
                <DollarSign className="w-4 h-4" />
                <span>Buy</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketplaceCard;
