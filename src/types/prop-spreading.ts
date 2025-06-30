/**
 * Type-safe prop spreading utilities
 */

import { AriaAttributes, DataAttributes, EventHandlers } from './props';

/**
 * Extract valid HTML attributes from props
 */
export type HTMLAttributes<T extends HTMLElement = HTMLElement> = 
  React.HTMLAttributes<T> & AriaAttributes & DataAttributes;

/**
 * Props that should be filtered out when spreading
 */
export type FilteredProps = {
  key?: React.Key;
  ref?: React.Ref<any>;
  __proto__?: any;
  __source?: any;
  __self?: any;
};

/**
 * Safe prop spreading type
 */
export type SafeSpreadProps<T, E extends HTMLElement = HTMLElement> = 
  Omit<T, keyof FilteredProps> & HTMLAttributes<E>;

/**
 * Split props into component props and HTML props
 */
export function splitProps<
  ComponentProps extends Record<string, any>,
  HTMLProps extends HTMLAttributes<any> = HTMLAttributes<HTMLDivElement>
>(
  props: ComponentProps & HTMLProps,
  componentPropKeys: readonly (keyof ComponentProps)[]
): [ComponentProps, HTMLProps] {
  const componentProps = {} as ComponentProps;
  const htmlProps = {} as HTMLProps;
  
  Object.keys(props).forEach((key) => {
    if (componentPropKeys.includes(key as keyof ComponentProps)) {
      (componentProps as any)[key] = (props as any)[key];
    } else if (isValidHTMLProp(key)) {
      (htmlProps as any)[key] = (props as any)[key];
    }
  });
  
  return [componentProps, htmlProps];
}

/**
 * Check if a prop is a valid HTML attribute
 */
export function isValidHTMLProp(prop: string): boolean {
  // Event handlers
  if (prop.startsWith('on') && prop[2]?.toUpperCase() === prop[2]) {
    return true;
  }
  
  // Data attributes
  if (prop.startsWith('data-')) {
    return true;
  }
  
  // Aria attributes
  if (prop.startsWith('aria-')) {
    return true;
  }
  
  // Common HTML attributes
  const validHTMLProps = new Set([
    'accept', 'acceptCharset', 'accessKey', 'action', 'allowFullScreen',
    'alt', 'async', 'autoComplete', 'autoFocus', 'autoPlay', 'capture',
    'cellPadding', 'cellSpacing', 'challenge', 'charSet', 'checked',
    'cite', 'classID', 'className', 'cols', 'colSpan', 'content',
    'contentEditable', 'contextMenu', 'controls', 'coords', 'crossOrigin',
    'data', 'dateTime', 'default', 'defer', 'dir', 'disabled', 'download',
    'draggable', 'encType', 'form', 'formAction', 'formEncType', 'formMethod',
    'formNoValidate', 'formTarget', 'frameBorder', 'headers', 'height',
    'hidden', 'high', 'href', 'hrefLang', 'htmlFor', 'httpEquiv', 'icon',
    'id', 'inputMode', 'integrity', 'is', 'keyParams', 'keyType', 'kind',
    'label', 'lang', 'list', 'loop', 'low', 'manifest', 'marginHeight',
    'marginWidth', 'max', 'maxLength', 'media', 'mediaGroup', 'method',
    'min', 'minLength', 'multiple', 'muted', 'name', 'nonce', 'noValidate',
    'open', 'optimum', 'pattern', 'placeholder', 'playsInline', 'poster',
    'preload', 'profile', 'radioGroup', 'readOnly', 'referrerPolicy', 'rel',
    'required', 'reversed', 'role', 'rows', 'rowSpan', 'sandbox', 'scope',
    'scoped', 'scrolling', 'seamless', 'selected', 'shape', 'size', 'sizes',
    'slot', 'span', 'spellCheck', 'src', 'srcDoc', 'srcLang', 'srcSet',
    'start', 'step', 'style', 'summary', 'tabIndex', 'target', 'title',
    'type', 'useMap', 'value', 'width', 'wmode', 'wrap'
  ]);
  
  return validHTMLProps.has(prop);
}

/**
 * Merge props with proper precedence
 */
export function mergeProps<T extends Record<string, any>>(
  ...propsList: (T | undefined)[]
): T {
  const result = {} as T;
  
  propsList.forEach((props) => {
    if (!props) return;
    
    Object.keys(props).forEach((key) => {
      const value = props[key];
      
      if (key === 'className') {
        // Merge classNames
        result[key as keyof T] = [result[key as keyof T], value]
          .filter(Boolean)
          .join(' ') as T[keyof T];
      } else if (key === 'style') {
        // Merge styles
        result[key as keyof T] = {
          ...(result[key as keyof T] as any || {}),
          ...(value || {})
        } as T[keyof T];
      } else if (key.startsWith('on') && typeof value === 'function') {
        // Chain event handlers
        const existingHandler = result[key as keyof T];
        if (existingHandler && typeof existingHandler === 'function') {
          result[key as keyof T] = ((...args: any[]) => {
            (existingHandler as any)(...args);
            value(...args);
          }) as T[keyof T];
        } else {
          result[key as keyof T] = value;
        }
      } else {
        // Override other props
        result[key as keyof T] = value;
      }
    });
  });
  
  return result;
}

/**
 * Filter out undefined props
 */
export function filterUndefinedProps<T extends Record<string, any>>(
  props: T
): Partial<T> {
  const result: Partial<T> = {};
  
  Object.keys(props).forEach((key) => {
    if (props[key] !== undefined) {
      result[key as keyof T] = props[key];
    }
  });
  
  return result;
}

/**
 * Extract event handlers from props
 */
export function extractEventHandlers<T extends Record<string, any>>(
  props: T
): [EventHandlers, Omit<T, keyof EventHandlers>] {
  const events: EventHandlers = {};
  const rest = {} as Omit<T, keyof EventHandlers>;
  
  Object.keys(props).forEach((key) => {
    if (key.startsWith('on') && typeof props[key] === 'function') {
      (events as any)[key] = props[key];
    } else {
      (rest as any)[key] = props[key];
    }
  });
  
  return [events, rest];
}

/**
 * Type-safe prop getter for compound components
 */
export function getPropGetter<
  Props extends Record<string, any>,
  RefType = any
>(
  props: Props,
  ref?: React.Ref<RefType>
): <AdditionalProps extends Record<string, any> = {}>(
  additionalProps?: AdditionalProps
) => Props & AdditionalProps & { ref?: React.Ref<RefType> } {
  return (additionalProps = {} as any) => ({
    ...props,
    ...additionalProps,
    ...(ref ? { ref } : {}),
    className: mergeProps(props, additionalProps as unknown as Props).className,
    style: mergeProps(props, additionalProps as unknown as Props).style,
  });
}

/**
 * Props delegation for wrapper components
 */
export type DelegatedProps<T extends React.ElementType> = 
  React.ComponentPropsWithRef<T>;

export function delegateProps<T extends React.ElementType>(
  Component: T,
  props: DelegatedProps<T>,
  overrides?: Partial<DelegatedProps<T>>
): DelegatedProps<T> {
  return mergeProps(props, overrides) as DelegatedProps<T>;
}

/**
 * Slot props pattern for compound components
 */
export type SlotProps<T extends Record<string, any> = {}> = T & {
  asChild?: boolean;
};

export function useSlotProps<T extends Record<string, any>>(
  props: SlotProps<T>,
  defaultProps?: Partial<T>
): T {
  const { asChild, ...restProps } = props;
  return mergeProps(defaultProps, restProps as T) as T;
}