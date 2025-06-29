import React from 'react';
import { Spinner } from './Spinner';
import { Progress } from './Progress';

export interface LoadingFallbackProps {
  /**
   * Loading message to display
   */
  message?: string;
  
  /**
   * Type of loading indicator
   */
  variant?: 'spinner' | 'skeleton' | 'progress' | 'pulse' | 'dots';
  
  /**
   * Size of the loading indicator
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Progress value (0-100) for progress variant
   */
  progress?: number;
  
  /**
   * Whether to show the microfrontend name
   */
  showMicrofrontendName?: boolean;
  
  /**
   * Microfrontend name for display
   */
  microfrontendName?: string;
  
  /**
   * Custom loading timeout in seconds
   */
  timeout?: number;
  
  /**
   * Callback when timeout is reached
   */
  onTimeout?: () => void;
  
  /**
   * Whether to show estimated time
   */
  showEstimatedTime?: boolean;
  
  /**
   * Minimum height for the loading area
   */
  minHeight?: string | number;
  
  /**
   * Custom CSS class
   */
  className?: string;
  
  /**
   * Custom style
   */
  style?: React.CSSProperties;
  
  /**
   * Whether to center content vertically
   */
  centerVertically?: boolean;
  
  /**
   * Background opacity (0-1)
   */
  backgroundOpacity?: number;
}

/**
 * Loading fallback component for microfrontends
 * Provides various loading states and animations
 */
export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = 'Loading...',
  variant = 'spinner',
  size = 'md',
  progress,
  showMicrofrontendName = false,
  microfrontendName,
  timeout,
  onTimeout,
  showEstimatedTime = false,
  minHeight = '200px',
  className = '',
  style,
  centerVertically = true,
  backgroundOpacity = 0.05,
}) => {
  const [elapsedTime, setElapsedTime] = React.useState(0);
  const [timedOut, setTimedOut] = React.useState(false);
  
  React.useEffect(() => {
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    let timeoutId: NodeJS.Timeout | undefined;
    
    if (timeout) {
      timeoutId = setTimeout(() => {
        setTimedOut(true);
        onTimeout?.();
      }, timeout * 1000);
    }

    return () => {
      clearInterval(interval);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeout, onTimeout]);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const containerClasses = [
    'flex flex-col items-center justify-center p-6 transition-opacity duration-300',
    centerVertically ? 'min-h-full' : '',
    sizeClasses[size],
    className,
  ].filter(Boolean).join(' ');

  const renderLoadingIndicator = () => {
    switch (variant) {
      case 'spinner':
        return <Spinner size={size} className="mb-4" />;
        
      case 'progress':
        return (
          <div className="w-full max-w-xs mb-4">
            <Progress 
              value={progress || (elapsedTime * 10) % 100} 
              className="mb-2" 
            />
            {progress !== undefined && (
              <div className="text-center text-sm text-gray-500">
                {Math.round(progress)}%
              </div>
            )}
          </div>
        );
        
      case 'skeleton':
        return (
          <div className="w-full max-w-md space-y-3 mb-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded" style={{ width: `${100 - i * 15}%` }}></div>
              </div>
            ))}
          </div>
        );
        
      case 'pulse':
        return (
          <div className="w-16 h-16 mb-4">
            <div className="w-full h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full animate-pulse"></div>
          </div>
        );
        
      case 'dots':
        return (
          <div className="flex space-x-2 mb-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
        );
        
      default:
        return <Spinner size={size} className="mb-4" />;
    }
  };

  const formatElapsedTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getEstimatedTimeMessage = (): string => {
    if (elapsedTime < 3) return 'Just a moment...';
    if (elapsedTime < 10) return 'Loading resources...';
    if (elapsedTime < 30) return 'Almost ready...';
    return 'Taking longer than expected...';
  };

  if (timedOut) {
    return (
      <div 
        className={containerClasses}
        style={{ 
          minHeight, 
          backgroundColor: `rgba(239, 68, 68, ${backgroundOpacity})`,
          ...style 
        }}
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Loading Timeout</h3>
          <p className="text-red-600 mb-4">
            {microfrontendName 
              ? `${microfrontendName} is taking longer than expected to load.`
              : 'The component is taking longer than expected to load.'
            }
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={containerClasses}
      style={{ 
        minHeight, 
        backgroundColor: `rgba(168, 85, 247, ${backgroundOpacity})`,
        ...style 
      }}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {renderLoadingIndicator()}
      
      <div className="text-center">
        <h3 className="font-medium text-gray-900 mb-1">
          {showMicrofrontendName && microfrontendName 
            ? `Loading ${microfrontendName}...`
            : message
          }
        </h3>
        
        {showEstimatedTime && (
          <p className="text-sm text-gray-600 mb-2">
            {getEstimatedTimeMessage()}
          </p>
        )}
        
        <div className="text-xs text-gray-500">
          {elapsedTime > 0 && `${formatElapsedTime(elapsedTime)}`}
          {timeout && ` / ${timeout}s timeout`}
        </div>
      </div>

      {/* Additional loading hints */}
      {elapsedTime > 10 && (
        <div className="mt-4 text-center max-w-md">
          <p className="text-xs text-gray-500">
            Large microfrontends may take longer to load on slower connections.
          </p>
        </div>
      )}
    </div>
  );
};

// Skeleton loader for specific UI elements
export const SkeletonLoader: React.FC<{
  lines?: number;
  className?: string;
  width?: string | number;
  height?: string | number;
}> = ({ 
  lines = 3, 
  className = '', 
  width = '100%', 
  height = '1rem' 
}) => {
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className="bg-gray-200 rounded"
          style={{
            width: i === lines - 1 ? '75%' : width,
            height,
          }}
        />
      ))}
    </div>
  );
};

// Card skeleton for loading card-based layouts
export const CardSkeleton: React.FC<{
  className?: string;
  showImage?: boolean;
  showActions?: boolean;
}> = ({ 
  className = '', 
  showImage = true, 
  showActions = true 
}) => {
  return (
    <div className={`p-6 border border-gray-200 rounded-lg bg-white ${className}`}>
      <div className="animate-pulse">
        {showImage && (
          <div className="w-full h-48 bg-gray-200 rounded-lg mb-4" />
        )}
        
        <div className="h-6 bg-gray-200 rounded mb-3" />
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
        
        {showActions && (
          <div className="flex space-x-2">
            <div className="h-10 w-20 bg-gray-200 rounded" />
            <div className="h-10 w-16 bg-gray-200 rounded" />
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingFallback;