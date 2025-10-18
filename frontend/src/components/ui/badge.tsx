import React from 'react';
import { motion } from 'framer-motion';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  pulse?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({
    className = '',
    variant = 'default',
    size = 'md',
    icon,
    pulse = false,
    children,
    ...props
  }, ref) => {
    const baseClasses = 'inline-flex items-center font-medium rounded-full transition-all duration-200';
    
    const variants = {
      default: 'bg-gray-100 text-gray-800 border border-gray-200',
      success: 'bg-green-100 text-green-800 border border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      error: 'bg-red-100 text-red-800 border border-red-200',
      info: 'bg-blue-100 text-blue-800 border border-blue-200',
      secondary: 'bg-purple-100 text-purple-800 border border-purple-200'
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs gap-1',
      md: 'px-2.5 py-1 text-xs gap-1.5',
      lg: 'px-3 py-1.5 text-sm gap-2'
    };

    const pulseClass = pulse ? 'animate-pulse' : '';
    
    const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${pulseClass} ${className}`;

    return (
      <motion.span
        ref={ref}
        className={classes}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </motion.span>
    );
  }
);

Badge.displayName = 'Badge';

// Status-specific badge components for common use cases
export const StatusBadge: React.FC<{
  status: 'active' | 'inactive' | 'pending' | 'verified' | 'rejected' | 'suspended' | 'completed' | 'failed';
  icon?: React.ReactNode;
  className?: string;
}> = ({ status, icon, className = '' }) => {
  const statusConfig = {
    active: { variant: 'success' as const, text: 'Active' },
    inactive: { variant: 'secondary' as const, text: 'Inactive' },
    pending: { variant: 'warning' as const, text: 'Pending' },
    verified: { variant: 'success' as const, text: 'Verified' },
    rejected: { variant: 'error' as const, text: 'Rejected' },
    suspended: { variant: 'error' as const, text: 'Suspended' },
    completed: { variant: 'success' as const, text: 'Completed' },
    failed: { variant: 'error' as const, text: 'Failed' }
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} icon={icon} className={className}>
      {config.text}
    </Badge>
  );
};

export const TrustScoreBadge: React.FC<{
  score: number;
  icon?: React.ReactNode;
  className?: string;
}> = ({ score, icon, className = '' }) => {
  let variant: BadgeProps['variant'] = 'default';
  
  if (score >= 80) variant = 'success';
  else if (score >= 60) variant = 'info';
  else if (score >= 40) variant = 'warning';
  else variant = 'error';

  return (
    <Badge variant={variant} icon={icon} className={className}>
      Trust: {score}
    </Badge>
  );
};

export default Badge;

