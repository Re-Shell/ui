/**
 * Discriminated union types for component variants
 */

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Variant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'link';
export type Status = 'info' | 'success' | 'warning' | 'error';
export type Orientation = 'horizontal' | 'vertical';
export type Placement = 'top' | 'right' | 'bottom' | 'left';

/**
 * Component state variants
 */
export type ComponentState = 
  | { state: 'idle' }
  | { state: 'loading'; progress?: number }
  | { state: 'error'; error: Error }
  | { state: 'success'; data?: unknown }
  | { state: 'disabled'; reason?: string };

/**
 * Button variant discriminated union
 */
export type ButtonVariant = 
  | { variant: 'primary'; destructive?: never }
  | { variant: 'secondary'; destructive?: boolean }
  | { variant: 'tertiary'; destructive?: boolean }
  | { variant: 'ghost'; destructive?: boolean }
  | { variant: 'link'; underline?: boolean; destructive?: never };

/**
 * Input variant discriminated union
 */
export type InputVariant =
  | { type: 'text'; maxLength?: number; pattern?: string }
  | { type: 'number'; min?: number; max?: number; step?: number }
  | { type: 'email'; multiple?: boolean }
  | { type: 'password'; showToggle?: boolean; strengthMeter?: boolean }
  | { type: 'tel'; countryCode?: string }
  | { type: 'url'; protocols?: string[] }
  | { type: 'search'; suggestions?: string[] }
  | { type: 'date'; min?: string; max?: string }
  | { type: 'time'; min?: string; max?: string; step?: number }
  | { type: 'datetime-local'; min?: string; max?: string };

/**
 * Layout variant discriminated union
 */
export type LayoutVariant =
  | { type: 'stack'; spacing: Size; align?: 'start' | 'center' | 'end' | 'stretch' }
  | { type: 'grid'; columns: number | string; gap: Size }
  | { type: 'flex'; direction: 'row' | 'column'; wrap?: boolean; gap: Size }
  | { type: 'container'; maxWidth: Size | number; padding: Size }
  | { type: 'section'; fullWidth?: boolean; spacing: Size };

/**
 * Type guard for component state
 */
export function isLoadingState(state: ComponentState): state is { state: 'loading'; progress?: number } {
  return state.state === 'loading';
}

export function isErrorState(state: ComponentState): state is { state: 'error'; error: Error } {
  return state.state === 'error';
}

export function isSuccessState(state: ComponentState): state is { state: 'success'; data?: unknown } {
  return state.state === 'success';
}

export function isDisabledState(state: ComponentState): state is { state: 'disabled'; reason?: string } {
  return state.state === 'disabled';
}