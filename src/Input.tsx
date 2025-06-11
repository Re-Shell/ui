import React, { forwardRef, useState } from 'react';
import { Icon } from './Icon';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Input label
   */
  label?: string;
  
  /**
   * Input size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Input variant
   */
  variant?: 'default' | 'filled' | 'flushed' | 'unstyled';
  
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
   * Left icon
   */
  leftIcon?: React.ReactNode;
  
  /**
   * Right icon
   */
  rightIcon?: React.ReactNode;
  
  /**
   * Left addon
   */
  leftAddon?: React.ReactNode;
  
  /**
   * Right addon
   */
  rightAddon?: React.ReactNode;
  
  /**
   * Loading state
   */
  loading?: boolean;
  
  /**
   * Full width
   */
  fullWidth?: boolean;
  
  /**
   * Show password toggle (for password inputs)
   */
  showPasswordToggle?: boolean;
  
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
 * Input component for Re-Shell UI
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  size = 'md',
  variant = 'default',
  error = false,
  errorMessage,
  helperText,
  leftIcon,
  rightIcon,
  leftAddon,
  rightAddon,
  loading = false,
  fullWidth = false,
  showPasswordToggle = false,
  className = '',
  containerClassName = '',
  type = 'text',
  disabled = false,
  ...rest
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  // Size classes
  const sizeClasses = {
    sm: 'text-sm py-1.5 px-3',
    md: 'text-sm py-2 px-3',
    lg: 'text-base py-2.5 px-4',
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
    disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : '',
    isFocused && variant === 'filled' ? 'bg-gray-50' : '',
  ].filter(Boolean).join(' ');

  // Input classes
  const inputClasses = [
    'w-full transition-colors duration-200 focus:outline-none',
    variant !== 'unstyled' ? 'focus:ring-2 focus:ring-opacity-50' : '',
    sizeClasses[size],
    variantClasses[variant],
    stateClasses,
    leftIcon || leftAddon ? 'pl-10' : '',
    rightIcon || rightAddon || (type === 'password' && showPasswordToggle) || loading ? 'pr-10' : '',
    className,
  ].filter(Boolean).join(' ');

  // Container classes
  const containerClasses = [
    'relative',
    fullWidth ? 'w-full' : '',
    containerClassName,
  ].filter(Boolean).join(' ');

  // Icon size based on input size
  const iconSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    rest.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    rest.onBlur?.(e);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={containerClasses}>
      {label && (
        <label className={`block text-sm font-medium mb-1 ${error ? 'text-red-700' : 'text-gray-700'}`}>
          {label}
        </label>
      )}
      
      <div className="relative">
        {/* Left addon */}
        {leftAddon && (
          <div className={`absolute left-0 top-0 h-full flex items-center px-3 ${
            variant === 'default' ? 'border-r border-gray-300 bg-gray-50' : ''
          }`}>
            {leftAddon}
          </div>
        )}
        
        {/* Left icon */}
        {leftIcon && !leftAddon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {React.isValidElement(leftIcon) ? leftIcon : (
              <Icon name={leftIcon as string} size={iconSize} />
            )}
          </div>
        )}
        
        {/* Input */}
        <input
          ref={ref}
          type={inputType}
          className={inputClasses}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          data-testid="re-shell-input"
          {...rest}
        />
        
        {/* Right elements */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {/* Loading spinner */}
          {loading && (
            <div className="animate-spin">
              <Icon name="clock" size={iconSize} className="text-gray-400" />
            </div>
          )}
          
          {/* Password toggle */}
          {type === 'password' && showPasswordToggle && !loading && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              tabIndex={-1}
            >
              <Icon name={showPassword ? 'eyeSlash' : 'eye'} size={iconSize} />
            </button>
          )}
          
          {/* Right icon */}
          {rightIcon && !loading && !(type === 'password' && showPasswordToggle) && (
            <div className="text-gray-400">
              {React.isValidElement(rightIcon) ? rightIcon : (
                <Icon name={rightIcon as string} size={iconSize} />
              )}
            </div>
          )}
        </div>
        
        {/* Right addon */}
        {rightAddon && (
          <div className={`absolute right-0 top-0 h-full flex items-center px-3 ${
            variant === 'default' ? 'border-l border-gray-300 bg-gray-50' : ''
          }`}>
            {rightAddon}
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

Input.displayName = 'Input';

export default Input;
