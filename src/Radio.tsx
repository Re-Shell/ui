import React, { forwardRef } from 'react';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Radio label
   */
  label?: string;
  
  /**
   * Radio size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Radio color
   */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  
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

export interface RadioGroupProps {
  /**
   * Radio group name
   */
  name: string;
  
  /**
   * Selected value
   */
  value?: string;
  
  /**
   * Change handler
   */
  onChange?: (value: string) => void;
  
  /**
   * Radio group size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Radio group color
   */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  
  /**
   * Whether the radio group is disabled
   */
  disabled?: boolean;
  
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
   * Radio options
   */
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  
  /**
   * Layout direction
   */
  direction?: 'horizontal' | 'vertical';
  
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Radio component for Re-Shell UI
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(({
  label,
  size = 'md',
  color = 'primary',
  error = false,
  errorMessage,
  helperText,
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
  
  // Label classes
  const labelClasses = [
    'flex items-start space-x-2',
    disabled ? 'cursor-not-allowed' : 'cursor-pointer',
    labelClassName,
  ].filter(Boolean).join(' ');
  
  // Custom radio appearance
  const customRadioClasses = [
    'relative inline-flex items-center justify-center',
    'border-2 rounded-full transition-all duration-200',
    sizeClasses[size],
    checked
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
    !disabled && !checked ? 'hover:border-gray-400' : '',
    error && !checked ? 'border-red-500' : '',
  ].filter(Boolean).join(' ');
  
  // Inner dot size
  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };
  
  const renderRadio = () => (
    <div className="relative">
      <input
        ref={ref}
        type="radio"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        data-testid="re-shell-radio"
        {...rest}
      />
      <div className={customRadioClasses}>
        {checked && (
          <div className={`${dotSizeClasses[size]} bg-white rounded-full`} />
        )}
      </div>
    </div>
  );
  
  if (label) {
    return (
      <div>
        <label className={labelClasses}>
          {renderRadio()}
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
  
  return renderRadio();
});

/**
 * RadioGroup component for Re-Shell UI
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  onChange,
  size = 'md',
  color = 'primary',
  disabled = false,
  error = false,
  errorMessage,
  helperText,
  options,
  direction = 'vertical',
  className = '',
}) => {
  const handleChange = (optionValue: string) => {
    if (!disabled && onChange) {
      onChange(optionValue);
    }
  };
  
  const groupClasses = [
    'space-y-2',
    direction === 'horizontal' ? 'flex space-x-4 space-y-0' : '',
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <div>
      <div className={groupClasses} role="radiogroup">
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name}
            value={option.value}
            label={option.label}
            size={size}
            color={color}
            checked={value === option.value}
            disabled={disabled || option.disabled}
            error={error}
            onChange={() => handleChange(option.value)}
          />
        ))}
      </div>
      {(helperText || errorMessage) && (
        <p className={`mt-2 text-xs ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error ? errorMessage : helperText}
        </p>
      )}
    </div>
  );
};

Radio.displayName = 'Radio';
RadioGroup.displayName = 'RadioGroup';

export default Radio;
