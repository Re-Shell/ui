import React, { useState } from 'react';
import { Icon } from './Icon';

export interface AvatarProps {
  /**
   * Avatar source URL
   */
  src?: string;
  
  /**
   * Avatar alt text
   */
  alt?: string;
  
  /**
   * Avatar name (for initials fallback)
   */
  name?: string;
  
  /**
   * Avatar size
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  
  /**
   * Avatar shape
   */
  shape?: 'circle' | 'square' | 'rounded';
  
  /**
   * Avatar color (for initials background)
   */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'gray';
  
  /**
   * Custom fallback content
   */
  fallback?: React.ReactNode;
  
  /**
   * Whether avatar is clickable
   */
  clickable?: boolean;
  
  /**
   * Click handler
   */
  onClick?: () => void;
  
  /**
   * Additional CSS class names
   */
  className?: string;
}

export interface AvatarGroupProps {
  /**
   * Avatar components
   */
  children: React.ReactNode;
  
  /**
   * Maximum avatars to show
   */
  max?: number;
  
  /**
   * Avatar size
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Avatar component for Re-Shell UI
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  shape = 'circle',
  color = 'gray',
  fallback,
  clickable = false,
  onClick,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  // Size classes
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
  };

  // Shape classes
  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-lg',
  };

  // Color classes for initials background
  const colorClasses = {
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-500 text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    error: 'bg-red-500 text-white',
    gray: 'bg-gray-300 text-gray-700',
  };

  // Base classes
  const baseClasses = [
    'inline-flex items-center justify-center overflow-hidden',
    'font-medium select-none',
    sizeClasses[size],
    shapeClasses[shape],
    clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : '',
    className,
  ].filter(Boolean).join(' ');

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
  };

  // Render content based on available props
  const renderContent = () => {
    // Show image if src is provided and no error
    if (src && !imageError) {
      return (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      );
    }

    // Show custom fallback if provided
    if (fallback) {
      return fallback;
    }

    // Show initials if name is provided
    if (name) {
      return (
        <span className={`${colorClasses[color]} w-full h-full flex items-center justify-center`}>
          {getInitials(name)}
        </span>
      );
    }

    // Default fallback icon
    return (
      <span className={`${colorClasses[color]} w-full h-full flex items-center justify-center`}>
        <Icon name="user" size={size === 'xs' ? 'sm' : size === 'sm' ? 'md' : 'lg'} />
      </span>
    );
  };

  return (
    <div
      className={baseClasses}
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      data-testid="re-shell-avatar"
    >
      {renderContent()}
    </div>
  );
};

/**
 * Avatar Group component for Re-Shell UI
 */
export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  children,
  max,
  size = 'md',
  className = '',
}) => {
  const avatars = React.Children.toArray(children);
  const visibleAvatars = max ? avatars.slice(0, max) : avatars;
  const hiddenCount = max ? Math.max(0, avatars.length - max) : 0;

  // Container classes
  const containerClasses = [
    'flex items-center -space-x-2',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} data-testid="re-shell-avatar-group">
      {visibleAvatars.map((avatar, index) => (
        <div key={index} className="relative ring-2 ring-white">
          {React.cloneElement(avatar as React.ReactElement, { size })}
        </div>
      ))}
      
      {hiddenCount > 0 && (
        <div className="relative ring-2 ring-white">
          <Avatar
            size={size}
            color="gray"
            fallback={<span>+{hiddenCount}</span>}
          />
        </div>
      )}
    </div>
  );
};

Avatar.displayName = 'Avatar';
AvatarGroup.displayName = 'AvatarGroup';

export default Avatar;
