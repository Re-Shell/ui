import React from 'react';
import { Icon } from './Icon';

export interface BreadcrumbItem {
  key: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  /**
   * Breadcrumb items
   */
  items: BreadcrumbItem[];
  
  /**
   * Custom separator
   */
  separator?: React.ReactNode;
  
  /**
   * Breadcrumb size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Maximum items to show before collapsing
   */
  maxItems?: number;
  
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Breadcrumb component for Re-Shell UI
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator,
  size = 'md',
  maxItems,
  className = '',
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  // Icon size classes
  const iconSizeClasses = {
    sm: 'sm',
    md: 'sm',
    lg: 'md',
  };

  // Default separator
  const defaultSeparator = (
    <Icon 
      name="chevronRight" 
      size={iconSizeClasses[size] as any} 
      className="text-gray-400" 
    />
  );

  const separatorElement = separator || defaultSeparator;

  // Handle item collapsing
  const getDisplayItems = () => {
    if (!maxItems || items.length <= maxItems) {
      return items;
    }

    if (maxItems <= 2) {
      return [items[0], items[items.length - 1]];
    }

    const firstItems = items.slice(0, 1);
    const lastItems = items.slice(-(maxItems - 2));
    
    return [
      ...firstItems,
      { key: 'ellipsis', label: '...', onClick: undefined },
      ...lastItems,
    ];
  };

  const displayItems = getDisplayItems();

  // Container classes
  const containerClasses = [
    'flex items-center space-x-2',
    sizeClasses[size],
    className,
  ].filter(Boolean).join(' ');

  // Item classes
  const getItemClasses = (item: BreadcrumbItem, isLast: boolean) => [
    'inline-flex items-center space-x-1 transition-colors duration-200',
    isLast 
      ? 'text-gray-900 font-medium' 
      : item.href || item.onClick
      ? 'text-blue-600 hover:text-blue-800 cursor-pointer'
      : 'text-gray-500',
    item.key === 'ellipsis' ? 'cursor-default' : '',
  ].filter(Boolean).join(' ');

  const handleItemClick = (item: BreadcrumbItem, e: React.MouseEvent) => {
    if (item.onClick) {
      e.preventDefault();
      item.onClick();
    }
  };

  const renderItem = (item: BreadcrumbItem, index: number, isLast: boolean) => {
    const itemClasses = getItemClasses(item, isLast);

    // Handle ellipsis
    if (item.key === 'ellipsis') {
      return (
        <span key={item.key} className={itemClasses}>
          {item.label}
        </span>
      );
    }

    // Render as link if href is provided
    if (item.href) {
      return (
        <a
          key={item.key}
          href={item.href}
          className={itemClasses}
          onClick={(e) => handleItemClick(item, e)}
          aria-current={isLast ? 'page' : undefined}
        >
          {item.icon && <span>{item.icon}</span>}
          <span>{item.label}</span>
        </a>
      );
    }

    // Render as button if onClick is provided
    if (item.onClick) {
      return (
        <button
          key={item.key}
          className={itemClasses}
          onClick={(e) => handleItemClick(item, e)}
          aria-current={isLast ? 'page' : undefined}
        >
          {item.icon && <span>{item.icon}</span>}
          <span>{item.label}</span>
        </button>
      );
    }

    // Render as span for non-interactive items
    return (
      <span
        key={item.key}
        className={itemClasses}
        aria-current={isLast ? 'page' : undefined}
      >
        {item.icon && <span>{item.icon}</span>}
        <span>{item.label}</span>
      </span>
    );
  };

  return (
    <nav className={containerClasses} aria-label="Breadcrumb" data-testid="re-shell-breadcrumb">
      <ol className="flex items-center space-x-2">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          
          return (
            <li key={item.key} className="flex items-center space-x-2">
              {renderItem(item, index, isLast)}
              {!isLast && (
                <span className="flex-shrink-0" aria-hidden="true">
                  {separatorElement}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

Breadcrumb.displayName = 'Breadcrumb';

export default Breadcrumb;
