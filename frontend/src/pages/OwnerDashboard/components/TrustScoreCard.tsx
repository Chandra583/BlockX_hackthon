import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  Star,
  Award
} from 'lucide-react';

interface TrustScoreCardProps {
  trustScore: number;
}

const TrustScoreCard: React.FC<TrustScoreCardProps> = ({ trustScore }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTrustLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: 'text-emerald-400', bg: 'from-emerald-500 to-emerald-600' };
    if (score >= 80) return { level: 'Good', color: 'text-blue-400', bg: 'from-blue-500 to-blue-600' };
    if (score >= 70) return { level: 'Fair', color: 'text-yellow-400', bg: 'from-yellow-500 to-yellow-600' };
    if (score >= 60) return { level: 'Poor', color: 'text-orange-400', bg: 'from-orange-500 to-orange-600' };
    return { level: 'Critical', color: 'text-red-400', bg: 'from-red-500 to-red-600' };
  };

  const getTrustIcon = (score: number) => {
    if (score >= 90) return <Award className="w-6 h-6 text-emerald-400" />;
    if (score >= 80) return <Shield className="w-6 h-6 text-blue-400" />;
    if (score >= 70) return <CheckCircle className="w-6 h-6 text-yellow-400" />;
    if (score >= 60) return <AlertTriangle className="w-6 h-6 text-orange-400" />;
    return <AlertTriangle className="w-6 h-6 text-red-400" />;
  };

  const trustLevel = getTrustLevel(trustScore);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (trustScore / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`p-2 bg-gradient-to-r ${trustLevel.bg} rounded-xl`}
            >
              {getTrustIcon(trustScore)}
            </motion.div>
            <div>
              <h3 className="text-lg font-bold text-white">TrustScore</h3>
              <p className="text-sm text-gray-400">Vehicle verification status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Score Display */}
      <div className="p-6">
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            {/* Circular Progress */}
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background Circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress Circle */}
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                stroke="url(#trustGradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={strokeDasharray}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
              {/* Gradient Definition */}
              <defs>
                <linearGradient id="trustGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Score Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.6, type: "spring" }}
                  className="text-3xl font-bold text-white"
                >
                  {trustScore}
                </motion.div>
                <div className={`text-sm font-semibold ${trustLevel.color}`}>
                  {trustLevel.level}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Factors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-gray-300">Vehicle Verification</span>
            </div>
            <span className="text-sm font-semibold text-emerald-400">100%</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">Fraud Detection</span>
            </div>
            <span className="text-sm font-semibold text-blue-400">Active</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-300">Blockchain Records</span>
            </div>
            <span className="text-sm font-semibold text-purple-400">Secure</span>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-6 space-y-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl text-white font-medium transition-all duration-300"
          >
            <Eye className="w-4 h-4" />
            <span>View Trust History</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all duration-300"
          >
            <Star className="w-4 h-4" />
            <span>Improve Score</span>
          </motion.button>
        </motion.div>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t border-white/10"
            >
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white mb-2">Recent Trust Events</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Vehicle Registration</span>
                    <span className="text-emerald-400">+10 points</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">OBD Device Installation</span>
                    <span className="text-emerald-400">+5 points</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Blockchain Verification</span>
                    <span className="text-emerald-400">+15 points</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default TrustScoreCard;
