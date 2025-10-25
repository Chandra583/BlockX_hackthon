import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, TrendingUp, TrendingDown, Info, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { TrustHistoryModal } from './TrustHistoryModal';

interface TrustScoreCardProps {
  score: number;
  vehicleId: string;
  onScoreChange?: (newScore: number) => void;
}

export const TrustScoreCard: React.FC<TrustScoreCardProps> = ({
  score,
  vehicleId,
  onScoreChange
}) => {
  const [showHistory, setShowHistory] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 70) return 'text-amber-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-gradient-to-br from-emerald-50 via-white to-emerald-50 border-emerald-200/60';
    if (score >= 70) return 'bg-gradient-to-br from-amber-50 via-white to-amber-50 border-amber-200/60';
    if (score >= 50) return 'bg-gradient-to-br from-orange-50 via-white to-orange-50 border-orange-200/60';
    return 'bg-gradient-to-br from-red-50 via-white to-red-50 border-red-200/60';
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 90) return 'stroke-emerald-500';
    if (score >= 70) return 'stroke-amber-500';
    if (score >= 50) return 'stroke-orange-500';
    return 'stroke-red-500';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-5 h-5 text-emerald-600" />;
    if (score >= 70) return <Shield className="w-5 h-5 text-amber-600" />;
    if (score >= 50) return <AlertTriangle className="w-5 h-5 text-orange-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`relative rounded-3xl border-2 p-8 ${getScoreBgColor(score)} backdrop-blur-xl shadow-2xl overflow-hidden`}
      >
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-3xl" />
        
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            background: [
              "linear-gradient(45deg, #667eea 0%, #764ba2 100%)",
              "linear-gradient(45deg, #f093fb 0%, #f5576c 100%)",
              "linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)",
              "linear-gradient(45deg, #667eea 0%, #764ba2 100%)"
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative z-10">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center space-x-4">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="p-3 bg-white/90 rounded-2xl shadow-lg backdrop-blur-sm"
              >
                <Shield className="w-7 h-7 text-blue-600" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">TrustScore</h3>
                <p className="text-sm text-gray-600 font-medium">Vehicle integrity score</p>
              </div>
            </div>
            {getScoreIcon(score)}
          </motion.div>

          {/* Circular Score Display */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="flex items-center justify-center mb-8"
          >
            <div className="relative">
              {/* Outer ring */}
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className={getScoreRingColor(score)}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: score / 100 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </svg>
              
              {/* Score display */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.8, type: "spring", stiffness: 300 }}
                  className="text-center"
                >
                  <div className={`text-5xl font-black ${getScoreColor(score)} mb-1`}>
                    {score}
                  </div>
                  <div className={`text-sm font-bold ${getScoreColor(score)} uppercase tracking-wide`}>
                    {getScoreLabel(score)}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 gap-4 mb-8"
          >
            <div className="flex justify-between items-center p-4 bg-white/60 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-gray-700">Fraud Alerts</span>
              </div>
              <span className="text-lg font-bold text-gray-900">0</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-white/60 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium text-gray-700">Verification</span>
              </div>
              <span className="text-lg font-bold text-emerald-600">Verified</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-white/60 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Last Updated</span>
              </div>
              <span className="text-lg font-bold text-gray-900">Today</span>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.button
            whileHover={{ 
              scale: 1.02,
              boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowHistory(true)}
            className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
            <span className="relative z-10 flex items-center justify-center space-x-2">
              <span>Why did TrustScore change?</span>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.div>
            </span>
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showHistory && (
          <TrustHistoryModal
            vehicleId={vehicleId}
            isOpen={showHistory}
            onClose={() => setShowHistory(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};