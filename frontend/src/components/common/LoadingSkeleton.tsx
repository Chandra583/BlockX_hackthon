import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular'
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700 animate-pulse';
  
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'h-4 rounded',
    circular: 'rounded-full'
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    />
  );
};

export const MetricCardSkeleton: React.FC<{ className?: string }> = ({
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="w-24 h-4 mb-2" />
          <Skeleton className="w-16 h-8 mb-2" />
          <Skeleton className="w-32 h-3" />
        </div>
        <Skeleton className="w-12 h-12 rounded-lg" variant="circular" />
      </div>
    </motion.div>
  );
};



export const WalletCardSkeleton: React.FC<{ className?: string }> = ({
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div>
            <Skeleton className="w-24 h-5 mb-1" />
            <Skeleton className="w-20 h-4" />
          </div>
        </div>
        <Skeleton className="w-24 h-8 rounded-lg" />
      </div>

      <div className="mb-6">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="w-16 h-4 mb-2" />
              <Skeleton className="w-24 h-6" />
            </div>
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <Skeleton className="flex-1 h-10 rounded-lg" />
        <Skeleton className="flex-1 h-10 rounded-lg" />
      </div>
    </motion.div>
  );
};

export default Skeleton;


