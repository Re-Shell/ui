import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSharedState, useSharedEvents } from './SharedStateProvider';

export interface FeatureFlagConfig {
  /**
   * Feature flag key
   */
  key: string;
  
  /**
   * Default value when flag is not defined
   */
  defaultValue: boolean;
  
  /**
   * Description of the feature
   */
  description?: string;
  
  /**
   * Feature owner/team
   */
  owner?: string;
  
  /**
   * Expiration date for the flag
   */
  expiresAt?: Date;
  
  /**
   * Rollout percentage (0-100)
   */
  rolloutPercentage?: number;
  
  /**
   * Target user segments
   */
  targetSegments?: string[];
  
  /**
   * Environment restrictions
   */
  environments?: string[];
  
  /**
   * A/B test variant name
   */
  variant?: string;
}

export interface FeatureFlagContextValue {
  /**
   * Check if a feature is enabled
   */
  isEnabled: (key: string) => boolean;
  
  /**
   * Get feature flag configuration
   */
  getFlag: (key: string) => FeatureFlagConfig | undefined;
  
  /**
   * Set a feature flag value
   */
  setFlag: (key: string, value: boolean | FeatureFlagConfig) => void;
  
  /**
   * Get all feature flags
   */
  getAllFlags: () => Record<string, FeatureFlagConfig>;
  
  /**
   * Subscribe to flag changes
   */
  subscribe: (key: string, callback: (enabled: boolean) => void) => () => void;
  
  /**
   * Get user segment for targeting
   */
  getUserSegment: () => string;
  
  /**
   * Set user segment
   */
  setUserSegment: (segment: string) => void;
}

export interface FeatureFlagProviderProps {
  /**
   * Initial feature flags
   */
  flags?: Record<string, FeatureFlagConfig>;
  
  /**
   * User ID for consistent rollouts
   */
  userId?: string;
  
  /**
   * User segment for targeting
   */
  userSegment?: string;
  
  /**
   * Current environment
   */
  environment?: string;
  
  /**
   * Remote flag service URL
   */
  serviceUrl?: string;
  
  /**
   * API key for remote service
   */
  apiKey?: string;
  
  /**
   * Refresh interval for remote flags (ms)
   */
  refreshInterval?: number;
  
  /**
   * Enable local storage persistence
   */
  enablePersistence?: boolean;
  
  /**
   * Debug mode for logging
   */
  debug?: boolean;
  
  /**
   * Children components
   */
  children: ReactNode;
}

export interface FeatureFlagProps {
  /**
   * Feature flag key to check
   */
  flag: string;
  
  /**
   * Default value if flag is not found
   */
  defaultValue?: boolean;
  
  /**
   * Content to render when feature is enabled
   */
  children: ReactNode;
  
  /**
   * Content to render when feature is disabled
   */
  fallback?: ReactNode;
  
  /**
   * Callback when feature state changes
   */
  onChange?: (enabled: boolean) => void;
  
  /**
   * Loading component while evaluating flag
   */
  loading?: ReactNode;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

/**
 * Generate a consistent hash for user-based rollouts
 */
const generateUserHash = (userId: string, flagKey: string): number => {
  const str = `${userId}:${flagKey}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 100;
};

/**
 * Feature Flag Provider for managing feature toggles across microfrontends
 */
export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({
  flags: initialFlags = {},
  userId = 'anonymous',
  userSegment: initialUserSegment = 'default',
  environment = 'development',
  serviceUrl,
  apiKey,
  refreshInterval = 60000, // 1 minute
  enablePersistence = true,
  debug = false,
  children,
}) => {
  const [flags, _setFlags] = useSharedState('featureFlags.flags', initialFlags);
  const setFlags = (newFlags: Record<string, FeatureFlagConfig>) => _setFlags(newFlags);
  const [userSegment, setUserSegment] = useSharedState('featureFlags.userSegment', initialUserSegment);
  const [, setIsLoading] = useState(false);
  const { emit, listen } = useSharedEvents();

  // Load persisted flags
  useEffect(() => {
    if (enablePersistence && typeof window !== 'undefined') {
      try {
        const persistedFlags = localStorage.getItem('re-shell-feature-flags');
        if (persistedFlags) {
          const parsed = JSON.parse(persistedFlags);
          setFlags({ ...flags, ...parsed });
        }
      } catch (error) {
        console.warn('Failed to load persisted feature flags:', error);
      }
    }
  }, [enablePersistence, setFlags]);

  // Persist flags on change
  useEffect(() => {
    if (enablePersistence && typeof window !== 'undefined') {
      try {
        localStorage.setItem('re-shell-feature-flags', JSON.stringify(flags));
      } catch (error) {
        console.warn('Failed to persist feature flags:', error);
      }
    }
  }, [flags, enablePersistence]);

  // Fetch remote flags
  const fetchRemoteFlags = React.useCallback(async () => {
    if (!serviceUrl || !apiKey) return;

    setIsLoading(true);
    
    try {
      const response = await fetch(serviceUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const remoteFlags = await response.json();
      setFlags({ ...flags, ...remoteFlags });
      
      if (debug) {
        console.log('[FeatureFlags] Remote flags loaded:', remoteFlags);
      }
    } catch (error) {
      console.error('Failed to fetch remote feature flags:', error);
    } finally {
      setIsLoading(false);
    }
  }, [serviceUrl, apiKey, setFlags, debug]);

  // Setup remote flag polling
  useEffect(() => {
    if (!serviceUrl || !apiKey) return;

    fetchRemoteFlags();
    
    const interval = setInterval(fetchRemoteFlags, refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchRemoteFlags, refreshInterval]);

  // Listen for flag updates from other microfrontends
  useEffect(() => {
    const unsubscribe = listen('featureFlags:update', (event) => {
      const { key, config } = event.payload;
      setFlags({ ...flags, [key]: config });
      
      if (debug) {
        console.log('[FeatureFlags] Flag updated via event:', key, config);
      }
    });

    return unsubscribe;
  }, [listen, setFlags, debug]);

  /**
   * Evaluate if a feature flag is enabled
   */
  const evaluateFlag = (config: FeatureFlagConfig): boolean => {
    // Check environment restriction
    if (config.environments && !config.environments.includes(environment)) {
      return false;
    }

    // Check expiration
    if (config.expiresAt && new Date() > config.expiresAt) {
      return false;
    }

    // Check segment targeting
    if (config.targetSegments && !config.targetSegments.includes(userSegment)) {
      return false;
    }

    // Check rollout percentage
    if (config.rolloutPercentage !== undefined) {
      const userHash = generateUserHash(userId, config.key);
      return userHash < config.rolloutPercentage;
    }

    return config.defaultValue;
  };

  /**
   * Check if a feature is enabled
   */
  const isEnabled = (key: string): boolean => {
    const flag = flags[key];
    
    if (!flag) {
      if (debug) {
        console.warn(`[FeatureFlags] Flag "${key}" not found, using default false`);
      }
      return false;
    }

    return evaluateFlag(flag);
  };

  /**
   * Get feature flag configuration
   */
  const getFlag = (key: string): FeatureFlagConfig | undefined => {
    return flags[key];
  };

  /**
   * Set a feature flag
   */
  const setFlag = (key: string, value: boolean | FeatureFlagConfig): void => {
    const config: FeatureFlagConfig = typeof value === 'boolean' 
      ? { key, defaultValue: value }
      : { ...value, key };

    setFlags({ ...flags, [key]: config });
    
    // Emit update event for other microfrontends
    emit('featureFlags:update', { key, config });
    
    if (debug) {
      console.log('[FeatureFlags] Flag set:', key, config);
    }
  };

  /**
   * Get all feature flags
   */
  const getAllFlags = (): Record<string, FeatureFlagConfig> => {
    return flags;
  };

  /**
   * Subscribe to flag changes
   */
  const subscribe = (key: string, callback: (enabled: boolean) => void): (() => void) => {
    const unsubscribe = listen('featureFlags:update', (event) => {
      if (event.payload.key === key) {
        callback(isEnabled(key));
      }
    });

    return unsubscribe;
  };

  /**
   * Get user segment
   */
  const getUserSegment = (): string => {
    return userSegment;
  };

  const contextValue: FeatureFlagContextValue = {
    isEnabled,
    getFlag,
    setFlag,
    getAllFlags,
    subscribe,
    getUserSegment,
    setUserSegment,
  };

  return (
    <FeatureFlagContext.Provider value={contextValue}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

/**
 * Feature Flag component for conditional rendering
 */
export const FeatureFlag: React.FC<FeatureFlagProps> = ({
  flag,
  defaultValue = false,
  children,
  fallback = null,
  onChange,
  loading = null,
}) => {
  const context = useContext(FeatureFlagContext);
  
  const [enabled, setEnabled] = useState(() => {
    if (!context) {
      return defaultValue;
    }
    const flagConfig = context.getFlag(flag);
    return flagConfig ? context.isEnabled(flag) : defaultValue;
  });

  const [, setIsLoading] = useState(false);

  // Subscribe to flag changes
  useEffect(() => {
    if (!context) return;
    
    const unsubscribe = context.subscribe(flag, (newEnabled) => {
      setEnabled(newEnabled);
      onChange?.(newEnabled);
    });

    return unsubscribe;
  }, [context, flag, onChange]);

  // Initial flag evaluation
  useEffect(() => {
    if (!context) return;
    
    setIsLoading(true);
    
    // Simulate async flag evaluation for remote flags
    const timer = setTimeout(() => {
      const flagEnabled = context.isEnabled(flag);
      setEnabled(flagEnabled);
      onChange?.(flagEnabled);
      setIsLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [context, flag, onChange]);

  if (!context) {
    // No provider, use default value
    return defaultValue ? <>{children}</> : <>{fallback}</>;
  }

  return enabled ? <>{children}</> : <>{fallback}</>;
};

/**
 * Hook for using feature flags
 */
export const useFeatureFlag = (key: string, defaultValue = false) => {
  const context = useContext(FeatureFlagContext);
  
  const [enabled, setEnabled] = useState(() => {
    if (!context) return defaultValue;
    const flag = context.getFlag(key);
    return flag ? context.isEnabled(key) : defaultValue;
  });

  useEffect(() => {
    if (!context) return;

    const unsubscribe = context.subscribe(key, setEnabled);
    
    // Initial evaluation
    setEnabled(context.isEnabled(key));
    
    return unsubscribe;
  }, [context, key]);

  return enabled;
};

/**
 * Hook for feature flag with variant support
 */
export const useFeatureFlagVariant = (key: string, variants: Record<string, any>, defaultVariant = 'control') => {
  const context = useContext(FeatureFlagContext);
  const enabled = useFeatureFlag(key);
  
  const variant = context?.getFlag(key)?.variant || defaultVariant;
  
  return {
    enabled,
    variant,
    value: variants[variant] || variants[defaultVariant],
  };
};

/**
 * Higher-order component for feature flag wrapping
 */
export const withFeatureFlag = (
  flagKey: string, 
  defaultValue = false,
  fallbackComponent?: React.ComponentType<any>
) => {
  return <P extends object>(Component: React.ComponentType<P>) => {
    const WrappedComponent: React.FC<P> = (props) => {
      return (
        <FeatureFlag 
          flag={flagKey} 
          defaultValue={defaultValue}
          fallback={fallbackComponent ? React.createElement(fallbackComponent) : null}
        >
          <Component {...props} />
        </FeatureFlag>
      );
    };

    WrappedComponent.displayName = `withFeatureFlag(${Component.displayName || Component.name})`;
    
    return WrappedComponent;
  };
};

export default FeatureFlagProvider;