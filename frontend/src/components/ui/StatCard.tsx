import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Card from './card';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive?: boolean;
    label?: string;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  loading?: boolean;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  loading = false,
  className = ''
}) => {
  const colorConfig = {
    blue: {
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      trendPositive: 'text-blue-600',
      trendNegative: 'text-blue-600'
    },
    green: {
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      trendPositive: 'text-green-600',
      trendNegative: 'text-green-600'
    },
    yellow: {
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      trendPositive: 'text-yellow-600',
      trendNegative: 'text-yellow-600'
    },
    red: {
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      trendPositive: 'text-red-600',
      trendNegative: 'text-red-600'
    },
    purple: {
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      trendPositive: 'text-purple-600',
      trendNegative: 'text-purple-600'
    },
    gray: {
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      trendPositive: 'text-gray-600',
      trendNegative: 'text-gray-600'
    }
  };

  const config = colorConfig[color];

  if (loading) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </Card>
    );
  }

  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend.value > 0) {
      return <TrendingUp className="w-3 h-3" />;
    } else if (trend.value < 0) {
      return <TrendingDown className="w-3 h-3" />;
    } else {
      return <Minus className="w-3 h-3" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    
    if (trend.isPositive === undefined) {
      return trend.value > 0 ? 'text-green-600' : trend.value < 0 ? 'text-red-600' : 'text-gray-600';
    }
    
    return trend.isPositive ? 'text-green-600' : 'text-red-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card hover className={className}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            
            <div className="flex items-center space-x-2">
              {subtitle && (
                <p className="text-xs text-gray-500">{subtitle}</p>
              )}
              
              {trend && (
                <div className={`flex items-center space-x-1 text-xs font-medium ${getTrendColor()}`}>
                  {getTrendIcon()}
                  <span>
                    {Math.abs(trend.value)}%
                    {trend.label && ` ${trend.label}`}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {icon && (
            <div className={`p-3 rounded-lg ${config.iconBg}`}>
              <div className={`w-6 h-6 ${config.iconColor}`}>
                {icon}
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default StatCard;
