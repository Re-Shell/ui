import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button text content
   */
  children: React.ReactNode;

  /**
   * Button variant
   */
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'ghost' | 'outline';

  /**
   * Button size
   */
  size?: 'xs' | 'small' | 'medium' | 'large' | 'xl';

  /**
   * Button shape
   */
  shape?: 'default' | 'rounded' | 'pill' | 'square' | 'circle';

  /**
   * Icon on the left side
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon on the right side
   */
  rightIcon?: React.ReactNode;

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Full width button
   */
  fullWidth?: boolean;

  /**
   * Button type
   */
  type?: 'button' | 'submit' | 'reset';

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Click handler
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Custom styles
   */
  style?: React.CSSProperties;

  /**
   * Tooltip text
   */
  tooltip?: string;

  /**
   * Button group position (for button groups)
   */
  groupPosition?: 'first' | 'middle' | 'last' | 'single';
}

/**
 * Loading spinner component
 */
const LoadingSpinner: React.FC<{ size?: string }> = ({ size = 'w-4 h-4' }) => (
  <svg
    className={`animate-spin ${size}`}
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

/**
 * Enhanced Button component for Re-Shell UI
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'medium',
  shape = 'default',
  leftIcon,
  rightIcon,
  loading = false,
  fullWidth = false,
  type = 'button',
  disabled = false,
  onClick,
  className = '',
  style,
  tooltip,
  groupPosition = 'single',
  ...rest
}, ref) => {
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 select-none';

  // Variant classes
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 active:bg-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 active:bg-green-800',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500 active:bg-yellow-700',
    info: 'bg-cyan-600 text-white hover:bg-cyan-700 focus:ring-cyan-500 active:bg-cyan-800',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200',
    outline: 'bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 active:bg-gray-100',
  };

  // Size classes
  const sizeClasses = {
    xs: 'text-xs py-1 px-2 gap-1',
    small: 'text-sm py-1.5 px-3 gap-1.5',
    medium: 'text-sm py-2 px-4 gap-2',
    large: 'text-base py-2.5 px-5 gap-2.5',
    xl: 'text-lg py-3 px-6 gap-3',
  };

  // Shape classes
  const shapeClasses = {
    default: 'rounded-md',
    rounded: 'rounded-lg',
    pill: 'rounded-full',
    square: 'rounded-none',
    circle: 'rounded-full aspect-square',
  };

  // Group position classes
  const groupClasses = {
    single: '',
    first: 'rounded-r-none border-r-0',
    middle: 'rounded-none border-r-0',
    last: 'rounded-l-none',
  };

  // State classes
  const stateClasses = [
    disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    fullWidth ? 'w-full' : '',
    loading ? 'pointer-events-none' : '',
  ].filter(Boolean).join(' ');

  // Icon size based on button size
  const iconSizeMap = {
    xs: 'w-3 h-3',
    small: 'w-4 h-4',
    medium: 'w-4 h-4',
    large: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  const iconSize = iconSizeMap[size];

  // Combine all classes
  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    shapeClasses[shape],
    groupClasses[groupPosition],
    stateClasses,
    className,
  ].filter(Boolean).join(' ');

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  const buttonContent = (
    <>
      {loading && <LoadingSpinner size={iconSize} />}
      {!loading && leftIcon && (
        <span className={`flex-shrink-0 ${iconSize}`}>
          {leftIcon}
        </span>
      )}
      {shape !== 'circle' && (
        <span className={loading ? 'opacity-50' : ''}>
          {children}
        </span>
      )}
      {!loading && rightIcon && (
        <span className={`flex-shrink-0 ${iconSize}`}>
          {rightIcon}
        </span>
      )}
    </>
  );

  const button = (
    <button
      ref={ref}
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      style={style}
      data-testid="re-shell-button"
      aria-disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      {buttonContent}
    </button>
  );

  // Wrap with tooltip if provided
  if (tooltip) {
    return (
      <div className="relative group">
        {button}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {tooltip}
        </div>
      </div>
    );
  }

  return button;
});

Button.displayName = 'Button';

export default Button;