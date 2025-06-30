/**
 * Type-safe context providers system
 */

import React, { createContext as createReactContext, useContext as useReactContext } from 'react';

/**
 * Context creation error
 */
export class ContextError extends Error {
  constructor(contextName: string, message: string) {
    super(`[${contextName}] ${message}`);
    this.name = 'ContextError';
  }
}

/**
 * Type-safe context factory
 */
export function createContext<T>(
  name: string,
  defaultValue?: T
): readonly [
  React.Provider<T>,
  () => T,
  React.Context<T | undefined>
] {
  const Context = createReactContext<T | undefined>(defaultValue);
  Context.displayName = name;
  
  function useContext(): T {
    const context = useReactContext(Context);
    if (context === undefined) {
      throw new ContextError(
        name,
        `useContext must be used within a ${name} Provider`
      );
    }
    return context;
  }
  
  return [Context.Provider as React.Provider<T>, useContext, Context] as const;
}

/**
 * Type-safe context with selector
 */
export function createContextSelector<T>(
  name: string,
  defaultValue?: T
): readonly [
  React.Provider<T>,
  <R>(selector: (value: T) => R) => R,
  () => T,
  React.Context<T | undefined>
] {
  const [Provider, useContext, Context] = createContext(name, defaultValue);
  
  function useContextSelector<R>(selector: (value: T) => R): R {
    const context = useContext();
    return selector(context);
  }
  
  return [Provider, useContextSelector, useContext, Context] as const;
}

/**
 * Compound context for complex state
 */
export type CompoundContextValue<State, Actions> = {
  state: State;
  actions: Actions;
};

export function createCompoundContext<State, Actions>(
  name: string,
  defaultState?: State,
  defaultActions?: Actions
): readonly [
  React.Provider<CompoundContextValue<State, Actions>>,
  () => State,
  () => Actions,
  () => CompoundContextValue<State, Actions>
] {
  const defaultValue = defaultState && defaultActions
    ? { state: defaultState, actions: defaultActions }
    : undefined;
    
  const [Provider, useContext] = createContext<CompoundContextValue<State, Actions>>(
    name,
    defaultValue
  );
  
  function useState(): State {
    return useContext().state;
  }
  
  function useActions(): Actions {
    return useContext().actions;
  }
  
  return [Provider, useState, useActions, useContext] as const;
}

/**
 * Context provider props with children
 */
export type ProviderProps<T = unknown> = T & {
  children: React.ReactNode;
};

/**
 * Optional context - doesn't throw if not provided
 */
export function createOptionalContext<T>(
  name: string,
  defaultValue?: T
): readonly [
  React.Provider<T | undefined>,
  () => T | undefined,
  React.Context<T | undefined>
] {
  const Context = createReactContext<T | undefined>(defaultValue);
  Context.displayName = name;
  
  function useContext(): T | undefined {
    return useReactContext(Context);
  }
  
  return [Context.Provider, useContext, Context] as const;
}

/**
 * Multi-provider composer
 */
export type Provider<T = any> = React.ComponentType<ProviderProps<T>>;

export function composeProviders<T extends readonly Provider[]>(
  ...providers: T
): React.FC<{ children: React.ReactNode }> {
  return ({ children }) => {
    return providers.reduceRight(
      (acc, Provider) => React.createElement(Provider, null, acc),
      children as React.ReactElement
    );
  };
}

/**
 * Context display name helper
 */
export function setContextDisplayName<T>(
  context: React.Context<T>,
  displayName: string
): void {
  context.displayName = displayName;
}

/**
 * Type guard for context value
 */
export function isContextValueDefined<T>(
  value: T | undefined
): value is T {
  return value !== undefined;
}

/**
 * Context debugger for development
 */
export function createContextDebugger<T>(
  name: string,
  context: React.Context<T>
): React.FC<{ children: React.ReactNode }> {
  return ({ children }) => {
    if (process.env.NODE_ENV !== 'production') {
      const value = useReactContext(context as React.Context<T | undefined>);
      console.log(`[${name}] Context value:`, value);
    }
    return React.createElement(React.Fragment, null, children);
  };
}

/**
 * Factory for creating typed context modules
 */
export function createContextModule<T>(config: {
  name: string;
  defaultValue?: T;
  errorMessage?: string;
}) {
  const [Provider, useContext, Context] = createContext<T>(
    config.name,
    config.defaultValue
  );
  
  return {
    Provider,
    useContext,
    Context,
    Consumer: Context.Consumer,
    displayName: config.name,
  };
}

/**
 * Async context for loading states
 */
export type AsyncContextValue<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

export function createAsyncContext<T>(
  name: string
): readonly [
  React.Provider<AsyncContextValue<T>>,
  () => AsyncContextValue<T>,
  () => T | undefined,
  () => boolean,
  () => Error | undefined
] {
  const [Provider, useContext] = createContext<AsyncContextValue<T>>(
    name,
    { status: 'idle' }
  );
  
  function useData(): T | undefined {
    const context = useContext();
    return context.status === 'success' ? context.data : undefined;
  }
  
  function useLoading(): boolean {
    const context = useContext();
    return context.status === 'loading';
  }
  
  function useError(): Error | undefined {
    const context = useContext();
    return context.status === 'error' ? context.error : undefined;
  }
  
  return [Provider, useContext, useData, useLoading, useError] as const;
}