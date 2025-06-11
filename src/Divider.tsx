import React from 'react';

export interface DividerProps {
  /**
   * Divider orientation
   */
  orientation?: 'horizontal' | 'vertical';
  
  /**
   * Divider variant
   */
  variant?: 'solid' | 'dashed' | 'dotted';
  
  /**
   * Divider thickness
   */
  thickness?: 'thin' | 'medium' | 'thick';
  
  /**
   * Divider color
   */
  color?: 'gray' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  
  /**
   * Divider label
   */
  label?: string;
  
  /**
   * Label position
   */
  labelPosition?: 'left' | 'center' | 'right';
  
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
 * Divider component for Re-Shell UI
 */
export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  variant = 'solid',
  thickness = 'thin',
  color = 'gray',
  label,
  labelPosition = 'center',
  className = '',
  labelClassName = '',
}) => {
  // Thickness classes
  const thicknessClasses = {
    horizontal: {
      thin: 'border-t',
      medium: 'border-t-2',
      thick: 'border-t-4',
    },
    vertical: {
      thin: 'border-l',
      medium: 'border-l-2',
      thick: 'border-l-4',
    },
  };

  // Variant classes
  const variantClasses = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
  };

  // Color classes
  const colorClasses = {
    gray: 'border-gray-300',
    primary: 'border-blue-500',
    secondary: 'border-gray-500',
    success: 'border-green-500',
    warning: 'border-yellow-500',
    error: 'border-red-500',
  };

  // Base classes
  const baseClasses = [
    thicknessClasses[orientation][thickness],
    variantClasses[variant],
    colorClasses[color],
    orientation === 'horizontal' ? 'w-full' : 'h-full',
    className,
  ].filter(Boolean).join(' ');

  // Label classes
  const labelClasses = [
    'text-sm text-gray-500 bg-white px-3',
    labelClassName,
  ].filter(Boolean).join(' ');

  // If no label, render simple divider
  if (!label) {
    return (
      <div
        className={baseClasses}
        role="separator"
        data-testid="re-shell-divider"
      />
    );
  }

  // Render divider with label
  if (orientation === 'horizontal') {
    return (
      <div className="relative flex items-center" data-testid="re-shell-divider">
        <div className={`flex-grow ${baseClasses}`} />
        <div className={`flex-shrink-0 ${labelPosition === 'center' ? 'mx-4' : labelPosition === 'left' ? 'mr-4' : 'ml-4'}`}>
          <span className={labelClasses}>{label}</span>
        </div>
        {labelPosition === 'center' && <div className={`flex-grow ${baseClasses}`} />}
      </div>
    );
  }

  // Vertical divider with label (less common, but supported)
  return (
    <div className="relative flex flex-col items-center h-full" data-testid="re-shell-divider">
      <div className={`flex-grow ${baseClasses}`} />
      <div className={`flex-shrink-0 ${labelPosition === 'center' ? 'my-4' : labelPosition === 'left' ? 'mb-4' : 'mt-4'}`}>
        <span className={`${labelClasses} transform -rotate-90 whitespace-nowrap`}>{label}</span>
      </div>
      {labelPosition === 'center' && <div className={`flex-grow ${baseClasses}`} />}
    </div>
  );
};

Divider.displayName = 'Divider';

export default Divider;
