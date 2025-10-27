import React from 'react';
import { motion } from 'framer-motion';
import { Shield, TrendingUp, AlertTriangle } from 'lucide-react';

interface TrustScoreMiniProps {
  trustScore: number;
  className?: string;
}

const TrustScoreMini: React.FC<TrustScoreMiniProps> = ({ trustScore, className = '' }) => {
  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    if (score >= 40) return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getTrustScoreIcon = (score: number) => {
    if (score >= 80) return <Shield className="w-4 h-4" />;
    if (score >= 60) return <TrendingUp className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const getTrustScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={`inline-flex items-center px-4 py-2 rounded-full border ${getTrustScoreColor(trustScore)} ${className}`}
    >
      {getTrustScoreIcon(trustScore)}
      <span className="ml-2 font-semibold text-sm">
        TrustScore: {trustScore}
      </span>
      <span className="ml-1 text-xs opacity-75">
        ({getTrustScoreLabel(trustScore)})
      </span>
    </motion.div>
  );
};

export default TrustScoreMini;
