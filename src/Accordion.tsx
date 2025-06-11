import React, { useState, createContext, useContext } from 'react';
import { Icon } from './Icon';

export interface AccordionItem {
  key: string;
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface AccordionProps {
  /**
   * Accordion items
   */
  items: AccordionItem[];
  
  /**
   * Default expanded keys
   */
  defaultExpandedKeys?: string[];
  
  /**
   * Controlled expanded keys
   */
  expandedKeys?: string[];
  
  /**
   * Change handler
   */
  onChange?: (expandedKeys: string[]) => void;
  
  /**
   * Whether multiple items can be expanded
   */
  allowMultiple?: boolean;
  
  /**
   * Whether to allow toggle (collapse expanded item)
   */
  allowToggle?: boolean;
  
  /**
   * Accordion variant
   */
  variant?: 'default' | 'filled' | 'outlined';
  
  /**
   * Accordion size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Additional CSS class names
   */
  className?: string;
}

// Context for accordion state
interface AccordionContextValue {
  expandedKeys: string[];
  onToggle: (key: string) => void;
  allowMultiple: boolean;
  allowToggle: boolean;
  variant: string;
  size: string;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

const useAccordionContext = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('AccordionItem must be used within Accordion');
  }
  return context;
};

/**
 * Accordion component for Re-Shell UI
 */
export const Accordion: React.FC<AccordionProps> = ({
  items,
  defaultExpandedKeys = [],
  expandedKeys: controlledExpandedKeys,
  onChange,
  allowMultiple = false,
  allowToggle = true,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const [internalExpandedKeys, setInternalExpandedKeys] = useState<string[]>(
    defaultExpandedKeys
  );

  const expandedKeys = controlledExpandedKeys ?? internalExpandedKeys;

  const handleToggle = (key: string) => {
    let newExpandedKeys: string[];

    if (expandedKeys.includes(key)) {
      // Item is currently expanded
      if (allowToggle) {
        newExpandedKeys = expandedKeys.filter(k => k !== key);
      } else {
        return; // Don't allow collapsing if allowToggle is false
      }
    } else {
      // Item is currently collapsed
      if (allowMultiple) {
        newExpandedKeys = [...expandedKeys, key];
      } else {
        newExpandedKeys = [key];
      }
    }

    if (!controlledExpandedKeys) {
      setInternalExpandedKeys(newExpandedKeys);
    }
    onChange?.(newExpandedKeys);
  };

  const contextValue: AccordionContextValue = {
    expandedKeys,
    onToggle: handleToggle,
    allowMultiple,
    allowToggle,
    variant,
    size,
  };

  // Container classes
  const containerClasses = [
    'w-full',
    variant === 'outlined' ? 'border border-gray-200 rounded-lg overflow-hidden' : '',
    variant === 'filled' ? 'bg-gray-50 rounded-lg overflow-hidden' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className={containerClasses} data-testid="re-shell-accordion">
        {items.map((item, index) => (
          <AccordionItem
            key={item.key}
            itemKey={item.key}
            title={item.title}
            content={item.content}
            disabled={item.disabled}
            icon={item.icon}
            isLast={index === items.length - 1}
          />
        ))}
      </div>
    </AccordionContext.Provider>
  );
};

/**
 * Individual Accordion Item component
 */
interface AccordionItemProps {
  itemKey: string;
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
  isLast?: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  itemKey,
  title,
  content,
  disabled = false,
  icon,
  isLast = false,
}) => {
  const { expandedKeys, onToggle, variant, size } = useAccordionContext();
  const isExpanded = expandedKeys.includes(itemKey);

  // Size classes
  const sizeClasses = {
    sm: 'text-sm px-3 py-2',
    md: 'text-sm px-4 py-3',
    lg: 'text-base px-5 py-4',
  };

  // Content size classes
  const contentSizeClasses = {
    sm: 'px-3 pb-2',
    md: 'px-4 pb-3',
    lg: 'px-5 pb-4',
  };

  // Header classes
  const headerClasses = [
    'w-full flex items-center justify-between transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    sizeClasses[size as keyof typeof sizeClasses],
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50',
    variant === 'default' && !isLast ? 'border-b border-gray-200' : '',
    variant === 'filled' ? 'bg-gray-100' : '',
  ].filter(Boolean).join(' ');

  // Content classes
  const contentClasses = [
    'overflow-hidden transition-all duration-200 ease-in-out',
    contentSizeClasses[size as keyof typeof contentSizeClasses],
    variant === 'default' && !isLast ? 'border-b border-gray-200' : '',
    isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0',
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    if (!disabled) {
      onToggle(itemKey);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div data-testid={`accordion-item-${itemKey}`}>
      {/* Header */}
      <button
        className={headerClasses}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-expanded={isExpanded}
        aria-controls={`accordion-content-${itemKey}`}
        id={`accordion-header-${itemKey}`}
      >
        <div className="flex items-center space-x-3">
          {icon && <span>{icon}</span>}
          <span className="font-medium text-left">{title}</span>
        </div>
        
        <Icon
          name="chevronDown"
          size={size === 'sm' ? 'sm' : 'md'}
          className={`transform transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      
      {/* Content */}
      <div
        className={contentClasses}
        id={`accordion-content-${itemKey}`}
        aria-labelledby={`accordion-header-${itemKey}`}
        role="region"
      >
        <div className="text-gray-600">
          {content}
        </div>
      </div>
    </div>
  );
};

Accordion.displayName = 'Accordion';

export default Accordion;
