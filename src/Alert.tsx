import React, { forwardRef } from 'react';
import { Icon } from './Icon';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Alert variant/status
   */
  variant?: 'info' | 'success' | 'warning' | 'error';
  
  /**
   * Alert size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Alert title
   */
  title?: string;
  
  /**
   * Whether the alert is dismissible
   */
  dismissible?: boolean;
  
  /**
   * Function called when alert is dismissed
   */
  onDismiss?: () => void;
  
  /**
   * Custom icon
   */
  icon?: React.ReactNode;
  
  /**
   * Whether to show default icon
   */
  showIcon?: boolean;
  
  /**
   * Alert content
   */
  children: React.ReactNode;
  
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Alert component for Re-Shell UI
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(({
  variant = 'info',
  size = 'md',
  title,
  dismissible = false,
  onDismiss,
  icon,
  showIcon = true,
  children,
  className = '',
  ...rest
}, ref) => {
  // Base classes
  const baseClasses = 'relative rounded-lg border flex items-start';
  
  // Variant classes
  const variantClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'p-3 text-sm',
    md: 'p-4 text-sm',
    lg: 'p-5 text-base',
  };
  
  // Icon mapping
  const iconMap = {
    info: 'info',
    success: 'check',
    warning: 'warning',
    error: 'error',
  };
  
  // Icon color classes
  const iconColorClasses = {
    info: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
  };
  
  // Combine all classes
  const alertClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  ].filter(Boolean).join(' ');
  
  // Icon size based on alert size
  const iconSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';
  
  const defaultIcon = (
    <Icon 
      name={iconMap[variant]} 
      size={iconSize} 
      className={iconColorClasses[variant]}
    />
  );
  
  const displayIcon = icon || (showIcon ? defaultIcon : null);
  
  return (
    <div
      ref={ref}
      className={alertClasses}
      role="alert"
      data-testid="re-shell-alert"
      {...rest}
    >
      {/* Icon */}
      {displayIcon && (
        <div className="flex-shrink-0 mr-3">
          {displayIcon}
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-medium mb-1">
            {title}
          </h4>
        )}
        <div className={title ? 'text-sm opacity-90' : ''}>
          {children}
        </div>
      </div>
      
      {/* Dismiss button */}
      {dismissible && (
        <div className="flex-shrink-0 ml-3">
          <button
            onClick={onDismiss}
            className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
              variant === 'info' ? 'text-blue-500 hover:bg-blue-100 focus:ring-blue-600' :
              variant === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' :
              variant === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600' :
              'text-red-500 hover:bg-red-100 focus:ring-red-600'
            }`}
            aria-label="Dismiss alert"
          >
            <Icon name="x" size="sm" />
          </button>
        </div>
      )}
    </div>
  );
});

Alert.displayName = 'Alert';

export default Alert;
