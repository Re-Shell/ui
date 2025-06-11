import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface DropdownItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

export interface DropdownProps {
  /**
   * Dropdown items
   */
  items: DropdownItem[];
  
  /**
   * Dropdown trigger element
   */
  trigger: React.ReactElement;
  
  /**
   * Dropdown placement
   */
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'left' | 'right';
  
  /**
   * Whether dropdown is disabled
   */
  disabled?: boolean;
  
  /**
   * Close dropdown on item click
   */
  closeOnClick?: boolean;
  
  /**
   * Close dropdown on outside click
   */
  closeOnOutsideClick?: boolean;
  
  /**
   * Dropdown size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Additional CSS class names for dropdown
   */
  className?: string;
  
  /**
   * Custom portal container
   */
  portalContainer?: HTMLElement;
  
  /**
   * Callback when dropdown opens/closes
   */
  onOpenChange?: (isOpen: boolean) => void;
}

/**
 * Dropdown component for Re-Shell UI
 */
export const Dropdown: React.FC<DropdownProps> = ({
  items,
  trigger,
  placement = 'bottom-start',
  disabled = false,
  closeOnClick = true,
  closeOnOutsideClick = true,
  size = 'md',
  className = '',
  portalContainer,
  onOpenChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Size classes
  const sizeClasses = {
    sm: 'text-sm py-1',
    md: 'text-sm py-2',
    lg: 'text-base py-3',
  };

  // Item size classes
  const itemSizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-3 text-base',
  };

  // Calculate dropdown position
  const calculatePosition = () => {
    if (!triggerRef.current || !dropdownRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdownRect = dropdownRef.current.getBoundingClientRect();
    const scrollX = window.pageXOffset;
    const scrollY = window.pageYOffset;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'bottom-start':
        top = triggerRect.bottom + scrollY + 4;
        left = triggerRect.left + scrollX;
        break;
      case 'bottom-end':
        top = triggerRect.bottom + scrollY + 4;
        left = triggerRect.right + scrollX - dropdownRect.width;
        break;
      case 'top-start':
        top = triggerRect.top + scrollY - dropdownRect.height - 4;
        left = triggerRect.left + scrollX;
        break;
      case 'top-end':
        top = triggerRect.top + scrollY - dropdownRect.height - 4;
        left = triggerRect.right + scrollX - dropdownRect.width;
        break;
      case 'left':
        top = triggerRect.top + scrollY + (triggerRect.height - dropdownRect.height) / 2;
        left = triggerRect.left + scrollX - dropdownRect.width - 4;
        break;
      case 'right':
        top = triggerRect.top + scrollY + (triggerRect.height - dropdownRect.height) / 2;
        left = triggerRect.right + scrollX + 4;
        break;
    }

    // Keep dropdown within viewport
    const padding = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < padding) left = padding;
    if (left + dropdownRect.width > viewportWidth - padding) {
      left = viewportWidth - dropdownRect.width - padding;
    }
    if (top < padding) top = padding;
    if (top + dropdownRect.height > viewportHeight - padding) {
      top = viewportHeight - dropdownRect.height - padding;
    }

    setPosition({ top, left });
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    if (disabled) return;
    
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    onOpenChange?.(newIsOpen);
  };

  // Close dropdown
  const closeDropdown = () => {
    setIsOpen(false);
    onOpenChange?.(false);
  };

  // Handle item click
  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    
    item.onClick?.();
    
    if (closeOnClick) {
      closeDropdown();
    }
  };

  // Handle outside click
  useEffect(() => {
    if (!isOpen || !closeOnOutsideClick) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        triggerRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeOnOutsideClick]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDropdown();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Update position when open
  useEffect(() => {
    if (isOpen) {
      calculatePosition();
      
      const handleResize = () => calculatePosition();
      const handleScroll = () => calculatePosition();
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isOpen, placement]);

  // Clone trigger with event handlers and ref
  const triggerElement = React.cloneElement(trigger, {
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleDropdown();
      trigger.props.onClick?.(e);
    },
    ref: (node: HTMLElement) => {
      if (triggerRef) {
        (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
      // Preserve original ref if it exists
      const originalRef = (trigger as any).ref;
      if (typeof originalRef === 'function') {
        originalRef(node);
      } else if (originalRef && typeof originalRef === 'object') {
        originalRef.current = node;
      }
    },
  });

  // Dropdown classes
  const dropdownClasses = [
    'absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg',
    'min-w-[160px] max-w-[320px]',
    'transition-all duration-200 origin-top',
    isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none',
    sizeClasses[size],
    className,
  ].filter(Boolean).join(' ');

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className={dropdownClasses}
      style={{
        top: position.top,
        left: position.left,
      }}
      role="menu"
      data-testid="re-shell-dropdown"
    >
      {items.map((item, index) => {
        if (item.divider) {
          return (
            <div
              key={item.key || `divider-${index}`}
              className="border-t border-gray-200 my-1"
            />
          );
        }

        return (
          <button
            key={item.key}
            className={[
              'w-full flex items-center space-x-2 transition-colors',
              'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
              'first:rounded-t-lg last:rounded-b-lg',
              item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              itemSizeClasses[size],
            ].filter(Boolean).join(' ')}
            disabled={item.disabled}
            onClick={() => handleItemClick(item)}
            role="menuitem"
          >
            {item.icon && (
              <span className="flex-shrink-0">
                {item.icon}
              </span>
            )}
            <span className="flex-1 text-left">{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {triggerElement}
      {isOpen && createPortal(
        dropdownContent,
        portalContainer || document.body
      )}
    </>
  );
};

Dropdown.displayName = 'Dropdown';

export default Dropdown;
