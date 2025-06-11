import React, { forwardRef } from 'react';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Switch label
   */
  label?: string;
  
  /**
   * Switch size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Switch color
   */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  
  /**
   * Label position
   */
  labelPosition?: 'left' | 'right';
  
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
 * Switch component for Re-Shell UI
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(({
  label,
  size = 'md',
  color = 'primary',
  labelPosition = 'right',
  error = false,
  errorMessage,
  helperText,
  className = '',
  labelClassName = '',
  checked = false,
  disabled = false,
  onChange,
  ...rest
}, ref) => {
  // Size classes for the switch track
  const trackSizeClasses = {
    sm: 'w-8 h-4',
    md: 'w-10 h-5',
    lg: 'w-12 h-6',
  };
  
  // Size classes for the switch thumb
  const thumbSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };
  
  // Color classes for checked state
  const colorClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600',
  };
  
  // Text size classes
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };
  
  // Transform classes for thumb position
  const thumbTransformClasses = {
    sm: checked ? 'translate-x-4' : 'translate-x-0',
    md: checked ? 'translate-x-5' : 'translate-x-0',
    lg: checked ? 'translate-x-6' : 'translate-x-0',
  };
  
  // Track classes
  const trackClasses = [
    'relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out',
    'focus-within:ring-2 focus-within:ring-offset-2',
    trackSizeClasses[size],
    checked 
      ? error 
        ? 'bg-red-600 focus-within:ring-red-500' 
        : `${colorClasses[color]} focus-within:ring-${color === 'primary' ? 'blue' : color === 'secondary' ? 'gray' : color}-500`
      : 'bg-gray-200 focus-within:ring-gray-500',
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    className,
  ].filter(Boolean).join(' ');
  
  // Thumb classes
  const thumbClasses = [
    'inline-block rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out',
    thumbSizeClasses[size],
    thumbTransformClasses[size],
    disabled ? 'cursor-not-allowed' : 'cursor-pointer',
  ].filter(Boolean).join(' ');
  
  // Label classes
  const labelClasses = [
    'flex items-center',
    labelPosition === 'left' ? 'flex-row-reverse' : '',
    labelPosition === 'left' ? 'space-x-reverse space-x-3' : 'space-x-3',
    disabled ? 'cursor-not-allowed' : 'cursor-pointer',
    labelClassName,
  ].filter(Boolean).join(' ');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled && onChange) {
      onChange(e);
    }
  };
  
  const switchElement = (
    <div className={trackClasses}>
      <input
        ref={ref}
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        data-testid="re-shell-switch"
        {...rest}
      />
      <span className={thumbClasses} />
    </div>
  );
  
  if (label) {
    return (
      <div>
        <label className={labelClasses}>
          {switchElement}
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
  
  return switchElement;
});

Switch.displayName = 'Switch';

export default Switch;
