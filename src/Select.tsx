import React, { forwardRef, useState } from 'react';
import { Icon } from './Icon';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /**
   * Select label
   */
  label?: string;
  
  /**
   * Select size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Select variant
   */
  variant?: 'default' | 'filled' | 'flushed' | 'unstyled';
  
  /**
   * Select options
   */
  options: SelectOption[];
  
  /**
   * Placeholder text
   */
  placeholder?: string;
  
  /**
   * Error state
   */
  error?: boolean;
  
  /**
   * Error message
   */
  errorMessage?: string;
  
  /**
   * Helper text
   */
  helperText?: string;
  
  /**
   * Loading state
   */
  loading?: boolean;
  
  /**
   * Full width
   */
  fullWidth?: boolean;
  
  /**
   * Additional CSS class names
   */
  className?: string;
  
  /**
   * Container class names
   */
  containerClassName?: string;
}

/**
 * Select component for Re-Shell UI
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  size = 'md',
  variant = 'default',
  options,
  placeholder,
  error = false,
  errorMessage,
  helperText,
  loading = false,
  fullWidth = false,
  className = '',
  containerClassName = '',
  disabled = false,
  ...rest
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  // Size classes
  const sizeClasses = {
    sm: 'text-sm py-1.5 px-3 pr-8',
    md: 'text-sm py-2 px-3 pr-8',
    lg: 'text-base py-2.5 px-4 pr-10',
  };

  // Variant classes
  const variantClasses = {
    default: 'border border-gray-300 rounded-md bg-white',
    filled: 'border-0 rounded-md bg-gray-100',
    flushed: 'border-0 border-b-2 border-gray-300 rounded-none bg-transparent',
    unstyled: 'border-0 bg-transparent',
  };

  // State classes
  const stateClasses = [
    error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 
    variant === 'flushed' ? 'focus:border-blue-500' :
    'focus:border-blue-500 focus:ring-blue-500',
    disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer',
    isFocused && variant === 'filled' ? 'bg-gray-50' : '',
  ].filter(Boolean).join(' ');

  // Select classes
  const selectClasses = [
    'w-full appearance-none transition-colors duration-200 focus:outline-none',
    variant !== 'unstyled' ? 'focus:ring-2 focus:ring-opacity-50' : '',
    sizeClasses[size],
    variantClasses[variant],
    stateClasses,
    className,
  ].filter(Boolean).join(' ');

  // Container classes
  const containerClasses = [
    'relative',
    fullWidth ? 'w-full' : '',
    containerClassName,
  ].filter(Boolean).join(' ');

  // Icon size based on select size
  const iconSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';

  const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
    setIsFocused(true);
    rest.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    setIsFocused(false);
    rest.onBlur?.(e);
  };

  return (
    <div className={containerClasses}>
      {label && (
        <label className={`block text-sm font-medium mb-1 ${error ? 'text-red-700' : 'text-gray-700'}`}>
          {label}
        </label>
      )}
      
      <div className="relative">
        <select
          ref={ref}
          className={selectClasses}
          disabled={disabled || loading}
          onFocus={handleFocus}
          onBlur={handleBlur}
          data-testid="re-shell-select"
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Dropdown icon */}
        <div className={`absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none ${
          loading ? 'hidden' : ''
        }`}>
          <Icon name="chevronDown" size={iconSize} className="text-gray-400" />
        </div>
        
        {/* Loading spinner */}
        {loading && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <div className="animate-spin">
              <Icon name="clock" size={iconSize} className="text-gray-400" />
            </div>
          </div>
        )}
      </div>
      
      {/* Helper text or error message */}
      {(helperText || errorMessage) && (
        <p className={`mt-1 text-xs ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error ? errorMessage : helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
