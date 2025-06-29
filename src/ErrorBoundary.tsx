import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icon } from './Icon';

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export interface ErrorBoundaryProps {
  /**
   * Fallback component to render when an error occurs
   */
  fallback?: ({ error, retry, errorId }: { 
    error: Error; 
    retry: () => void; 
    errorId: string; 
  }) => ReactNode;
  
  /**
   * Custom error component
   */
  errorComponent?: React.ComponentType<{
    error: Error;
    errorInfo: ErrorInfo;
    retry: () => void;
    errorId: string;
  }>;
  
  /**
   * Error callback for logging/reporting
   */
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  
  /**
   * Recovery callback
   */
  onRecover?: () => void;
  
  /**
   * Whether to show error details in development
   */
  showErrorDetails?: boolean;
  
  /**
   * Whether to enable retry functionality
   */
  enableRetry?: boolean;
  
  /**
   * Isolation level for microfrontend errors
   */
  isolationLevel?: 'component' | 'microfrontend' | 'application';
  
  /**
   * Identifier for the microfrontend
   */
  microfrontendName?: string;
  
  /**
   * Maximum number of retries
   */
  maxRetries?: number;
  
  /**
   * Children to render
   */
  children: ReactNode;
  
  /**
   * CSS class name
   */
  className?: string;
}

/**
 * Enhanced Error Boundary for microfrontend applications
 * Provides isolation, retry mechanisms, and detailed error reporting
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, microfrontendName, isolationLevel = 'component' } = this.props;
    const errorId = this.state.errorId;

    // Enhanced error information for microfrontends
    const enhancedError = {
      ...error,
      microfrontendName,
      isolationLevel,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      stack: error.stack,
    };

    // Update state with error info
    this.setState({ errorInfo });

    // Log error for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ErrorBoundary caught an error (ID: ${errorId})`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Microfrontend:', microfrontendName);
      console.error('Isolation Level:', isolationLevel);
      console.groupEnd();
    }

    // Call error callback
    onError?.(enhancedError as Error, errorInfo, errorId);

    // Report to error tracking service
    this.reportError(enhancedError, errorInfo, errorId);
  }

  componentWillUnmount(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private reportError = (error: any, errorInfo: ErrorInfo, errorId: string): void => {
    // Integration with error reporting services
    try {
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: {
            component: 'ErrorBoundary',
            microfrontend: this.props.microfrontendName,
            isolationLevel: this.props.isolationLevel,
            errorId,
          },
          extra: {
            errorInfo,
            retryCount: this.retryCount,
          },
        });
      }

      // Custom reporting logic can be added here
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track('Microfrontend Error', {
          errorId,
          microfrontendName: this.props.microfrontendName,
          isolationLevel: this.props.isolationLevel,
          errorMessage: error.message,
          retryCount: this.retryCount,
        });
      }
    } catch (reportingError) {
      console.warn('Failed to report error:', reportingError);
    }
  };

  private handleRetry = (): void => {
    const { maxRetries = 3, onRecover } = this.props;
    
    if (this.retryCount >= maxRetries) {
      console.warn(`Maximum retry attempts (${maxRetries}) reached for ErrorBoundary`);
      return;
    }

    this.retryCount++;
    
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });

    onRecover?.();

    // Add a small delay to prevent immediate re-error
    this.retryTimeoutId = setTimeout(() => {
      this.forceUpdate();
    }, 100);
  };

  private renderErrorDetails = (): ReactNode => {
    const { error, errorInfo, errorId } = this.state;
    const { showErrorDetails = process.env.NODE_ENV === 'development' } = this.props;

    if (!showErrorDetails || !error || !errorInfo) {
      return null;
    }

    return (
      <details className="mt-4 p-3 bg-gray-100 rounded border">
        <summary className="cursor-pointer font-medium text-gray-700">
          Error Details (ID: {errorId})
        </summary>
        <div className="mt-2 space-y-2 text-xs font-mono">
          <div>
            <strong>Error:</strong>
            <pre className="mt-1 p-2 bg-white rounded border overflow-auto">
              {error.stack}
            </pre>
          </div>
          <div>
            <strong>Component Stack:</strong>
            <pre className="mt-1 p-2 bg-white rounded border overflow-auto">
              {errorInfo.componentStack}
            </pre>
          </div>
          {this.props.microfrontendName && (
            <div>
              <strong>Microfrontend:</strong> {this.props.microfrontendName}
            </div>
          )}
          <div>
            <strong>Retry Count:</strong> {this.retryCount}
          </div>
        </div>
      </details>
    );
  };

  private renderDefaultError = (): ReactNode => {
    const { error } = this.state;
    const { enableRetry = true, microfrontendName, maxRetries = 3 } = this.props;
    
    const canRetry = enableRetry && this.retryCount < maxRetries;

    return (
      <div className="p-6 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Icon 
              name="warning" 
              size="lg" 
              className="text-red-500" 
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              {microfrontendName 
                ? `Error in ${microfrontendName}` 
                : 'Something went wrong'
              }
            </h3>
            <p className="text-red-700 mb-4">
              {error?.message || 'An unexpected error occurred in this component.'}
            </p>
            
            <div className="flex items-center space-x-3">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Try Again ({maxRetries - this.retryCount} attempts left)
                </button>
              )}
              
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-100 transition-colors text-sm font-medium"
              >
                Reload Page
              </button>
            </div>

            {!canRetry && (
              <p className="mt-3 text-sm text-red-600">
                Maximum retry attempts reached. Please reload the page or contact support.
              </p>
            )}

            {this.renderErrorDetails()}
          </div>
        </div>
      </div>
    );
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { fallback, errorComponent: ErrorComponent, className } = this.props;
    const { error, errorInfo, errorId } = this.state;

    if (!error) {
      return null;
    }

    let errorContent: ReactNode;

    if (fallback) {
      errorContent = fallback({
        error,
        retry: this.handleRetry,
        errorId,
      });
    } else if (ErrorComponent && errorInfo) {
      errorContent = (
        <ErrorComponent
          error={error}
          errorInfo={errorInfo}
          retry={this.handleRetry}
          errorId={errorId}
        />
      );
    } else {
      errorContent = this.renderDefaultError();
    }

    return (
      <div 
        className={className}
        data-error-boundary
        data-microfrontend={this.props.microfrontendName}
        data-error-id={errorId}
      >
        {errorContent}
      </div>
    );
  }
}

// Hook for functional components to access error boundary functionality
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

export default ErrorBoundary;