/**
 * Template literal types for dynamic prop generation and conditional types
 */

import { Size } from './variants';

/**
 * Responsive prop type generator
 */
export type ResponsiveProp<T> = T | {
  base?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
};

/**
 * Spacing prop generator
 */
export type SpacingProp = `${Size}` | number;
export type SpacingScale = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56 | 64;

export type MarginProps = {
  m?: ResponsiveProp<SpacingScale>;
  mt?: ResponsiveProp<SpacingScale>;
  mr?: ResponsiveProp<SpacingScale>;
  mb?: ResponsiveProp<SpacingScale>;
  ml?: ResponsiveProp<SpacingScale>;
  mx?: ResponsiveProp<SpacingScale>;
  my?: ResponsiveProp<SpacingScale>;
};

export type PaddingProps = {
  p?: ResponsiveProp<SpacingScale>;
  pt?: ResponsiveProp<SpacingScale>;
  pr?: ResponsiveProp<SpacingScale>;
  pb?: ResponsiveProp<SpacingScale>;
  pl?: ResponsiveProp<SpacingScale>;
  px?: ResponsiveProp<SpacingScale>;
  py?: ResponsiveProp<SpacingScale>;
};

/**
 * Conditional prop dependencies
 */
export type ConditionalProps<T extends Record<string, any>> = T extends { disabled: true }
  ? T & { onClick?: never; onFocus?: never }
  : T extends { loading: true }
  ? T & { onClick?: never }
  : T;

/**
 * Required if conditional type
 */
export type RequiredIf<T extends Record<string, any>, K extends keyof T, Condition extends boolean> = 
  Condition extends true 
    ? T & Required<Pick<T, K>>
    : T;

/**
 * Exclusive props - only one can be provided
 */
export type ExclusiveProps<T, K extends keyof T> = T &
  (
    | { [P in K]: T[P] } & { [P in Exclude<K, K>]?: never }
    | { [P in K]?: never }
  );

/**
 * Data attribute props
 */
export type DataAttributes = {
  [key: `data-${string}`]: string | number | boolean | undefined;
};

/**
 * ARIA attribute props
 */
export type AriaAttributes = {
  [key: `aria-${string}`]: string | number | boolean | undefined;
};

/**
 * Event handler props with proper types
 */
export type EventHandlers<T = Element> = {
  onClick?: (event: React.MouseEvent<T>) => void;
  onDoubleClick?: (event: React.MouseEvent<T>) => void;
  onMouseDown?: (event: React.MouseEvent<T>) => void;
  onMouseUp?: (event: React.MouseEvent<T>) => void;
  onMouseEnter?: (event: React.MouseEvent<T>) => void;
  onMouseLeave?: (event: React.MouseEvent<T>) => void;
  onMouseMove?: (event: React.MouseEvent<T>) => void;
  onKeyDown?: (event: React.KeyboardEvent<T>) => void;
  onKeyUp?: (event: React.KeyboardEvent<T>) => void;
  onKeyPress?: (event: React.KeyboardEvent<T>) => void;
  onFocus?: (event: React.FocusEvent<T>) => void;
  onBlur?: (event: React.FocusEvent<T>) => void;
  onChange?: (event: React.ChangeEvent<T>) => void;
  onInput?: (event: React.FormEvent<T>) => void;
  onSubmit?: (event: React.FormEvent<T>) => void;
};

/**
 * Style prop with CSS variable support
 */
export type StyleProp = React.CSSProperties & {
  [key: `--${string}`]: string | number;
};

/**
 * Component base props
 */
export type BaseComponentProps<T = HTMLDivElement> = {
  id?: string;
  className?: string;
  style?: StyleProp;
  children?: React.ReactNode;
  ref?: React.Ref<T>;
} & DataAttributes & AriaAttributes & EventHandlers<T>;

/**
 * Styled component props
 */
export type StyledComponentProps = MarginProps & PaddingProps & {
  display?: ResponsiveProp<'none' | 'block' | 'inline' | 'inline-block' | 'flex' | 'inline-flex' | 'grid' | 'inline-grid'>;
  position?: ResponsiveProp<'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'>;
  width?: ResponsiveProp<string | number>;
  height?: ResponsiveProp<string | number>;
  minWidth?: ResponsiveProp<string | number>;
  maxWidth?: ResponsiveProp<string | number>;
  minHeight?: ResponsiveProp<string | number>;
  maxHeight?: ResponsiveProp<string | number>;
};