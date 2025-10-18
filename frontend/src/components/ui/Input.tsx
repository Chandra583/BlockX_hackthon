import React from 'react';
import { motion } from 'framer-motion';
import { Search, AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  variant?: 'default' | 'search';
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className = '',
    label,
    error,
    helperText,
    icon,
    iconPosition = 'left',
    variant = 'default',
    fullWidth = false,
    type = 'text',
    ...props
  }, ref) => {
    const baseClasses = 'px-3 py-2 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantClasses = {
      default: error 
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
        : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
      search: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500 bg-gray-50 focus:bg-white'
    };

    const widthClass = fullWidth ? 'w-full' : '';
    const paddingClass = icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : '';
    
    const inputClasses = `${baseClasses} ${variantClasses[variant]} ${widthClass} ${paddingClass} ${className}`;

    const inputIcon = variant === 'search' && !icon ? <Search className="w-4 h-4" /> : icon;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        
        <div className="relative">
          {inputIcon && (
            <div className={`absolute inset-y-0 ${iconPosition === 'left' ? 'left-0' : 'right-0'} flex items-center ${iconPosition === 'left' ? 'pl-3' : 'pr-3'} pointer-events-none`}>
              <div className="text-gray-400">
                {inputIcon}
              </div>
            </div>
          )}
          
          <input
            ref={ref}
            type={type}
            className={inputClasses}
            {...props}
          />
        </div>
        
        {(error || helperText) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 flex items-center space-x-1"
          >
            {error && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
            <p className={`text-xs ${error ? 'text-red-600' : 'text-gray-500'}`}>
              {error || helperText}
            </p>
          </motion.div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Search Input Component
export interface SearchInputProps extends Omit<InputProps, 'variant' | 'icon'> {
  onClear?: () => void;
  showClearButton?: boolean;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({
    onClear,
    showClearButton = true,
    value,
    ...props
  }, ref) => {
    return (
      <div className="relative">
        <Input
          ref={ref}
          variant="search"
          value={value}
          {...props}
        />
        {showClearButton && value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export default Input;


