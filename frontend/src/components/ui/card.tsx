import React from 'react';
import { motion } from 'framer-motion';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  interactive?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    className = '',
    variant = 'default',
    padding = 'md',
    hover = false,
    interactive = false,
    children,
    ...props
  }, ref) => {
    const baseClasses = 'rounded-lg transition-all duration-200';
    
    const variants = {
      default: 'bg-white border border-gray-200 shadow-sm',
      elevated: 'bg-white shadow-lg border border-gray-100',
      outlined: 'bg-white border-2 border-gray-200',
      filled: 'bg-gray-50 border border-gray-200'
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };

    const hoverClasses = hover ? 'hover:shadow-lg hover:border-gray-300' : '';
    const interactiveClasses = interactive ? 'cursor-pointer hover:scale-[1.02]' : '';
    
    const classes = `${baseClasses} ${variants[variant]} ${paddings[padding]} ${hoverClasses} ${interactiveClasses} ${className}`;

    const CardComponent = interactive ? motion.div : 'div';
    const motionProps = interactive ? {
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 }
    } : {};

    return (
      <CardComponent
        ref={ref}
        className={classes}
        {...motionProps}
        {...props}
      >
        {children}
      </CardComponent>
    );
  }
);

Card.displayName = 'Card';

// Card sub-components
export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`flex flex-col space-y-1.5 pb-4 ${className}`} {...props}>
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', children, ...props }, ref) => (
    <h3 ref={ref} className={`text-lg font-semibold leading-none tracking-tight text-gray-900 ${className}`} {...props}>
      {children}
    </h3>
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', children, ...props }, ref) => (
    <p ref={ref} className={`text-sm text-gray-600 ${className}`} {...props}>
      {children}
    </p>
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`${className}`} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`flex items-center pt-4 ${className}`} {...props}>
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';

export default Card;


