import React, { forwardRef } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Card variant
   */
  variant?: 'default' | 'outlined' | 'elevated' | 'filled';
  
  /**
   * Card size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Whether the card is interactive (clickable)
   */
  interactive?: boolean;
  
  /**
   * Whether the card is loading
   */
  loading?: boolean;
  
  /**
   * Additional CSS class names
   */
  className?: string;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Additional CSS class names
   */
  className?: string;
}

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Additional CSS class names
   */
  className?: string;
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Card component for Re-Shell UI
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(({
  variant = 'default',
  size = 'md',
  interactive = false,
  loading = false,
  className = '',
  children,
  ...rest
}, ref) => {
  // Base classes
  const baseClasses = 'relative overflow-hidden transition-all duration-200';
  
  // Variant classes
  const variantClasses = {
    default: 'bg-white border border-gray-200 rounded-lg',
    outlined: 'bg-white border-2 border-gray-300 rounded-lg',
    elevated: 'bg-white rounded-lg shadow-lg',
    filled: 'bg-gray-50 border border-gray-200 rounded-lg',
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };
  
  // Interactive classes
  const interactiveClasses = interactive
    ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
    : '';
  
  // Loading classes
  const loadingClasses = loading ? 'pointer-events-none' : '';
  
  // Combine all classes
  const cardClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    interactiveClasses,
    loadingClasses,
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <div
      ref={ref}
      className={cardClasses}
      data-testid="re-shell-card"
      {...rest}
    >
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      {children}
    </div>
  );
});

/**
 * Card Header component
 */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(({
  className = '',
  children,
  ...rest
}, ref) => {
  const headerClasses = [
    'border-b border-gray-200 pb-3 mb-4',
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <div
      ref={ref}
      className={headerClasses}
      data-testid="re-shell-card-header"
      {...rest}
    >
      {children}
    </div>
  );
});

/**
 * Card Body component
 */
export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(({
  className = '',
  children,
  ...rest
}, ref) => {
  const bodyClasses = [
    'flex-1',
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <div
      ref={ref}
      className={bodyClasses}
      data-testid="re-shell-card-body"
      {...rest}
    >
      {children}
    </div>
  );
});

/**
 * Card Footer component
 */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(({
  className = '',
  children,
  ...rest
}, ref) => {
  const footerClasses = [
    'border-t border-gray-200 pt-3 mt-4',
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <div
      ref={ref}
      className={footerClasses}
      data-testid="re-shell-card-footer"
      {...rest}
    >
      {children}
    </div>
  );
});

// Set display names
Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardBody.displayName = 'CardBody';
CardFooter.displayName = 'CardFooter';

export default Card;
