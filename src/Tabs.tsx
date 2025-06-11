import React, { useState, createContext, useContext } from 'react';

export interface TabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  content: React.ReactNode;
}

export interface TabsProps {
  /**
   * Tab items
   */
  items: TabItem[];
  
  /**
   * Default active tab key
   */
  defaultActiveKey?: string;
  
  /**
   * Controlled active tab key
   */
  activeKey?: string;
  
  /**
   * Tab change handler
   */
  onChange?: (key: string) => void;
  
  /**
   * Tab variant
   */
  variant?: 'line' | 'enclosed' | 'soft-rounded' | 'solid-rounded';
  
  /**
   * Tab size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Tab orientation
   */
  orientation?: 'horizontal' | 'vertical';
  
  /**
   * Whether tabs are fitted to container
   */
  isFitted?: boolean;
  
  /**
   * Additional CSS class names
   */
  className?: string;
  
  /**
   * Tab list class names
   */
  tabListClassName?: string;
  
  /**
   * Tab panel class names
   */
  tabPanelClassName?: string;
}

// Context for tab state
interface TabsContextValue {
  activeKey: string;
  onChange: (key: string) => void;
  variant: string;
  size: string;
  orientation: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within Tabs');
  }
  return context;
};

/**
 * Tabs component for Re-Shell UI
 */
export const Tabs: React.FC<TabsProps> = ({
  items,
  defaultActiveKey,
  activeKey: controlledActiveKey,
  onChange,
  variant = 'line',
  size = 'md',
  orientation = 'horizontal',
  isFitted = false,
  className = '',
  tabListClassName = '',
  tabPanelClassName = '',
}) => {
  const [internalActiveKey, setInternalActiveKey] = useState(
    defaultActiveKey || items[0]?.key || ''
  );

  const activeKey = controlledActiveKey ?? internalActiveKey;

  const handleTabChange = (key: string) => {
    if (!controlledActiveKey) {
      setInternalActiveKey(key);
    }
    onChange?.(key);
  };

  const contextValue: TabsContextValue = {
    activeKey,
    onChange: handleTabChange,
    variant,
    size,
    orientation,
  };

  // Container classes
  const containerClasses = [
    'w-full',
    orientation === 'vertical' ? 'flex' : '',
    className,
  ].filter(Boolean).join(' ');

  // Tab list classes
  const tabListClasses = [
    'flex',
    orientation === 'horizontal' ? 'border-b border-gray-200' : 'flex-col border-r border-gray-200 min-w-[200px]',
    isFitted && orientation === 'horizontal' ? 'w-full' : '',
    tabListClassName,
  ].filter(Boolean).join(' ');

  // Tab panel classes
  const tabPanelClasses = [
    'flex-1',
    orientation === 'horizontal' ? 'mt-4' : 'ml-4',
    tabPanelClassName,
  ].filter(Boolean).join(' ');

  const activeItem = items.find(item => item.key === activeKey);

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={containerClasses} data-testid="re-shell-tabs">
        {/* Tab List */}
        <div className={tabListClasses} role="tablist">
          {items.map((item) => (
            <Tab
              key={item.key}
              tabKey={item.key}
              label={item.label}
              icon={item.icon}
              disabled={item.disabled}
              isFitted={isFitted}
            />
          ))}
        </div>
        
        {/* Tab Panel */}
        <div className={tabPanelClasses}>
          {activeItem && (
            <TabPanel key={activeItem.key}>
              {activeItem.content}
            </TabPanel>
          )}
        </div>
      </div>
    </TabsContext.Provider>
  );
};

/**
 * Individual Tab component
 */
interface TabProps {
  tabKey: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  isFitted?: boolean;
}

const Tab: React.FC<TabProps> = ({ tabKey, label, icon, disabled = false, isFitted = false }) => {
  const { activeKey, onChange, variant, size } = useTabsContext();
  const isActive = activeKey === tabKey;

  // Size classes
  const sizeClasses = {
    sm: 'text-sm px-3 py-2',
    md: 'text-sm px-4 py-3',
    lg: 'text-base px-5 py-4',
  };

  // Base tab classes
  const baseClasses = [
    'inline-flex items-center space-x-2 font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    sizeClasses[size as keyof typeof sizeClasses],
    isFitted ? 'flex-1 justify-center' : '',
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
  ].filter(Boolean).join(' ');

  // Variant-specific classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'line':
        return [
          'border-b-2 -mb-px',
          isActive
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        ].join(' ');
      
      case 'enclosed':
        return [
          'border border-b-0 rounded-t-lg -mb-px',
          isActive
            ? 'border-gray-200 bg-white text-gray-900'
            : 'border-transparent text-gray-500 hover:text-gray-700',
        ].join(' ');
      
      case 'soft-rounded':
        return [
          'rounded-lg',
          isActive
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
        ].join(' ');
      
      case 'solid-rounded':
        return [
          'rounded-lg',
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
        ].join(' ');
      
      default:
        return '';
    }
  };

  const tabClasses = [baseClasses, getVariantClasses()].filter(Boolean).join(' ');

  const handleClick = () => {
    if (!disabled) {
      onChange(tabKey);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      className={tabClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${tabKey}`}
      id={`tab-${tabKey}`}
      tabIndex={isActive ? 0 : -1}
      data-testid={`tab-${tabKey}`}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  );
};

/**
 * Tab Panel component
 */
interface TabPanelProps {
  children: React.ReactNode;
}

const TabPanel: React.FC<TabPanelProps> = ({ children }) => {
  const { activeKey } = useTabsContext();

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${activeKey}`}
      aria-labelledby={`tab-${activeKey}`}
      data-testid={`tabpanel-${activeKey}`}
    >
      {children}
    </div>
  );
};

Tabs.displayName = 'Tabs';

export default Tabs;
