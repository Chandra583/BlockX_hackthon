import React from 'react';
import { motion } from 'framer-motion';
import { MetricCard } from './MetricCard';

interface Metric {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface MetricsGridProps {
  metrics: Metric[];
  className?: string;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  metrics,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}
    >
      {metrics.map((metric, index) => (
        <MetricCard
          key={metric.title}
          {...metric}
          delay={index * 0.1}
        />
      ))}
    </motion.div>
  );
};

export default MetricsGrid;
