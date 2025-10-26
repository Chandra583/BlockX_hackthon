import React from 'react';
import { motion } from 'framer-motion';
import { 
  Car, 
  DollarSign, 
  TrendingUp, 
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalVehicles: number;
    activeListings: number;
    totalEarnings: number;
    verifiedStatus: number;
  };
}

interface StatCard {
  title: string;
  value: number | string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  description: string;
  color: string;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const statCards: StatCard[] = [
    {
      title: 'My Vehicles',
      value: stats.totalVehicles,
      change: '+2 this month',
      changeType: 'positive',
      icon: Car,
      description: 'Total owned vehicles',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Total Earnings',
      value: `₹${stats.totalEarnings.toLocaleString()}`,
      change: '+18.7%',
      changeType: 'positive',
      icon: DollarSign,
      description: 'From vehicle sales',
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      title: 'Active Listings',
      value: stats.activeListings,
      change: '+3 new',
      changeType: 'positive',
      icon: TrendingUp,
      description: 'Currently for sale',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Verified Status',
      value: `${stats.verifiedStatus}%`,
      change: 'All verified',
      changeType: 'neutral',
      icon: CheckCircle,
      description: 'Vehicle verification',
      color: 'from-amber-500 to-amber-600'
    }
  ];

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'positive':
        return <ArrowUp className="w-4 h-4" />;
      case 'negative':
        return <ArrowDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'positive':
        return 'text-emerald-400';
      case 'negative':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.6 }}
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className={`p-3 bg-gradient-to-r ${card.color} rounded-xl shadow-lg`}
              >
                <card.icon className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h3 className="text-sm font-semibold text-gray-300">{card.title}</h3>
                <p className="text-xs text-gray-400">{card.description}</p>
              </div>
            </div>
          </div>

          {/* Value */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
            className="mb-4"
          >
            <div className="text-3xl font-bold text-white mb-1">
              {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
            </div>
          </motion.div>

          {/* Change Indicator */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.5, duration: 0.4 }}
            className={`flex items-center space-x-1 ${getChangeColor(card.changeType)}`}
          >
            {getChangeIcon(card.changeType)}
            <span className="text-sm font-semibold">{card.change}</span>
          </motion.div>

          {/* Animated Background */}
          <motion.div
            animate={{ 
              background: [
                `linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))`,
                `linear-gradient(45deg, rgba(147, 51, 234, 0.1), rgba(59, 130, 246, 0.1))`,
                `linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))`
              ]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-2xl opacity-50 pointer-events-none"
          />
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;
