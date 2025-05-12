import React from 'react';

export interface ButtonProps {
  /**
   * Button text content
   */
  children: React.ReactNode;
  
  /**
   * Button variant
   */
  variant?: 'primary' | 'secondary' | 'danger';
  
  /**
   * Button size
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * Disabled state
   */
  disabled?: boolean;
  
  /**
   * Click handler
   */
  onClick?: () => void;
  
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Button component for Re-Shell UI
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  className = '',
}) => {
  // Base classes
  const baseClasses = 'font-medium rounded focus:outline-none focus:ring-2 transition-colors';
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-300',
  };
  
  // Size classes
  const sizeClasses = {
    small: 'text-xs py-1 px-2',
    medium: 'text-sm py-2 px-4',
    large: 'text-base py-3 px-6',
  };
  
  // Disabled state
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
  // Combine all classes
  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`;
  
  return (
    <button 
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
      data-testid="re-shell-button"
    >
      {children}
    </button>
  );
};

export default Button;