import React, { Suspense, lazy, ComponentType, ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';
import LoadingFallback from './LoadingFallback';

export interface ModuleFederationConfig {
  /**
   * Remote name defined in Module Federation config
   */
  remoteName: string;
  
  /**
   * Exposed module path
   */
  exposedModule: string;
  
  /**
   * Remote entry URL (optional, for dynamic loading)
   */
  remoteEntry?: string;
  
  /**
   * Scope name for the remote
   */
  scope?: string;
  
  /**
   * Fallback URL for iframe loading
   */
  fallbackUrl?: string;
  
  /**
   * Props to pass to the federated component
   */
  props?: Record<string, any>;
}

export interface FederatedComponentProps {
  /**
   * Module Federation configuration
   */
  config: ModuleFederationConfig;
  
  /**
   * Custom loading component
   */
  loading?: ComponentType<any>;
  
  /**
   * Custom error component
   */
  errorComponent?: ComponentType<{ error: Error; retry: () => void }>;
  
  /**
   * Loading timeout in milliseconds
   */
  timeout?: number;
  
  /**
   * CSS class name for the container
   */
  className?: string;
  
  /**
   * Container style
   */
  style?: React.CSSProperties;
  
  /**
   * Enable retry on error
   */
  enableRetry?: boolean;
  
  /**
   * Callback for successful load
   */
  onLoad?: (componentName: string) => void;
  
  /**
   * Callback for load error
   */
  onError?: (error: Error) => void;
}

/**
 * Federated component loader using Module Federation
 */
export const FederatedComponent: React.FC<FederatedComponentProps> = ({
  config,
  loading: LoadingComponent,
  errorComponent: ErrorComponent,
  timeout = 10000,
  className,
  style,
  enableRetry = true,
  onLoad,
  onError,
}) => {
  const [Component, setComponent] = React.useState<ComponentType<any> | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let isCancelled = false;
    let timeoutId: NodeJS.Timeout;

    const loadComponent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Set timeout
        timeoutId = setTimeout(() => {
          if (!isCancelled) {
            throw new Error(`Timeout loading federated component: ${config.remoteName}/${config.exposedModule}`);
          }
        }, timeout);

        const loadedComponent = await loadFederatedComponent(config);
        
        if (!isCancelled) {
          clearTimeout(timeoutId);
          setComponent(() => loadedComponent);
          setIsLoading(false);
          onLoad?.(config.exposedModule);
        }
      } catch (err) {
        if (!isCancelled) {
          clearTimeout(timeoutId);
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          setIsLoading(false);
          onError?.(error);
        }
      }
    };

    loadComponent();

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [config, timeout, onLoad, onError]);

  const handleRetry = React.useCallback(() => {
    setComponent(null);
    setError(null);
    setIsLoading(true);
  }, []);

  if (isLoading) {
    return LoadingComponent ? (
      <LoadingComponent />
    ) : (
      <LoadingFallback 
        message={`Loading ${config.remoteName}...`}
        microfrontendName={config.remoteName}
        showMicrofrontendName
        timeout={timeout / 1000}
      />
    );
  }

  if (error) {
    return ErrorComponent ? (
      <ErrorComponent error={error} retry={handleRetry} />
    ) : (
      <ErrorBoundary
        microfrontendName={config.remoteName}
        enableRetry={enableRetry}
        fallback={({ error, retry }) => (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <h3 className="text-red-800 font-semibold">
              Failed to load federated component
            </h3>
            <p className="text-red-600 text-sm mt-1">{error.message}</p>
            {enableRetry && (
              <button
                onClick={retry}
                className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Retry
              </button>
            )}
          </div>
        )}
      >
        <div>Component failed to load</div>
      </ErrorBoundary>
    );
  }

  if (!Component) {
    return null;
  }

  return (
    <div className={className} style={style}>
      <ErrorBoundary
        microfrontendName={config.remoteName}
        isolationLevel="microfrontend"
      >
        <Component {...config.props} />
      </ErrorBoundary>
    </div>
  );
};

/**
 * Load a federated component dynamically
 */
export const loadFederatedComponent = async (
  config: ModuleFederationConfig
): Promise<ComponentType<any>> => {
  const { remoteName, exposedModule, remoteEntry, scope } = config;

  try {
    // Method 1: Direct Module Federation import (build-time known remotes)
    if (!remoteEntry) {
      const module = await import(`${remoteName}/${exposedModule}`);
      return module.default || module;
    }

    // Method 2: Dynamic script loading with Module Federation
    await loadRemoteEntry(remoteEntry);
    
    const containerScope = scope || remoteName;
    const container = (window as Record<string, any>)[containerScope];
    
    if (!container) {
      throw new Error(`Remote container "${containerScope}" not found`);
    }

    // Initialize the container
    await container.init((globalThis as any).__webpack_share_scopes__?.default);
    
    // Get the exposed module
    const factory = await container.get(exposedModule);
    const Module = factory();
    
    return Module.default || Module;
  } catch (error) {
    console.error(`Failed to load federated component ${remoteName}/${exposedModule}:`, error);
    throw error;
  }
};

/**
 * Load remote entry script dynamically
 */
const loadRemoteEntry = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = url;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load remote entry: ${url}`));

    document.head.appendChild(script);
  });
};

/**
 * Higher-order component for wrapping federated components
 */
export const withModuleFederation = <P extends object>(
  config: ModuleFederationConfig,
  options?: {
    loading?: ComponentType<any>;
    errorComponent?: ComponentType<{ error: Error; retry: () => void }>;
    timeout?: number;
  }
) => {
  return (WrappedComponent: ComponentType<P>) => {
    const FederatedWrapper: React.FC<P> = (props) => {
      return (
        <FederatedComponent
          config={{ ...config, props }}
          loading={options?.loading}
          errorComponent={options?.errorComponent}
          timeout={options?.timeout}
        />
      );
    };

    FederatedWrapper.displayName = `withModuleFederation(${WrappedComponent.displayName || WrappedComponent.name})`;
    
    return FederatedWrapper;
  };
};

/**
 * Hook for loading federated components
 */
export const useFederatedComponent = (config: ModuleFederationConfig) => {
  const [component, setComponent] = React.useState<ComponentType<any> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const loadComponent = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedComponent = await loadFederatedComponent(config);
      setComponent(() => loadedComponent);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [config]);

  React.useEffect(() => {
    loadComponent();
  }, [loadComponent]);

  return {
    component,
    loading,
    error,
    retry: loadComponent,
  };
};

/**
 * Remote component with lazy loading support
 */
export const createLazyFederatedComponent = (config: ModuleFederationConfig) => {
  return lazy(() => 
    loadFederatedComponent(config).then(Component => ({ default: Component }))
  );
};

/**
 * Federated route component for routing integration
 */
export interface FederatedRouteProps {
  config: ModuleFederationConfig;
  loading?: ComponentType<any>;
  errorComponent?: ComponentType<{ error: Error; retry: () => void }>;
  fallback?: ReactNode;
}

export const FederatedRoute: React.FC<FederatedRouteProps> = ({
  config,
  loading,
  errorComponent,
  fallback,
}) => {
  const LazyComponent = React.useMemo(
    () => createLazyFederatedComponent(config),
    [config]
  );

  return (
    <ErrorBoundary
      microfrontendName={config.remoteName}
      isolationLevel="microfrontend"
    >
      <Suspense 
        fallback={
          fallback || 
          (loading ? React.createElement(loading) : <LoadingFallback microfrontendName={config.remoteName} />)
        }
      >
        <LazyComponent {...config.props} />
      </Suspense>
    </ErrorBoundary>
  );
};

export default FederatedComponent;