import React from 'react';
import { motion } from 'framer-motion';
import Button from './button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`text-center py-12 px-4 ${className}`}
    >
      {icon && (
        <div className="mx-auto w-16 h-16 text-gray-400 mb-4 flex items-center justify-center">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      
      {action && (
        <Button
          onClick={action.onClick}
          icon={action.icon}
          variant="primary"
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
};

export default EmptyState;
