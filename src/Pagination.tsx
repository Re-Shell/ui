import React from 'react';
import { Icon } from './Icon';

export interface PaginationProps {
  /**
   * Current page number (1-based)
   */
  currentPage: number;
  
  /**
   * Total number of pages
   */
  totalPages: number;
  
  /**
   * Page change handler
   */
  onPageChange: (page: number) => void;
  
  /**
   * Number of page buttons to show around current page
   */
  siblingCount?: number;
  
  /**
   * Whether to show first/last page buttons
   */
  showFirstLast?: boolean;
  
  /**
   * Whether to show previous/next buttons
   */
  showPrevNext?: boolean;
  
  /**
   * Pagination size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Pagination variant
   */
  variant?: 'default' | 'outlined' | 'minimal';
  
  /**
   * Whether pagination is disabled
   */
  disabled?: boolean;
  
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Pagination component for Re-Shell UI
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  showPrevNext = true,
  size = 'md',
  variant = 'default',
  disabled = false,
  className = '',
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3',
  };

  // Icon size classes
  const iconSizeClasses = {
    sm: 'sm',
    md: 'sm',
    lg: 'md',
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    // Always show first page
    if (showFirstLast) {
      pages.push(1);
    }
    
    // Calculate start and end of sibling pages
    const startPage = Math.max(1, currentPage - siblingCount);
    const endPage = Math.min(totalPages, currentPage + siblingCount);
    
    // Add ellipsis after first page if needed
    if (startPage > (showFirstLast ? 2 : 1)) {
      if (startPage > (showFirstLast ? 3 : 2)) {
        pages.push('...');
      }
    }
    
    // Add sibling pages
    for (let i = startPage; i <= endPage; i++) {
      if (!showFirstLast || (i !== 1 && i !== totalPages)) {
        pages.push(i);
      } else if (i === 1 || i === totalPages) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - (showFirstLast ? 1 : 0)) {
      if (endPage < totalPages - (showFirstLast ? 2 : 1)) {
        pages.push('...');
      }
    }
    
    // Always show last page
    if (showFirstLast && totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Button base classes
  const getButtonClasses = (isActive = false, isDisabled = false) => {
    const baseClasses = [
      'inline-flex items-center justify-center transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      sizeClasses[size],
    ];

    if (variant === 'default') {
      baseClasses.push(
        'border',
        isActive
          ? 'bg-blue-600 border-blue-600 text-white'
          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
      );
    } else if (variant === 'outlined') {
      baseClasses.push(
        'border-2',
        isActive
          ? 'bg-blue-600 border-blue-600 text-white'
          : 'bg-transparent border-gray-300 text-gray-700 hover:border-gray-400'
      );
    } else if (variant === 'minimal') {
      baseClasses.push(
        isActive
          ? 'bg-blue-600 text-white'
          : 'bg-transparent text-gray-700 hover:bg-gray-100'
      );
    }

    if (isDisabled || disabled) {
      baseClasses.push('opacity-50 cursor-not-allowed');
    } else {
      baseClasses.push('cursor-pointer');
    }

    return baseClasses.filter(Boolean).join(' ');
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (disabled || page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    onPageChange(page);
  };

  // Container classes
  const containerClasses = [
    'flex items-center space-x-1',
    className,
  ].filter(Boolean).join(' ');

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className={containerClasses} aria-label="Pagination" data-testid="re-shell-pagination">
      {/* First page button */}
      {showFirstLast && (
        <button
          className={getButtonClasses(false, currentPage === 1)}
          onClick={() => handlePageChange(1)}
          disabled={disabled || currentPage === 1}
          aria-label="Go to first page"
        >
          <Icon name="chevronLeft" size={iconSizeClasses[size] as any} />
          <Icon name="chevronLeft" size={iconSizeClasses[size] as any} />
        </button>
      )}

      {/* Previous page button */}
      {showPrevNext && (
        <button
          className={getButtonClasses(false, currentPage === 1)}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={disabled || currentPage === 1}
          aria-label="Go to previous page"
        >
          <Icon name="chevronLeft" size={iconSizeClasses[size] as any} />
        </button>
      )}

      {/* Page number buttons */}
      {pageNumbers.map((page, index) => {
        if (page === '...') {
          return (
            <span
              key={`ellipsis-${index}`}
              className={`${sizeClasses[size]} text-gray-500`}
            >
              ...
            </span>
          );
        }

        const pageNumber = page as number;
        const isActive = pageNumber === currentPage;

        return (
          <button
            key={pageNumber}
            className={getButtonClasses(isActive)}
            onClick={() => handlePageChange(pageNumber)}
            disabled={disabled}
            aria-label={`Go to page ${pageNumber}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {pageNumber}
          </button>
        );
      })}

      {/* Next page button */}
      {showPrevNext && (
        <button
          className={getButtonClasses(false, currentPage === totalPages)}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={disabled || currentPage === totalPages}
          aria-label="Go to next page"
        >
          <Icon name="chevronRight" size={iconSizeClasses[size] as any} />
        </button>
      )}

      {/* Last page button */}
      {showFirstLast && (
        <button
          className={getButtonClasses(false, currentPage === totalPages)}
          onClick={() => handlePageChange(totalPages)}
          disabled={disabled || currentPage === totalPages}
          aria-label="Go to last page"
        >
          <Icon name="chevronRight" size={iconSizeClasses[size] as any} />
          <Icon name="chevronRight" size={iconSizeClasses[size] as any} />
        </button>
      )}
    </nav>
  );
};

Pagination.displayName = 'Pagination';

export default Pagination;
