import React from 'react';
import { motion } from 'framer-motion';
import { Shield, TrendingUp, TrendingDown, Minus, Clock, AlertCircle } from 'lucide-react';
import type { TrustScore } from '../../../services/report';

interface ReportTrustSummaryProps {
  trustScore: TrustScore;
}

export const ReportTrustSummary: React.FC<ReportTrustSummaryProps> = ({ trustScore }) => {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-600/20 border-green-600/30';
    if (score >= 60) return 'bg-yellow-600/20 border-yellow-600/30';
    return 'bg-red-600/20 border-red-600/30';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 60) return 'Poor';
    return 'Critical';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50"
    >
      <div className="flex items-center mb-6">
        <div className="p-3 bg-blue-600/20 rounded-xl mr-4">
          <Shield className="w-6 h-6 text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-white">TrustScore Snapshot</h3>
      </div>

      {/* Current Score */}
      <div className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-4 ${getScoreBgColor(trustScore.score)} mb-4`}>
          <span className={`text-3xl font-bold ${getScoreColor(trustScore.score)}`}>
            {trustScore.score}
          </span>
        </div>
        <h4 className={`text-xl font-semibold ${getScoreColor(trustScore.score)} mb-2`}>
          {getScoreLabel(trustScore.score)}
        </h4>
        <div className="flex items-center justify-center gap-2 text-gray-400">
          {getTrendIcon(trustScore.trend)}
          <span className="text-sm capitalize">{trustScore.trend}</span>
        </div>
      </div>

      {/* Last Updated */}
      <div className="p-4 bg-slate-700/30 rounded-xl mb-6">
        <div className="flex items-center mb-2">
          <Clock className="w-4 h-4 text-blue-400 mr-2" />
          <span className="text-gray-300 text-sm">Last Updated</span>
        </div>
        <p className="text-white font-semibold">
          {new Date(trustScore.lastUpdated).toLocaleDateString()}
        </p>
        <p className="text-gray-400 text-sm">
          {new Date(trustScore.lastUpdated).toLocaleTimeString()}
        </p>
      </div>

      {/* Recent Trust Events */}
      <div>
        <h5 className="text-lg font-semibold text-white mb-4">Recent Trust Events</h5>
        {trustScore.topCauses.length === 0 ? (
          <div className="text-center py-6">
            <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No recent trust events</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trustScore.topCauses.map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="p-3 bg-slate-700/30 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">{event.reason}</span>
                  <span className={`text-sm font-semibold ${
                    event.change > 0 ? 'text-green-400' : 
                    event.change < 0 ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {event.change > 0 ? '+' : ''}{event.change}
                  </span>
                </div>
                <p className="text-gray-400 text-xs">
                  {new Date(event.timestamp).toLocaleDateString()}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Trust Score Insights */}
      <div className="mt-6 p-4 bg-blue-600/10 rounded-xl border border-blue-600/20">
        <h6 className="text-blue-400 font-semibold mb-2">Trust Score Insights</h6>
        <div className="text-sm text-gray-300 space-y-1">
          {trustScore.score >= 80 && (
            <p>• Vehicle maintains excellent trustworthiness</p>
          )}
          {trustScore.score >= 60 && trustScore.score < 80 && (
            <p>• Vehicle shows good reliability with minor concerns</p>
          )}
          {trustScore.score < 60 && (
            <p>• Vehicle requires attention due to trust issues</p>
          )}
          {trustScore.trend === 'decreasing' && (
            <p>• Trust score has been declining recently</p>
          )}
          {trustScore.trend === 'increasing' && (
            <p>• Trust score is improving over time</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
