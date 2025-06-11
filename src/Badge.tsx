import React, { forwardRef } from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Badge variant
   */
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  
  /**
   * Badge size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Badge shape
   */
  shape?: 'rounded' | 'pill' | 'square';
  
  /**
   * Whether the badge has a dot indicator
   */
  dot?: boolean;
  
  /**
   * Badge content
   */
  children: React.ReactNode;
  
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Badge component for Re-Shell UI
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({
  variant = 'default',
  size = 'md',
  shape = 'rounded',
  dot = false,
  children,
  className = '',
  ...rest
}, ref) => {
  // Base classes
  const baseClasses = 'inline-flex items-center font-medium transition-colors';
  
  // Variant classes
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-600',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-cyan-100 text-cyan-800',
  };
  
  // Size classes
  const sizeClasses = {
    sm: dot ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1',
    md: dot ? 'text-sm px-2 py-0.5' : 'text-sm px-2.5 py-1',
    lg: dot ? 'text-base px-2.5 py-1' : 'text-base px-3 py-1.5',
  };
  
  // Shape classes
  const shapeClasses = {
    rounded: 'rounded',
    pill: 'rounded-full',
    square: 'rounded-none',
  };
  
  // Dot classes
  const dotClasses = {
    default: 'bg-gray-400',
    primary: 'bg-blue-500',
    secondary: 'bg-gray-400',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-cyan-500',
  };
  
  // Combine all classes
  const badgeClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    shapeClasses[shape],
    className,
  ].filter(Boolean).join(' ');
  
  // Dot size based on badge size
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-2.5 h-2.5' : 'w-2 h-2';
  
  return (
    <span
      ref={ref}
      className={badgeClasses}
      data-testid="re-shell-badge"
      {...rest}
    >
      {dot && (
        <span className={`${dotSize} ${dotClasses[variant]} rounded-full mr-1.5`} />
      )}
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge;
