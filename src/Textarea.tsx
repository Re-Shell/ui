import React, { forwardRef, useState } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Textarea label
   */
  label?: string;
  
  /**
   * Textarea size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Textarea variant
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
   * Whether to show character count
   */
  showCharacterCount?: boolean;
  
  /**
   * Maximum character count
   */
  maxLength?: number;
  
  /**
   * Whether to auto-resize based on content
   */
  autoResize?: boolean;
  
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
 * Textarea component for Re-Shell UI
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  size = 'md',
  variant = 'default',
  error = false,
  errorMessage,
  helperText,
  showCharacterCount = false,
  maxLength,
  autoResize = false,
  fullWidth = false,
  className = '',
  containerClassName = '',
  disabled = false,
  value,
  onChange,
  ...rest
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [textValue, setTextValue] = useState(value || '');

  // Size classes
  const sizeClasses = {
    sm: 'text-sm py-1.5 px-3 min-h-[80px]',
    md: 'text-sm py-2 px-3 min-h-[100px]',
    lg: 'text-base py-2.5 px-4 min-h-[120px]',
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

  // Textarea classes
  const textareaClasses = [
    'w-full transition-colors duration-200 focus:outline-none resize-vertical',
    variant !== 'unstyled' ? 'focus:ring-2 focus:ring-opacity-50' : '',
    autoResize ? 'resize-none overflow-hidden' : '',
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

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    rest.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    rest.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setTextValue(newValue);
    
    // Auto-resize functionality
    if (autoResize) {
      const textarea = e.target;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
    
    onChange?.(e);
  };

  // Character count
  const currentLength = typeof textValue === 'string' ? textValue.length : 0;
  const isOverLimit = maxLength ? currentLength > maxLength : false;

  return (
    <div className={containerClasses}>
      {label && (
        <label className={`block text-sm font-medium mb-1 ${error ? 'text-red-700' : 'text-gray-700'}`}>
          {label}
        </label>
      )}
      
      <div className="relative">
        <textarea
          ref={ref}
          className={textareaClasses}
          disabled={disabled}
          value={value}
          maxLength={maxLength}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          data-testid="re-shell-textarea"
          {...rest}
        />
      </div>
      
      {/* Footer with character count and helper text */}
      <div className="flex justify-between items-start mt-1">
        <div className="flex-1">
          {(helperText || errorMessage) && (
            <p className={`text-xs ${error ? 'text-red-600' : 'text-gray-500'}`}>
              {error ? errorMessage : helperText}
            </p>
          )}
        </div>
        
        {showCharacterCount && (
          <div className="flex-shrink-0 ml-2">
            <span className={`text-xs ${
              isOverLimit ? 'text-red-600' : 
              error ? 'text-red-600' : 
              'text-gray-500'
            }`}>
              {currentLength}{maxLength && `/${maxLength}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
