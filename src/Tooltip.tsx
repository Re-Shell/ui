import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface TooltipProps {
  /**
   * Tooltip content
   */
  content: React.ReactNode;
  
  /**
   * Tooltip placement
   */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  
  /**
   * Tooltip trigger
   */
  trigger?: 'hover' | 'click' | 'focus';
  
  /**
   * Delay before showing tooltip (ms)
   */
  delay?: number;
  
  /**
   * Whether tooltip is disabled
   */
  disabled?: boolean;
  
  /**
   * Custom arrow
   */
  showArrow?: boolean;
  
  /**
   * Tooltip size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Children element that triggers the tooltip
   */
  children: React.ReactElement;
  
  /**
   * Additional CSS class names for tooltip
   */
  className?: string;
  
  /**
   * Custom portal container
   */
  portalContainer?: HTMLElement;
}

/**
 * Tooltip component for Re-Shell UI
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  placement = 'top',
  trigger = 'hover',
  delay = 200,
  disabled = false,
  showArrow = true,
  size = 'md',
  children,
  className = '',
  portalContainer,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3',
  };

  // Arrow size classes
  const arrowSizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  // Calculate tooltip position
  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollX = window.pageXOffset;
    const scrollY = window.pageYOffset;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = triggerRect.top + scrollY - tooltipRect.height - 8;
        left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + scrollY + 8;
        left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left + scrollX - tooltipRect.width - 8;
        break;
      case 'right':
        top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + scrollX + 8;
        break;
    }

    // Keep tooltip within viewport
    const padding = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < padding) left = padding;
    if (left + tooltipRect.width > viewportWidth - padding) {
      left = viewportWidth - tooltipRect.width - padding;
    }
    if (top < padding) top = padding;
    if (top + tooltipRect.height > viewportHeight - padding) {
      top = viewportHeight - tooltipRect.height - padding;
    }

    setPosition({ top, left });
  };

  // Show tooltip
  const showTooltip = () => {
    if (disabled) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  // Hide tooltip
  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // Update position when visible
  useEffect(() => {
    if (isVisible) {
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
  }, [isVisible, placement]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Event handlers based on trigger type
  const getEventHandlers = () => {
    switch (trigger) {
      case 'hover':
        return {
          onMouseEnter: showTooltip,
          onMouseLeave: hideTooltip,
        };
      case 'click':
        return {
          onClick: () => {
            if (isVisible) {
              hideTooltip();
            } else {
              showTooltip();
            }
          },
        };
      case 'focus':
        return {
          onFocus: showTooltip,
          onBlur: hideTooltip,
        };
      default:
        return {};
    }
  };

  // Clone children with event handlers and ref
  const triggerElement = React.cloneElement(children, {
    ...getEventHandlers(),
    ref: (node: HTMLElement) => {
      if (triggerRef) {
        (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
      // Preserve original ref if it exists
      const originalRef = (children as any).ref;
      if (typeof originalRef === 'function') {
        originalRef(node);
      } else if (originalRef && typeof originalRef === 'object') {
        originalRef.current = node;
      }
    },
  });

  // Tooltip classes
  const tooltipClasses = [
    'absolute z-50 bg-gray-900 text-white rounded shadow-lg pointer-events-none',
    'transition-opacity duration-200',
    isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
    sizeClasses[size],
    className,
  ].filter(Boolean).join(' ');

  // Arrow classes
  const arrowClasses = [
    'absolute bg-gray-900 transform rotate-45',
    arrowSizeClasses[size],
  ].filter(Boolean).join(' ');

  // Arrow position
  const getArrowStyle = () => {
    const arrowSize = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
    const offset = arrowSize / 2;

    switch (placement) {
      case 'top':
        return {
          bottom: -offset,
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
        };
      case 'bottom':
        return {
          top: -offset,
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
        };
      case 'left':
        return {
          right: -offset,
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
        };
      case 'right':
        return {
          left: -offset,
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
        };
    }
  };

  const tooltipContent = (
    <div
      ref={tooltipRef}
      className={tooltipClasses}
      style={{
        top: position.top,
        left: position.left,
      }}
      role="tooltip"
      data-testid="re-shell-tooltip"
    >
      {content}
      {showArrow && (
        <div
          className={arrowClasses}
          style={getArrowStyle()}
        />
      )}
    </div>
  );

  return (
    <>
      {triggerElement}
      {isVisible && createPortal(
        tooltipContent,
        portalContainer || document.body
      )}
    </>
  );
};

Tooltip.displayName = 'Tooltip';

export default Tooltip;
