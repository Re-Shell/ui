import React, { createContext, useContext, useEffect, useReducer, useCallback, ReactNode } from 'react';

export type SharedStateEvent = {
  type: string;
  payload: any;
  source: string;
  timestamp: number;
  id: string;
};

export type SharedStateListener = (event: SharedStateEvent) => void;

export interface SharedStateContextValue {
  /**
   * Get a value from shared state
   */
  getState: <T = any>(key: string) => T | undefined;
  
  /**
   * Set a value in shared state
   */
  setState: <T = any>(key: string, value: T) => void;
  
  /**
   * Subscribe to state changes
   */
  subscribe: (key: string, listener: (value: any) => void) => () => void;
  
  /**
   * Emit a custom event
   */
  emit: (type: string, payload: any, target?: string) => void;
  
  /**
   * Listen to custom events
   */
  listen: (type: string, listener: SharedStateListener) => () => void;
  
  /**
   * Get all microfrontend states
   */
  getAllStates: () => Record<string, any>;
  
  /**
   * Clear state for a specific microfrontend
   */
  clearMicrofrontendState: (microfrontendName: string) => void;
}

export interface SharedStateProviderProps {
  /**
   * Unique identifier for this microfrontend
   */
  microfrontendName: string;
  
  /**
   * Initial state for this microfrontend
   */
  initialState?: Record<string, any>;
  
  /**
   * Whether to persist state in localStorage
   */
  persistState?: boolean;
  
  /**
   * Storage key prefix for persistence
   */
  storagePrefix?: string;
  
  /**
   * Whether to enable cross-window communication
   */
  enableCrossWindow?: boolean;
  
  /**
   * Debug mode for logging
   */
  debug?: boolean;
  
  /**
   * Children components
   */
  children: ReactNode;
}

// Global state and event system
interface GlobalSharedState {
  states: Record<string, Record<string, any>>;
  listeners: Record<string, Array<(value: any) => void>>;
  eventListeners: Record<string, Array<SharedStateListener>>;
}

const globalState: GlobalSharedState = {
  states: {},
  listeners: {},
  eventListeners: {},
};

// Create shared state context
const SharedStateContext = createContext<SharedStateContextValue | null>(null);

/**
 * Generate unique event ID
 */
const generateEventId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a shared state event
 */
const createEvent = (type: string, payload: any, source: string): SharedStateEvent => ({
  type,
  payload,
  source,
  timestamp: Date.now(),
  id: generateEventId(),
});

/**
 * Shared State Provider for cross-microfrontend communication
 */
export const SharedStateProvider: React.FC<SharedStateProviderProps> = ({
  microfrontendName,
  initialState = {},
  persistState = false,
  storagePrefix = 're-shell-state',
  enableCrossWindow = false,
  debug = false,
  children,
}) => {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  // Initialize microfrontend state
  useEffect(() => {
    if (!globalState.states[microfrontendName]) {
      let state = { ...initialState };
      
      // Load persisted state
      if (persistState && typeof window !== 'undefined') {
        try {
          const persistedState = localStorage.getItem(`${storagePrefix}-${microfrontendName}`);
          if (persistedState) {
            state = { ...state, ...JSON.parse(persistedState) };
          }
        } catch (error) {
          console.warn(`Failed to load persisted state for ${microfrontendName}:`, error);
        }
      }
      
      globalState.states[microfrontendName] = state;
      
      if (debug) {
        console.log(`[SharedState] Initialized state for ${microfrontendName}:`, state);
      }
    }
  }, [microfrontendName, initialState, persistState, storagePrefix, debug]);

  // Setup cross-window communication
  useEffect(() => {
    if (!enableCrossWindow || typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.startsWith(`${storagePrefix}-event-`)) {
        try {
          const sharedEvent: SharedStateEvent = JSON.parse(event.newValue || '');
          
          // Don't process events from this window
          if (sharedEvent.source === microfrontendName) {
            return;
          }
          
          // Emit the event to local listeners
          const listeners = globalState.eventListeners[sharedEvent.type] || [];
          listeners.forEach(listener => {
            try {
              listener(sharedEvent);
            } catch (error) {
              console.error('Error in cross-window event listener:', error);
            }
          });
          
          if (debug) {
            console.log(`[SharedState] Received cross-window event:`, sharedEvent);
          }
        } catch (error) {
          console.warn('Failed to parse cross-window event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [enableCrossWindow, storagePrefix, microfrontendName, debug]);

  // Persist state changes
  const persistStateChange = useCallback((key: string, value: any) => {
    if (!persistState || typeof window === 'undefined') {
      return;
    }

    try {
      const currentState = globalState.states[microfrontendName] || {};
      localStorage.setItem(
        `${storagePrefix}-${microfrontendName}`, 
        JSON.stringify(currentState)
      );
    } catch (error) {
      console.warn(`Failed to persist state for ${microfrontendName}:`, error);
    }
  }, [persistState, storagePrefix, microfrontendName]);

  // Get state value
  const getState = useCallback(<T = any>(key: string): T | undefined => {
    const fullKey = `${microfrontendName}.${key}`;
    const [mfName, ...keyParts] = fullKey.split('.');
    const keyPath = keyParts.join('.');
    
    const mfState = globalState.states[mfName];
    if (!mfState || !keyPath) {
      return undefined;
    }
    
    // Support nested keys with dot notation
    return keyPath.split('.').reduce((obj, k) => obj?.[k], mfState) as T;
  }, [microfrontendName]);

  // Set state value
  const setState = useCallback(<T = any>(key: string, value: T): void => {
    const fullKey = `${microfrontendName}.${key}`;
    const [mfName, ...keyParts] = fullKey.split('.');
    const keyPath = keyParts.join('.');
    
    if (!globalState.states[mfName]) {
      globalState.states[mfName] = {};
    }
    
    // Support nested keys with dot notation
    const keys = keyPath.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((obj, k) => {
      if (!(k in obj)) {
        obj[k] = {};
      }
      return obj[k];
    }, globalState.states[mfName]);
    
    target[lastKey] = value;
    
    // Notify listeners
    const listeners = globalState.listeners[fullKey] || [];
    listeners.forEach(listener => {
      try {
        listener(value);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
    
    // Persist state
    persistStateChange(key, value);
    
    // Emit state change event
    emit('state:change', { key: fullKey, value }, microfrontendName);
    
    if (debug) {
      console.log(`[SharedState] State changed: ${fullKey} =`, value);
    }
    
    forceUpdate();
  }, [microfrontendName, persistStateChange, debug]);

  // Subscribe to state changes
  const subscribe = useCallback((key: string, listener: (value: any) => void): (() => void) => {
    const fullKey = key.includes('.') ? key : `${microfrontendName}.${key}`;
    
    if (!globalState.listeners[fullKey]) {
      globalState.listeners[fullKey] = [];
    }
    
    globalState.listeners[fullKey].push(listener);
    
    return () => {
      const listeners = globalState.listeners[fullKey];
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }, [microfrontendName]);

  // Emit custom event
  const emit = useCallback((type: string, payload: any, target?: string): void => {
    const event = createEvent(type, payload, microfrontendName);
    
    // Emit to local listeners
    const listeners = globalState.eventListeners[type] || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
    
    // Emit cross-window if enabled
    if (enableCrossWindow && typeof window !== 'undefined') {
      try {
        const eventKey = `${storagePrefix}-event-${event.id}`;
        localStorage.setItem(eventKey, JSON.stringify(event));
        
        // Clean up event after a short delay
        setTimeout(() => {
          localStorage.removeItem(eventKey);
        }, 1000);
      } catch (error) {
        console.warn('Failed to emit cross-window event:', error);
      }
    }
    
    if (debug) {
      console.log(`[SharedState] Event emitted:`, event);
    }
  }, [microfrontendName, enableCrossWindow, storagePrefix, debug]);

  // Listen to custom events
  const listen = useCallback((type: string, listener: SharedStateListener): (() => void) => {
    if (!globalState.eventListeners[type]) {
      globalState.eventListeners[type] = [];
    }
    
    globalState.eventListeners[type].push(listener);
    
    return () => {
      const listeners = globalState.eventListeners[type];
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }, []);

  // Get all states
  const getAllStates = useCallback((): Record<string, any> => {
    return { ...globalState.states };
  }, []);

  // Clear microfrontend state
  const clearMicrofrontendState = useCallback((mfName: string): void => {
    delete globalState.states[mfName];
    
    // Clear persisted state
    if (persistState && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`${storagePrefix}-${mfName}`);
      } catch (error) {
        console.warn(`Failed to clear persisted state for ${mfName}:`, error);
      }
    }
    
    emit('state:cleared', { microfrontend: mfName }, microfrontendName);
    
    if (debug) {
      console.log(`[SharedState] Cleared state for ${mfName}`);
    }
  }, [persistState, storagePrefix, emit, microfrontendName, debug]);

  const contextValue: SharedStateContextValue = {
    getState,
    setState,
    subscribe,
    emit,
    listen,
    getAllStates,
    clearMicrofrontendState,
  };

  return (
    <SharedStateContext.Provider value={contextValue}>
      {children}
    </SharedStateContext.Provider>
  );
};

/**
 * Hook to access shared state
 */
export const useSharedState = <T = any>(key: string, defaultValue?: T) => {
  const context = useContext(SharedStateContext);
  
  if (!context) {
    throw new Error('useSharedState must be used within a SharedStateProvider');
  }
  
  const [value, setValue] = React.useState<T>(() => {
    const state = context.getState<T>(key);
    return state !== undefined ? state : defaultValue as T;
  });
  
  useEffect(() => {
    const unsubscribe = context.subscribe(key, setValue);
    return unsubscribe;
  }, [context, key]);
  
  const setSharedState = useCallback((newValue: T) => {
    context.setState(key, newValue);
  }, [context, key]);
  
  return [value, setSharedState] as const;
};

/**
 * Hook to emit and listen to events
 */
export const useSharedEvents = () => {
  const context = useContext(SharedStateContext);
  
  if (!context) {
    throw new Error('useSharedEvents must be used within a SharedStateProvider');
  }
  
  return {
    emit: context.emit,
    listen: context.listen,
  };
};

/**
 * Hook for cross-microfrontend communication
 */
export const useCrossMicrofrontendCommunication = (microfrontendName: string) => {
  const context = useContext(SharedStateContext);
  
  if (!context) {
    throw new Error('useCrossMicrofrontendCommunication must be used within a SharedStateProvider');
  }
  
  const sendMessage = useCallback((targetMicrofrontend: string, message: any) => {
    context.emit('microfrontend:message', {
      target: targetMicrofrontend,
      message,
    }, microfrontendName);
  }, [context, microfrontendName]);
  
  const onMessage = useCallback((callback: (message: any, source: string) => void) => {
    return context.listen('microfrontend:message', (event) => {
      if (event.payload.target === microfrontendName) {
        callback(event.payload.message, event.source);
      }
    });
  }, [context, microfrontendName]);
  
  return {
    sendMessage,
    onMessage,
  };
};

export default SharedStateProvider;