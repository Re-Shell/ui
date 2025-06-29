import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { FederatedRoute } from './ModuleFederation';
import { useSharedState, useSharedEvents } from './SharedStateProvider';

export interface RouteConfig {
  /**
   * Route path pattern
   */
  path: string;
  
  /**
   * Microfrontend configuration for this route
   */
  microfrontend?: {
    remoteName: string;
    exposedModule: string;
    remoteEntry?: string;
    props?: Record<string, any>;
  };
  
  /**
   * Direct component for this route
   */
  component?: React.ComponentType<any>;
  
  /**
   * Route metadata
   */
  meta?: {
    title?: string;
    description?: string;
    requiresAuth?: boolean;
    permissions?: string[];
    preload?: boolean;
  };
  
  /**
   * Child routes
   */
  children?: RouteConfig[];
  
  /**
   * Route guards
   */
  guards?: Array<(to: RouteConfig, from?: RouteConfig) => boolean | Promise<boolean>>;
}

export interface NavigationContextValue {
  /**
   * Current route
   */
  currentRoute: RouteConfig | null;
  
  /**
   * Navigation history
   */
  history: RouteConfig[];
  
  /**
   * Navigate to a path
   */
  navigate: (path: string, options?: NavigationOptions) => void;
  
  /**
   * Go back in history
   */
  goBack: () => void;
  
  /**
   * Go forward in history
   */
  goForward: () => void;
  
  /**
   * Check if navigation is in progress
   */
  isNavigating: boolean;
  
  /**
   * Register a route guard
   */
  addGuard: (guard: RouteGuard) => () => void;
  
  /**
   * Get all registered routes
   */
  getRoutes: () => RouteConfig[];
}

export interface NavigationOptions {
  /**
   * Replace current history entry instead of pushing
   */
  replace?: boolean;
  
  /**
   * State to pass with navigation
   */
  state?: any;
  
  /**
   * Skip route guards
   */
  skipGuards?: boolean;
}

export type RouteGuard = (to: RouteConfig, from?: RouteConfig) => boolean | Promise<boolean>;

export interface NavigationShellProps {
  /**
   * Route configurations
   */
  routes: RouteConfig[];
  
  /**
   * Default route path
   */
  defaultRoute?: string;
  
  /**
   * Not found component
   */
  notFoundComponent?: React.ComponentType<any>;
  
  /**
   * Loading component for route transitions
   */
  loadingComponent?: React.ComponentType<any>;
  
  /**
   * Error component for route errors
   */
  errorComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
  
  /**
   * Navigation change callback
   */
  onNavigationChange?: (to: RouteConfig, from?: RouteConfig) => void;
  
  /**
   * Navigation error callback
   */
  onNavigationError?: (error: Error) => void;
  
  /**
   * Whether to enable browser history integration
   */
  enableBrowserHistory?: boolean;
  
  /**
   * Base path for all routes
   */
  basePath?: string;
  
  /**
   * Children (typically the route outlet)
   */
  children?: ReactNode;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

/**
 * Navigation shell for coordinating routing across microfrontends
 */
export const NavigationShell: React.FC<NavigationShellProps> = ({
  routes,
  defaultRoute = '/',
  notFoundComponent: NotFoundComponent,
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  onNavigationChange,
  onNavigationError,
  enableBrowserHistory = true,
  basePath = '',
  children,
}) => {
  const [currentRoute, _setCurrentRoute] = useSharedState<RouteConfig | null>('navigation.currentRoute', null);
  const [history, _setHistory] = useSharedState<RouteConfig[]>('navigation.history', []);
  const setCurrentRoute = (route: RouteConfig | null) => _setCurrentRoute(route);
  const setHistory = (newHistory: RouteConfig[]) => _setHistory(newHistory);
  const [isNavigating, setIsNavigating] = useState(false);
  const [guards, setGuards] = useState<RouteGuard[]>([]);
  const { emit, listen } = useSharedEvents();

  // Initialize navigation
  useEffect(() => {
    const currentPath = enableBrowserHistory 
      ? window.location.pathname.replace(basePath, '') || defaultRoute
      : defaultRoute;
    
    navigate(currentPath, { replace: true, skipGuards: true });
  }, []);

  // Browser history integration
  useEffect(() => {
    if (!enableBrowserHistory) return;

    const handlePopState = (event: PopStateEvent) => {
      const path = window.location.pathname.replace(basePath, '') || defaultRoute;
      const route = findRoute(path);
      
      if (route) {
        setCurrentRoute(route);
        onNavigationChange?.(route, currentRoute || undefined);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [enableBrowserHistory, basePath, defaultRoute, currentRoute, onNavigationChange]);

  // Listen for cross-microfrontend navigation events
  useEffect(() => {
    const unsubscribe = listen('navigation:navigate', (event) => {
      navigate(event.payload.path, event.payload.options);
    });

    return unsubscribe;
  }, [listen]);

  /**
   * Find route by path
   */
  const findRoute = (path: string): RouteConfig | null => {
    const findInRoutes = (routeList: RouteConfig[], currentPath: string): RouteConfig | null => {
      for (const route of routeList) {
        if (matchPath(route.path, currentPath)) {
          return route;
        }
        
        if (route.children) {
          const childRoute = findInRoutes(route.children, currentPath);
          if (childRoute) return childRoute;
        }
      }
      return null;
    };

    return findInRoutes(routes, path);
  };

  /**
   * Simple path matching
   */
  const matchPath = (pattern: string, path: string): boolean => {
    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/:\w+/g, '[^/]+')
      .replace(/\//g, '\\/');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  };

  /**
   * Run route guards
   */
  const runGuards = async (to: RouteConfig, from?: RouteConfig): Promise<boolean> => {
    const allGuards = [
      ...(to.guards || []),
      ...guards,
    ];

    for (const guard of allGuards) {
      try {
        const result = await guard(to, from);
        if (!result) {
          return false;
        }
      } catch (error) {
        console.error('Route guard error:', error);
        onNavigationError?.(error instanceof Error ? error : new Error(String(error)));
        return false;
      }
    }

    return true;
  };

  /**
   * Navigate to a path
   */
  const navigate = async (path: string, options: NavigationOptions = {}): Promise<void> => {
    const { replace = false, state, skipGuards = false } = options;
    
    setIsNavigating(true);

    try {
      const route = findRoute(path);
      
      if (!route) {
        console.warn(`Route not found: ${path}`);
        setIsNavigating(false);
        return;
      }

      // Run guards
      if (!skipGuards) {
        const canNavigate = await runGuards(route, currentRoute || undefined);
        if (!canNavigate) {
          setIsNavigating(false);
          return;
        }
      }

      // Update history
      if (!replace) {
        setHistory([...history, route]);
      }

      // Update current route
      setCurrentRoute(route);

      // Update browser history
      if (enableBrowserHistory) {
        const fullPath = `${basePath}${path}`;
        if (replace) {
          window.history.replaceState(state, route.meta?.title || '', fullPath);
        } else {
          window.history.pushState(state, route.meta?.title || '', fullPath);
        }
      }

      // Update document title
      if (route.meta?.title) {
        document.title = route.meta.title;
      }

      // Emit navigation event
      emit('navigation:changed', { to: route, from: currentRoute });
      
      onNavigationChange?.(route, currentRoute || undefined);
    } catch (error) {
      console.error('Navigation error:', error);
      onNavigationError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsNavigating(false);
    }
  };

  /**
   * Go back in history
   */
  const goBack = (): void => {
    if (enableBrowserHistory) {
      window.history.back();
    } else {
      const newHistory = [...history];
      newHistory.pop();
      const previousRoute = newHistory[newHistory.length - 1];
      
      if (previousRoute) {
        setHistory(newHistory);
        setCurrentRoute(previousRoute);
        onNavigationChange?.(previousRoute, currentRoute || undefined);
      }
    }
  };

  /**
   * Go forward in history
   */
  const goForward = (): void => {
    if (enableBrowserHistory) {
      window.history.forward();
    }
  };

  /**
   * Add a route guard
   */
  const addGuard = (guard: RouteGuard): (() => void) => {
    setGuards(prev => [...prev, guard]);
    
    return () => {
      setGuards(prev => prev.filter(g => g !== guard));
    };
  };

  /**
   * Get all routes
   */
  const getRoutes = (): RouteConfig[] => {
    return routes;
  };

  /**
   * Render current route
   */
  const renderCurrentRoute = (): ReactNode => {
    if (isNavigating && LoadingComponent) {
      return <LoadingComponent />;
    }

    if (!currentRoute) {
      return NotFoundComponent ? <NotFoundComponent /> : <div>Route not found</div>;
    }

    if (currentRoute.microfrontend) {
      return (
        <FederatedRoute
          config={{
            remoteName: currentRoute.microfrontend.remoteName,
            exposedModule: currentRoute.microfrontend.exposedModule,
            remoteEntry: currentRoute.microfrontend.remoteEntry,
            props: currentRoute.microfrontend.props,
          }}
          loading={LoadingComponent}
          errorComponent={ErrorComponent}
        />
      );
    }

    if (currentRoute.component) {
      const Component = currentRoute.component;
      return <Component />;
    }

    return NotFoundComponent ? <NotFoundComponent /> : <div>Route not configured</div>;
  };

  const contextValue: NavigationContextValue = {
    currentRoute,
    history,
    navigate,
    goBack,
    goForward,
    isNavigating,
    addGuard,
    getRoutes,
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children || renderCurrentRoute()}
    </NavigationContext.Provider>
  );
};

/**
 * Hook to access navigation context
 */
export const useNavigation = (): NavigationContextValue => {
  const context = useContext(NavigationContext);
  
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationShell');
  }
  
  return context;
};

/**
 * Navigation link component
 */
export interface NavigationLinkProps {
  /**
   * Target path
   */
  to: string;
  
  /**
   * Navigation options
   */
  options?: NavigationOptions;
  
  /**
   * CSS class name
   */
  className?: string;
  
  /**
   * Active CSS class name
   */
  activeClassName?: string;
  
  /**
   * Whether link should be active for partial matches
   */
  partial?: boolean;
  
  /**
   * Click handler
   */
  onClick?: (event: React.MouseEvent) => void;
  
  /**
   * Children
   */
  children: ReactNode;
}

export const NavigationLink: React.FC<NavigationLinkProps> = ({
  to,
  options,
  className = '',
  activeClassName = 'active',
  partial = false,
  onClick,
  children,
}) => {
  const { currentRoute, navigate } = useNavigation();
  
  const isActive = currentRoute ? 
    (partial ? currentRoute.path.startsWith(to) : currentRoute.path === to) : 
    false;

  const handleClick = (event: React.MouseEvent): void => {
    event.preventDefault();
    onClick?.(event);
    navigate(to, options);
  };

  return (
    <a
      href={to}
      className={`${className} ${isActive ? activeClassName : ''}`.trim()}
      onClick={handleClick}
    >
      {children}
    </a>
  );
};

/**
 * Route guard hook
 */
export const useRouteGuard = (guard: RouteGuard): void => {
  const { addGuard } = useNavigation();
  
  useEffect(() => {
    const removeGuard = addGuard(guard);
    return removeGuard;
  }, [addGuard, guard]);
};

export default NavigationShell;