/**
 * JSDoc type definitions and utilities for enhanced IDE support
 */

/**
 * Component documentation type
 * @template Props - The component props type
 */
export interface ComponentDoc<Props = any> {
  /** Component display name */
  displayName: string;
  /** Component description */
  description: string;
  /** Props documentation */
  props: PropsDoc<Props>;
  /** Usage examples */
  examples?: Example[];
  /** See also references */
  seeAlso?: string[];
}

/**
 * Props documentation type
 * @template Props - The props type
 */
export type PropsDoc<Props> = {
  [K in keyof Props]: PropDoc<Props[K]>;
};

/**
 * Individual prop documentation
 * @template T - The prop type
 */
export interface PropDoc<T = any> {
  /** Prop description */
  description: string;
  /** Prop type as string */
  type: string;
  /** Default value */
  defaultValue?: T;
  /** Whether the prop is required */
  required?: boolean;
  /** Allowed values for enums */
  values?: T[];
  /** Usage examples */
  examples?: T[];
  /** Deprecation notice */
  deprecated?: string;
  /** Version when added */
  since?: string;
}

/**
 * Example documentation
 */
export interface Example {
  /** Example title */
  title: string;
  /** Example description */
  description?: string;
  /** Example code */
  code: string;
  /** Live demo URL */
  demo?: string;
  /** Language for syntax highlighting */
  language?: 'tsx' | 'jsx' | 'ts' | 'js';
}

/**
 * Generate component documentation
 * @template Props - Component props type
 * @param config - Documentation configuration
 * @returns Component documentation object
 * 
 * @example
 * ```tsx
 * const ButtonDoc = generateComponentDoc<ButtonProps>({
 *   displayName: 'Button',
 *   description: 'A clickable button component',
 *   props: {
 *     variant: {
 *       description: 'Button style variant',
 *       type: 'primary | secondary | ghost',
 *       defaultValue: 'primary',
 *       values: ['primary', 'secondary', 'ghost']
 *     }
 *   }
 * });
 * ```
 */
export function generateComponentDoc<Props>(
  config: ComponentDoc<Props>
): ComponentDoc<Props> {
  return config;
}

/**
 * Document a React component with JSDoc
 * @template P - Component props type
 * @template C - Component type
 * @param component - The component to document
 * @param doc - Component documentation
 * @returns The component with documentation attached
 */
export function withDoc<
  P,
  C extends React.ComponentType<P>
>(component: C, doc: ComponentDoc<P>): C & { __docgenInfo: ComponentDoc<P> } {
  const documentedComponent = component as C & { __docgenInfo: ComponentDoc<P> };
  documentedComponent.__docgenInfo = doc;
  return documentedComponent;
}

/**
 * JSDoc type annotations for better IDE support
 */

/**
 * @typedef {Object} Size
 * @property {'xs'} xs - Extra small size
 * @property {'sm'} sm - Small size
 * @property {'md'} md - Medium size (default)
 * @property {'lg'} lg - Large size
 * @property {'xl'} xl - Extra large size
 */

/**
 * @typedef {Object} Variant
 * @property {'primary'} primary - Primary variant
 * @property {'secondary'} secondary - Secondary variant
 * @property {'tertiary'} tertiary - Tertiary variant
 * @property {'ghost'} ghost - Ghost variant
 * @property {'link'} link - Link variant
 */

/**
 * Extract prop types from component for documentation
 * @template T - Component type
 */
export type ExtractProps<T> = T extends React.ComponentType<infer P> ? P : never;

/**
 * Generate prop table markdown
 * @param props - Props documentation
 * @returns Markdown table string
 */
export function generatePropTable<T>(props: PropsDoc<T>): string {
  const rows = Object.entries(props).map(([name, doc]) => {
    const prop = doc as PropDoc;
    const required = prop.required ? '✓' : '';
    const defaultVal = prop.defaultValue !== undefined 
      ? `\`${JSON.stringify(prop.defaultValue)}\`` 
      : '-';
    return `| ${name} | ${prop.type} | ${required} | ${defaultVal} | ${prop.description} |`;
  });
  
  return [
    '| Prop | Type | Required | Default | Description |',
    '|------|------|----------|---------|-------------|',
    ...rows
  ].join('\n');
}

/**
 * Type annotation helpers for JSDoc
 */
export namespace JSDoc {
  /**
   * Mark a type as nullable
   * @template T
   */
  export type Nullable<T> = T | null;
  
  /**
   * Mark a type as optional
   * @template T
   */
  export type Optional<T> = T | undefined;
  
  /**
   * Mark a type as maybe (nullable and optional)
   * @template T
   */
  export type Maybe<T> = T | null | undefined;
  
  /**
   * Function that returns a value
   * @template T - Return type
   * @template Args - Argument types
   */
  export type Fn<T = void, Args extends any[] = any[]> = (...args: Args) => T;
  
  /**
   * Async function that returns a promise
   * @template T - Resolved type
   * @template Args - Argument types
   */
  export type AsyncFn<T = void, Args extends any[] = any[]> = (...args: Args) => Promise<T>;
  
  /**
   * React event handler
   * @template E - Event type
   */
  export type Handler<E = React.SyntheticEvent> = (event: E) => void;
  
  /**
   * Value or getter function
   * @template T
   */
  export type ValueOrGetter<T> = T | (() => T);
}

/**
 * Documentation decorators (for future use with decorators)
 */
export const Doc = {
  /**
   * Mark a prop as deprecated
   * @param message - Deprecation message
   */
  deprecated: (message: string) => {
    return (target: any, propertyKey: string) => {
      // Decorator implementation
    };
  },
  
  /**
   * Add description to a prop
   * @param description - Prop description
   */
  describe: (description: string) => {
    return (target: any, propertyKey: string) => {
      // Decorator implementation
    };
  },
  
  /**
   * Mark a prop as required
   */
  required: () => {
    return (target: any, propertyKey: string) => {
      // Decorator implementation
    };
  }
};