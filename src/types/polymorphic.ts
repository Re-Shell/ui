import { ComponentPropsWithRef, ComponentPropsWithoutRef, ElementType, ReactElement } from 'react';

/**
 * Utility type to extract ref type from element type
 */
type PropsWithRef<E extends ElementType> = ComponentPropsWithRef<E>;

/**
 * Utility type to extract props without ref from element type
 */
type PropsWithoutRef<E extends ElementType> = ComponentPropsWithoutRef<E>;

/**
 * Polymorphic component prop type that supports the "as" prop
 */
export type PolymorphicComponentProp<
  E extends ElementType,
  P = {}
> = P & {
  as?: E;
} & Omit<PropsWithoutRef<E>, keyof P | 'as'>;

/**
 * Polymorphic component prop type with ref support
 */
export type PolymorphicComponentPropWithRef<
  E extends ElementType,
  P = {}
> = PolymorphicComponentProp<E, P> & {
  ref?: PropsWithRef<E>['ref'];
};

/**
 * Helper type for polymorphic component return type
 */
export type PolymorphicComponent<
  P = {},
  D extends ElementType = 'div'
> = <E extends ElementType = D>(
  props: PolymorphicComponentPropWithRef<E, P>
) => ReactElement | null;

/**
 * Extract the element type from polymorphic component props
 */
export type ElementTypeFromPolymorphicProp<
  P extends { as?: ElementType }
> = P['as'] extends ElementType ? P['as'] : never;

/**
 * Type guard to check if element is valid
 */
export function isValidElement<E extends ElementType>(
  element: any
): element is E {
  return typeof element === 'string' || typeof element === 'function';
}