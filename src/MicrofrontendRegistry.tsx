import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSharedState, useSharedEvents } from './SharedStateProvider';
import { ModuleFederationConfig } from './ModuleFederation';

export interface MicrofrontendInfo {
  /**
   * Unique identifier for the microfrontend
   */
  id: string;
  
  /**
   * Display name for the microfrontend
   */
  name: string;
  
  /**
   * Module Federation configuration
   */
  config: ModuleFederationConfig;
  
  /**
   * Version of the microfrontend
   */
  version: string;
  
  /**
   * Health status of the microfrontend
   */
  status: 'healthy' | 'unhealthy' | 'loading' | 'unknown';
  
  /**
   * Last health check timestamp
   */
  lastHealthCheck?: number;
  
  /**
   * Metadata about the microfrontend
   */
  metadata?: {
    description?: string;
    author?: string;
    tags?: string[];
    dependencies?: string[];
    routes?: string[];
    capabilities?: string[];
  };
  
  /**
   * Registration timestamp
   */
  registeredAt: number;
  
  /**
   * Last activity timestamp
   */
  lastActivity?: number;
  
  /**
   * Environment where this microfrontend is available
   */
  environment?: string;
  
  /**
   * Whether this microfrontend is currently active
   */
  isActive: boolean;
}

export interface RegistryConfig {
  /**
   * Registry service URL for remote discovery
   */
  serviceUrl?: string;
  
  /**
   * API key for registry service
   */
  apiKey?: string;
  
  /**
   * How often to refresh registry (ms)
   */
  refreshInterval?: number;
  
  /**
   * How often to perform health checks (ms)
   */
  healthCheckInterval?: number;
  
  /**
   * Timeout for health checks (ms)
   */
  healthCheckTimeout?: number;
  
  /**
   * Environment filter
   */
  environment?: string;
  
  /**
   * Enable automatic health monitoring
   */
  enableHealthMonitoring?: boolean;
  
  /**
   * Enable debug logging
   */
  debug?: boolean;
}

export interface MicrofrontendRegistryContextValue {
  /**
   * Get all registered microfrontends
   */
  getMicrofrontends: () => MicrofrontendInfo[];
  
  /**
   * Get a specific microfrontend by ID
   */
  getMicrofrontend: (id: string) => MicrofrontendInfo | undefined;
  
  /**
   * Register a new microfrontend
   */
  register: (microfrontend: Omit<MicrofrontendInfo, 'registeredAt' | 'isActive'>) => void;
  
  /**
   * Unregister a microfrontend
   */
  unregister: (id: string) => void;
  
  /**
   * Update microfrontend information
   */
  update: (id: string, updates: Partial<MicrofrontendInfo>) => void;
  
  /**
   * Search microfrontends by criteria
   */
  search: (criteria: {
    name?: string;
    tags?: string[];
    status?: MicrofrontendInfo['status'];
    capabilities?: string[];
  }) => MicrofrontendInfo[];
  
  /**
   * Get microfrontends by status
   */
  getByStatus: (status: MicrofrontendInfo['status']) => MicrofrontendInfo[];
  
  /**
   * Perform health check on a microfrontend
   */
  performHealthCheck: (id: string) => Promise<boolean>;
  
  /**
   * Refresh registry from remote source
   */
  refresh: () => Promise<void>;
  
  /**
   * Subscribe to registry changes
   */
  subscribe: (callback: (microfrontends: MicrofrontendInfo[]) => void) => () => void;
  
  /**
   * Registry loading state
   */
  isLoading: boolean;
  
  /**
   * Registry error state
   */
  error: Error | null;
}

export interface MicrofrontendRegistryProps {
  /**
   * Registry configuration
   */
  config?: RegistryConfig;
  
  /**
   * Initial microfrontends to register
   */
  initialMicrofrontends?: MicrofrontendInfo[];
  
  /**
   * Children components
   */
  children: ReactNode;
}

const MicrofrontendRegistryContext = createContext<MicrofrontendRegistryContextValue | null>(null);

/**
 * Microfrontend Registry for dynamic discovery and management
 */
export const MicrofrontendRegistry: React.FC<MicrofrontendRegistryProps> = ({
  config = {},
  initialMicrofrontends = [],
  children,
}) => {
  const {
    serviceUrl,
    apiKey,
    refreshInterval = 300000, // 5 minutes
    healthCheckInterval = 60000, // 1 minute
    healthCheckTimeout = 5000, // 5 seconds
    environment = 'production',
    enableHealthMonitoring = true,
    debug = false,
  } = config;

  const [microfrontends, _setMicrofrontends] = useSharedState<MicrofrontendInfo[]>(
    'registry.microfrontends', 
    initialMicrofrontends
  );
  const setMicrofrontends = (newData: MicrofrontendInfo[]) => _setMicrofrontends(newData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [subscribers, setSubscribers] = useState<Array<(microfrontends: MicrofrontendInfo[]) => void>>([]);
  const { emit, listen } = useSharedEvents();

  // Initialize registry
  useEffect(() => {
    if (initialMicrofrontends.length > 0) {
      const initialized = initialMicrofrontends.map(mf => ({
        ...mf,
        registeredAt: Date.now(),
        isActive: true,
      }));
      setMicrofrontends(initialized);
    }
  }, []);

  // Setup remote registry polling
  useEffect(() => {
    if (!serviceUrl || !apiKey) return;

    const fetchFromRegistry = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${serviceUrl}/microfrontends`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          throw new Error(`Registry service error: ${response.status}`);
        }

        const remoteMicrofrontends: MicrofrontendInfo[] = await response.json();
        
        // Filter by environment if specified
        const filteredMicrofrontends = remoteMicrofrontends.filter(
          mf => !mf.environment || mf.environment === environment
        );

        const merged = [...microfrontends];
        
        filteredMicrofrontends.forEach(remoteMf => {
          const existingIndex = merged.findIndex(mf => mf.id === remoteMf.id);
          if (existingIndex >= 0) {
            merged[existingIndex] = { ...merged[existingIndex], ...remoteMf };
          } else {
            merged.push(remoteMf);
          }
        });
        
        setMicrofrontends(merged);

        if (debug) {
          console.log('[MicrofrontendRegistry] Fetched from remote:', filteredMicrofrontends);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error('Failed to fetch from microfrontend registry:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFromRegistry();
    const interval = setInterval(fetchFromRegistry, refreshInterval);

    return () => clearInterval(interval);
  }, [serviceUrl, apiKey, refreshInterval, environment, debug, setMicrofrontends]);

  // Setup health monitoring
  useEffect(() => {
    if (!enableHealthMonitoring) return;

    const performHealthChecks = async () => {
      const activeData = microfrontends.filter(mf => mf.isActive);
      
      for (const mf of activeData) {
        try {
          const isHealthy = await performHealthCheck(mf.id);
          update(mf.id, {
            status: isHealthy ? 'healthy' : 'unhealthy',
            lastHealthCheck: Date.now(),
          });
        } catch (error) {
          update(mf.id, {
            status: 'unhealthy',
            lastHealthCheck: Date.now(),
          });
        }
      }
    };

    const interval = setInterval(performHealthChecks, healthCheckInterval);
    return () => clearInterval(interval);
  }, [microfrontends, enableHealthMonitoring, healthCheckInterval]);

  // Listen for registry events
  useEffect(() => {
    const unsubscribe = listen('registry:update', (event) => {
      const { action, microfrontend } = event.payload;
      
      switch (action) {
        case 'register':
          register(microfrontend);
          break;
        case 'unregister':
          unregister(microfrontend.id);
          break;
        case 'update':
          update(microfrontend.id, microfrontend);
          break;
      }
    });

    return unsubscribe;
  }, [listen]);

  // Notify subscribers on changes
  useEffect(() => {
    subscribers.forEach(callback => {
      try {
        callback(microfrontends);
      } catch (error) {
        console.error('Error in registry subscriber:', error);
      }
    });
  }, [microfrontends, subscribers]);

  /**
   * Get all registered microfrontends
   */
  const getMicrofrontends = (): MicrofrontendInfo[] => {
    return microfrontends;
  };

  /**
   * Get a specific microfrontend by ID
   */
  const getMicrofrontend = (id: string): MicrofrontendInfo | undefined => {
    return microfrontends.find(mf => mf.id === id);
  };

  /**
   * Register a new microfrontend
   */
  const register = (microfrontend: Omit<MicrofrontendInfo, 'registeredAt' | 'isActive'>): void => {
    const newMicrofrontend: MicrofrontendInfo = {
      ...microfrontend,
      registeredAt: Date.now(),
      isActive: true,
    };

    const existing = microfrontends.find(mf => mf.id === microfrontend.id);
    if (existing) {
      setMicrofrontends(microfrontends.map(mf => mf.id === microfrontend.id ? newMicrofrontend : mf));
    } else {
      setMicrofrontends([...microfrontends, newMicrofrontend]);
    }

    emit('registry:registered', { microfrontend: newMicrofrontend });

    if (debug) {
      console.log('[MicrofrontendRegistry] Registered:', newMicrofrontend);
    }
  };

  /**
   * Unregister a microfrontend
   */
  const unregister = (id: string): void => {
    setMicrofrontends(microfrontends.filter(mf => mf.id !== id));
    emit('registry:unregistered', { id });

    if (debug) {
      console.log('[MicrofrontendRegistry] Unregistered:', id);
    }
  };

  /**
   * Update microfrontend information
   */
  const update = (id: string, updates: Partial<MicrofrontendInfo>): void => {
    setMicrofrontends(
      microfrontends.map(mf => 
        mf.id === id 
          ? { ...mf, ...updates, lastActivity: Date.now() }
          : mf
      )
    );

    emit('registry:updated', { id, updates });

    if (debug) {
      console.log('[MicrofrontendRegistry] Updated:', id, updates);
    }
  };

  /**
   * Search microfrontends by criteria
   */
  const search = (criteria: {
    name?: string;
    tags?: string[];
    status?: MicrofrontendInfo['status'];
    capabilities?: string[];
  }): MicrofrontendInfo[] => {
    return microfrontends.filter(mf => {
      if (criteria.name && !mf.name.toLowerCase().includes(criteria.name.toLowerCase())) {
        return false;
      }
      
      if (criteria.status && mf.status !== criteria.status) {
        return false;
      }
      
      if (criteria.tags && criteria.tags.length > 0) {
        const mfTags = mf.metadata?.tags || [];
        if (!criteria.tags.some(tag => mfTags.includes(tag))) {
          return false;
        }
      }
      
      if (criteria.capabilities && criteria.capabilities.length > 0) {
        const mfCapabilities = mf.metadata?.capabilities || [];
        if (!criteria.capabilities.some(cap => mfCapabilities.includes(cap))) {
          return false;
        }
      }
      
      return true;
    });
  };

  /**
   * Get microfrontends by status
   */
  const getByStatus = (status: MicrofrontendInfo['status']): MicrofrontendInfo[] => {
    return microfrontends.filter(mf => mf.status === status);
  };

  /**
   * Perform health check on a microfrontend
   */
  const performHealthCheck = async (id: string): Promise<boolean> => {
    const mf = getMicrofrontend(id);
    if (!mf) return false;

    try {
      // Try to load the remote entry to check health
      if (mf.config.remoteEntry) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), healthCheckTimeout);

        const response = await fetch(mf.config.remoteEntry, {
          method: 'HEAD',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response.ok;
      }

      // For build-time known remotes, we can't easily health check
      // so we assume they're healthy if they were registered
      return true;
    } catch (error) {
      if (debug) {
        console.log(`[MicrofrontendRegistry] Health check failed for ${id}:`, error);
      }
      return false;
    }
  };

  /**
   * Refresh registry from remote source
   */
  const refresh = async (): Promise<void> => {
    if (!serviceUrl || !apiKey) {
      throw new Error('Registry service not configured');
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${serviceUrl}/microfrontends`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Registry refresh failed: ${response.status}`);
      }

      const remoteMicrofrontends: MicrofrontendInfo[] = await response.json();
      setMicrofrontends(remoteMicrofrontends.filter(
        mf => !mf.environment || mf.environment === environment
      ));
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Subscribe to registry changes
   */
  const subscribe = (callback: (microfrontends: MicrofrontendInfo[]) => void): (() => void) => {
    setSubscribers(prev => [...prev, callback]);
    
    return () => {
      setSubscribers(prev => prev.filter(cb => cb !== callback));
    };
  };

  const contextValue: MicrofrontendRegistryContextValue = {
    getMicrofrontends,
    getMicrofrontend,
    register,
    unregister,
    update,
    search,
    getByStatus,
    performHealthCheck,
    refresh,
    subscribe,
    isLoading,
    error,
  };

  return (
    <MicrofrontendRegistryContext.Provider value={contextValue}>
      {children}
    </MicrofrontendRegistryContext.Provider>
  );
};

/**
 * Hook to access microfrontend registry
 */
export const useMicrofrontendRegistry = (): MicrofrontendRegistryContextValue => {
  const context = useContext(MicrofrontendRegistryContext);
  
  if (!context) {
    throw new Error('useMicrofrontendRegistry must be used within a MicrofrontendRegistry');
  }
  
  return context;
};

/**
 * Hook for registering a microfrontend on mount
 */
export const useAutoRegister = (microfrontend: Omit<MicrofrontendInfo, 'registeredAt' | 'isActive'>) => {
  const { register, unregister } = useMicrofrontendRegistry();
  
  useEffect(() => {
    register(microfrontend);
    
    return () => {
      unregister(microfrontend.id);
    };
  }, [microfrontend.id]);
};

/**
 * Registry status component
 */
export interface RegistryStatusProps {
  className?: string;
  showDetails?: boolean;
}

export const RegistryStatus: React.FC<RegistryStatusProps> = ({
  className = '',
  showDetails = false,
}) => {
  const { getMicrofrontends, getByStatus, isLoading, error } = useMicrofrontendRegistry();
  
  const all = getMicrofrontends();
  const healthy = getByStatus('healthy');
  const unhealthy = getByStatus('unhealthy');
  const loading = getByStatus('loading');

  if (isLoading) {
    return (
      <div className={`p-4 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
        <div className="flex items-center">
          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2" />
          <span className="text-blue-700">Loading registry...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="text-red-700">
          <strong>Registry Error:</strong> {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-white border border-gray-200 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">Microfrontend Registry</h3>
        <span className="text-sm text-gray-500">{all.length} total</span>
      </div>
      
      <div className="flex space-x-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-1" />
          <span>{healthy.length} healthy</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-1" />
          <span>{unhealthy.length} unhealthy</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1" />
          <span>{loading.length} loading</span>
        </div>
      </div>

      {showDetails && all.length > 0 && (
        <div className="mt-4 space-y-2">
          {all.map(mf => (
            <div key={mf.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  mf.status === 'healthy' ? 'bg-green-500' :
                  mf.status === 'unhealthy' ? 'bg-red-500' :
                  mf.status === 'loading' ? 'bg-yellow-500' : 'bg-gray-400'
                }`} />
                <span className="text-sm font-medium">{mf.name}</span>
              </div>
              <span className="text-xs text-gray-500">{mf.version}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MicrofrontendRegistry;