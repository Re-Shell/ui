import React, { forwardRef } from 'react';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Spinner size
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Spinner color
   */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'white';
  
  /**
   * Spinner variant
   */
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars';
  
  /**
   * Loading text
   */
  label?: string;
  
  /**
   * Whether to show label
   */
  showLabel?: boolean;
  
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Spinner component for Re-Shell UI
 */
export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(({
  size = 'md',
  color = 'primary',
  variant = 'spinner',
  label = 'Loading...',
  showLabel = false,
  className = '',
  ...rest
}, ref) => {
  // Size classes
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };
  
  // Color classes
  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    white: 'text-white',
  };
  
  // Text size for labels
  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };
  
  const renderSpinner = () => {
    const baseClasses = [
      sizeClasses[size],
      colorClasses[color],
      className,
    ].filter(Boolean).join(' ');
    
    switch (variant) {
      case 'spinner':
        return (
          <svg
            className={`animate-spin ${baseClasses}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
        
      case 'dots':
        return (
          <div className={`flex space-x-1 ${className}`}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`${sizeClasses[size]} ${colorClasses[color]} bg-current rounded-full animate-pulse`}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s',
                }}
              />
            ))}
          </div>
        );
        
      case 'pulse':
        return (
          <div
            className={`${baseClasses} bg-current rounded-full animate-pulse`}
            style={{ animationDuration: '1.5s' }}
          />
        );
        
      case 'bars':
        return (
          <div className={`flex space-x-1 ${className}`}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-1 ${colorClasses[color]} bg-current animate-pulse`}
                style={{
                  height: size === 'xs' ? '12px' : size === 'sm' ? '16px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '48px',
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '1.2s',
                }}
              />
            ))}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  const containerClasses = [
    'inline-flex items-center',
    showLabel ? 'space-x-2' : '',
  ].filter(Boolean).join(' ');
  
  return (
    <div
      ref={ref}
      className={containerClasses}
      role="status"
      aria-label={label}
      data-testid="re-shell-spinner"
      {...rest}
    >
      {renderSpinner()}
      {showLabel && (
        <span className={`${textSizeClasses[size]} ${colorClasses[color]}`}>
          {label}
        </span>
      )}
    </div>
  );
});

Spinner.displayName = 'Spinner';

export default Spinner;
