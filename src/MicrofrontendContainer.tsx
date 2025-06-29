import React, { Suspense, ComponentType, ErrorInfo, ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';
import LoadingFallback from './LoadingFallback';

export interface MicrofrontendConfig {
  /**
   * Unique identifier for the microfrontend
   */
  name: string;
  
  /**
   * Remote entry URL for Module Federation
   */
  remoteEntry?: string;
  
  /**
   * Module scope for dynamic imports
   */
  scope?: string;
  
  /**
   * Module name to import
   */
  module?: string;
  
  /**
   * Fallback component URL for iframe mode
   */
  fallbackUrl?: string;
  
  /**
   * Props to pass to the microfrontend
   */
  props?: Record<string, any>;
  
  /**
   * CSS isolation mode
   */
  isolation?: 'shadow-dom' | 'css-prefix' | 'iframe' | 'none';
  
  /**
   * Timeout for loading the microfrontend (ms)
   */
  timeout?: number;
  
  /**
   * Whether to preload the microfrontend
   */
  preload?: boolean;
}

export interface MicrofrontendContainerProps {
  /**
   * Microfrontend configuration
   */
  config: MicrofrontendConfig;
  
  /**
   * Custom loading component
   */
  loading?: ComponentType<any>;
  
  /**
   * Custom error component
   */
  errorComponent?: ComponentType<{ error: Error; retry: () => void }>;
  
  /**
   * Error callback
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  
  /**
   * Load callback
   */
  onLoad?: (name: string) => void;
  
  /**
   * CSS class for the container
   */
  className?: string;
  
  /**
   * Container style
   */
  style?: React.CSSProperties;
  
  /**
   * Whether to retry on error
   */
  enableRetry?: boolean;
  
  /**
   * Maximum retry attempts
   */
  maxRetries?: number;
  
  /**
   * Retry delay in milliseconds
   */
  retryDelay?: number;
}

interface MicrofrontendContainerState {
  Component: ComponentType<any> | null;
  error: Error | null;
  retryCount: number;
  isLoading: boolean;
}

/**
 * Container component for loading and managing microfrontends
 * Supports Module Federation, iframe fallback, and error handling
 */
export class MicrofrontendContainer extends React.Component<
  MicrofrontendContainerProps,
  MicrofrontendContainerState
> {
  private timeoutId: NodeJS.Timeout | null = null;
  private containerRef = React.createRef<HTMLDivElement>();

  constructor(props: MicrofrontendContainerProps) {
    super(props);
    this.state = {
      Component: null,
      error: null,
      retryCount: 0,
      isLoading: true,
    };
  }

  componentDidMount() {
    this.loadMicrofrontend();
  }

  componentDidUpdate(prevProps: MicrofrontendContainerProps) {
    if (
      prevProps.config.name !== this.props.config.name ||
      prevProps.config.remoteEntry !== this.props.config.remoteEntry ||
      prevProps.config.module !== this.props.config.module
    ) {
      this.loadMicrofrontend();
    }
  }

  componentWillUnmount() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  private loadMicrofrontend = async (): Promise<void> => {
    const { config, onLoad, onError } = this.props;
    
    this.setState({ isLoading: true, error: null });

    try {
      // Set timeout for loading
      if (config.timeout) {
        this.timeoutId = setTimeout(() => {
          throw new Error(`Microfrontend "${config.name}" failed to load within ${config.timeout}ms`);
        }, config.timeout);
      }

      let Component: ComponentType<any>;

      if (config.scope && config.module) {
        // Module Federation loading
        Component = await this.loadModuleFederationComponent();
      } else if (config.remoteEntry) {
        // Dynamic script loading
        Component = await this.loadDynamicComponent();
      } else {
        throw new Error(`Invalid configuration for microfrontend "${config.name}"`);
      }

      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }

      this.setState({
        Component,
        error: null,
        isLoading: false,
        retryCount: 0,
      });

      onLoad?.(config.name);
    } catch (error) {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }

      const err = error instanceof Error ? error : new Error(String(error));
      
      this.setState({
        Component: null,
        error: err,
        isLoading: false,
      });

      onError?.(err, { componentStack: '' });
    }
  };

  private loadModuleFederationComponent = async (): Promise<ComponentType<any>> => {
    const { config } = this.props;
    
    if (!config.scope || !config.module) {
      throw new Error('Module Federation requires scope and module');
    }

    // Load the remote container
    const container = (window as Record<string, any>)[config.scope];
    
    if (!container) {
      throw new Error(`Module Federation container "${config.scope}" not found`);
    }

    // Initialize the container if needed
    await container.init((window as any).__webpack_share_scopes__?.default || {});

    // Load the module
    const factory = await container.get(config.module);
    const Module = factory();

    return Module.default || Module;
  };

  private loadDynamicComponent = async (): Promise<ComponentType<any>> => {
    const { config } = this.props;
    
    if (!config.remoteEntry) {
      throw new Error('Dynamic loading requires remoteEntry URL');
    }

    // Dynamically load the script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = config.remoteEntry;

    return new Promise((resolve, reject) => {
      script.onload = async () => {
        try {
          const Component = await this.loadModuleFederationComponent();
          resolve(Component);
        } catch (error) {
          reject(error);
        }
      };

      script.onerror = () => {
        reject(new Error(`Failed to load script: ${config.remoteEntry}`));
      };

      document.head.appendChild(script);
    });
  };

  private handleRetry = (): void => {
    const { enableRetry = true, maxRetries = 3, retryDelay = 1000 } = this.props;
    
    if (!enableRetry || this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1,
    }));

    setTimeout(() => {
      this.loadMicrofrontend();
    }, retryDelay);
  };

  private renderIframeFallback = (): ReactNode => {
    const { config, className, style } = this.props;
    
    if (!config.fallbackUrl) {
      return null;
    }

    return (
      <iframe
        src={config.fallbackUrl}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          ...style,
        }}
        title={`Microfrontend: ${config.name}`}
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    );
  };

  private renderContent = (): ReactNode => {
    const { Component, error, isLoading } = this.state;
    const { config, loading: LoadingComponent, errorComponent: ErrorComponent, enableRetry = true } = this.props;

    if (isLoading) {
      return LoadingComponent ? (
        <LoadingComponent />
      ) : (
        <LoadingFallback message={`Loading ${config.name}...`} />
      );
    }

    if (error) {
      if (config.fallbackUrl) {
        return this.renderIframeFallback();
      }

      return ErrorComponent ? (
        <ErrorComponent error={error} retry={this.handleRetry} />
      ) : (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <h3 className="text-red-800 font-semibold">
            Failed to load microfrontend: {config.name}
          </h3>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
          {enableRetry && (
            <button
              onClick={this.handleRetry}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          )}
        </div>
      );
    }

    if (!Component) {
      return null;
    }

    return <Component {...config.props} />;
  };

  render() {
    const { className, style, onError } = this.props;
    const content = this.renderContent();

    return (
      <ErrorBoundary
        onError={onError}
        fallback={({ error, retry }) => (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <h3 className="text-red-800 font-semibold">
              Microfrontend Error
            </h3>
            <p className="text-red-600 text-sm mt-1">{error.message}</p>
            <button
              onClick={retry}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}
      >
        <div
          ref={this.containerRef}
          className={className}
          style={style}
          data-microfrontend={this.props.config.name}
        >
          <Suspense
            fallback={
              <LoadingFallback message={`Loading ${this.props.config.name}...`} />
            }
          >
            {content}
          </Suspense>
        </div>
      </ErrorBoundary>
    );
  }
}

// Functional component wrapper for easier usage
export const MicrofrontendWrapper: React.FC<MicrofrontendContainerProps> = (props) => {
  return <MicrofrontendContainer {...props} />;
};

export default MicrofrontendContainer;