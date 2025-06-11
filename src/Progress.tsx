import React from 'react';

export interface ProgressProps {
  /**
   * Progress value (0-100)
   */
  value: number;
  
  /**
   * Maximum value
   */
  max?: number;
  
  /**
   * Progress size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Progress color
   */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  
  /**
   * Progress variant
   */
  variant?: 'default' | 'striped' | 'animated';
  
  /**
   * Whether to show label
   */
  showLabel?: boolean;
  
  /**
   * Custom label
   */
  label?: string;
  
  /**
   * Label position
   */
  labelPosition?: 'inside' | 'outside';
  
  /**
   * Whether progress is indeterminate
   */
  indeterminate?: boolean;
  
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
 * Progress component for Re-Shell UI
 */
export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  variant = 'default',
  showLabel = false,
  label,
  labelPosition = 'outside',
  indeterminate = false,
  className = '',
  labelClassName = '',
}) => {
  // Normalize value
  const normalizedValue = Math.min(Math.max(value, 0), max);
  const percentage = (normalizedValue / max) * 100;

  // Size classes
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  // Color classes
  const colorClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600',
  };

  // Text size classes
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  // Container classes
  const containerClasses = [
    'w-full bg-gray-200 rounded-full overflow-hidden',
    sizeClasses[size],
    className,
  ].filter(Boolean).join(' ');

  // Progress bar classes
  const progressClasses = [
    'h-full transition-all duration-300 ease-out',
    colorClasses[color],
    variant === 'striped' ? 'bg-stripes' : '',
    variant === 'animated' ? 'bg-stripes animate-stripes' : '',
    indeterminate ? 'animate-indeterminate' : '',
  ].filter(Boolean).join(' ');

  // Label classes
  const labelClasses = [
    'font-medium text-gray-700',
    textSizeClasses[size],
    labelClassName,
  ].filter(Boolean).join(' ');

  // Generate label text
  const getLabelText = () => {
    if (label) return label;
    if (indeterminate) return 'Loading...';
    return `${Math.round(percentage)}%`;
  };

  const progressBar = (
    <div className={containerClasses} role="progressbar" aria-valuenow={normalizedValue} aria-valuemin={0} aria-valuemax={max} data-testid="re-shell-progress">
      <div
        className={progressClasses}
        style={{
          width: indeterminate ? '100%' : `${percentage}%`,
        }}
      >
        {showLabel && labelPosition === 'inside' && (
          <div className="flex items-center justify-center h-full">
            <span className={`text-white text-xs font-medium ${textSizeClasses[size]}`}>
              {getLabelText()}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (showLabel && labelPosition === 'outside') {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-1">
          <span className={labelClasses}>
            {getLabelText()}
          </span>
        </div>
        {progressBar}
      </div>
    );
  }

  return progressBar;
};

Progress.displayName = 'Progress';

export default Progress;
