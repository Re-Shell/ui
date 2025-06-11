import React, { forwardRef } from 'react';
import { Icon } from './Icon';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Checkbox label
   */
  label?: string;
  
  /**
   * Checkbox size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Checkbox color
   */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  
  /**
   * Whether the checkbox is indeterminate
   */
  indeterminate?: boolean;
  
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
   * Additional CSS class names
   */
  className?: string;
  
  /**
   * Label class names
   */
  labelClassName?: string;
}

/**
 * Checkbox component for Re-Shell UI
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  size = 'md',
  color = 'primary',
  indeterminate = false,
  error = false,
  errorMessage,
  helperText,
  className = '',
  labelClassName = '',
  checked,
  disabled = false,
  ...rest
}, ref) => {
  // Size classes
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };
  
  
  // Text size classes
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };
  
  // Icon size classes
  const iconSizeClasses = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
  };
  
  
  // Label classes
  const labelClasses = [
    'flex items-start space-x-2',
    disabled ? 'cursor-not-allowed' : 'cursor-pointer',
    labelClassName,
  ].filter(Boolean).join(' ');
  
  // Custom checkbox appearance
  const customCheckboxClasses = [
    'relative inline-flex items-center justify-center',
    'border-2 rounded transition-all duration-200',
    sizeClasses[size],
    checked || indeterminate
      ? error
        ? 'bg-red-600 border-red-600'
        : color === 'primary'
        ? 'bg-blue-600 border-blue-600'
        : color === 'secondary'
        ? 'bg-gray-600 border-gray-600'
        : color === 'success'
        ? 'bg-green-600 border-green-600'
        : color === 'warning'
        ? 'bg-yellow-600 border-yellow-600'
        : 'bg-red-600 border-red-600'
      : 'bg-white border-gray-300',
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    !disabled && !(checked || indeterminate) ? 'hover:border-gray-400' : '',
    error && !(checked || indeterminate) ? 'border-red-500' : '',
  ].filter(Boolean).join(' ');
  
  const renderCheckbox = () => (
    <div className="relative">
      <input
        ref={ref}
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        data-testid="re-shell-checkbox"
        {...rest}
      />
      <div className={customCheckboxClasses}>
        {(checked || indeterminate) && (
          <Icon
            name={indeterminate ? 'minus' : 'check'}
            size={iconSizeClasses[size] as any}
            className="text-white"
          />
        )}
      </div>
    </div>
  );
  
  if (label) {
    return (
      <div>
        <label className={labelClasses}>
          {renderCheckbox()}
          <div className="flex-1">
            <span className={`${textSizeClasses[size]} ${error ? 'text-red-700' : 'text-gray-900'}`}>
              {label}
            </span>
            {(helperText || errorMessage) && (
              <p className={`mt-1 text-xs ${error ? 'text-red-600' : 'text-gray-500'}`}>
                {error ? errorMessage : helperText}
              </p>
            )}
          </div>
        </label>
      </div>
    );
  }
  
  return renderCheckbox();
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
