/**
 * Compile-time CSS-in-TS validation system
 */

import { CSSColor, CSSLength, CSSTime } from './css';

/**
 * Valid CSS property names
 */
export type CSSPropertyName = keyof React.CSSProperties;

/**
 * CSS value validator type
 */
export type ValidCSSValue<T> = T extends CSSPropertyName
  ? React.CSSProperties[T]
  : never;

/**
 * Strict CSS properties with validated values
 */
export type StrictCSSProperties = {
  // Layout
  width?: CSSLength | 'auto' | 'fit-content' | 'max-content' | 'min-content';
  height?: CSSLength | 'auto' | 'fit-content' | 'max-content' | 'min-content';
  minWidth?: CSSLength | 'auto';
  maxWidth?: CSSLength | 'none';
  minHeight?: CSSLength | 'auto';
  maxHeight?: CSSLength | 'none';
  
  // Spacing
  margin?: CSSLength | 'auto';
  marginTop?: CSSLength | 'auto';
  marginRight?: CSSLength | 'auto';
  marginBottom?: CSSLength | 'auto';
  marginLeft?: CSSLength | 'auto';
  padding?: CSSLength;
  paddingTop?: CSSLength;
  paddingRight?: CSSLength;
  paddingBottom?: CSSLength;
  paddingLeft?: CSSLength;
  
  // Colors
  color?: CSSColor;
  backgroundColor?: CSSColor;
  borderColor?: CSSColor;
  outlineColor?: CSSColor;
  textDecorationColor?: CSSColor;
  
  // Borders
  borderWidth?: CSSLength;
  borderRadius?: CSSLength;
  
  // Typography
  fontSize?: CSSLength;
  lineHeight?: CSSLength | number;
  letterSpacing?: CSSLength;
  
  // Animation
  animationDuration?: CSSTime;
  animationDelay?: CSSTime;
  transitionDuration?: CSSTime;
  transitionDelay?: CSSTime;
};

/**
 * CSS property validator
 */
export class CSSValidator {
  private static lengthRegex = /^(-?\d*\.?\d+)(px|em|rem|%|vw|vh|vmin|vmax|ch|ex|cm|mm|in|pt|pc)$/;
  private static colorRegex = /^(#[0-9a-f]{3,8}|rgb\(|rgba\(|hsl\(|hsla\()/i;
  private static timeRegex = /^(\d*\.?\d+)(ms|s)$/;
  
  static isValidLength(value: unknown): value is CSSLength {
    if (value === 0 || value === 'auto') return true;
    if (typeof value !== 'string') return false;
    return this.lengthRegex.test(value);
  }
  
  static isValidColor(value: unknown): value is CSSColor {
    if (value === 'transparent' || value === 'currentColor') return true;
    if (typeof value !== 'string') return false;
    return this.colorRegex.test(value);
  }
  
  static isValidTime(value: unknown): value is CSSTime {
    if (typeof value !== 'string') return false;
    return this.timeRegex.test(value);
  }
  
  static validateProperty<K extends keyof StrictCSSProperties>(
    property: K,
    value: StrictCSSProperties[K]
  ): boolean {
    switch (property) {
      case 'width':
      case 'height':
      case 'minWidth':
      case 'maxWidth':
      case 'minHeight':
      case 'maxHeight':
      case 'margin':
      case 'marginTop':
      case 'marginRight':
      case 'marginBottom':
      case 'marginLeft':
      case 'padding':
      case 'paddingTop':
      case 'paddingRight':
      case 'paddingBottom':
      case 'paddingLeft':
      case 'borderWidth':
      case 'borderRadius':
      case 'fontSize':
      case 'letterSpacing':
        return this.isValidLength(value);
        
      case 'color':
      case 'backgroundColor':
      case 'borderColor':
      case 'outlineColor':
      case 'textDecorationColor':
        return this.isValidColor(value);
        
      case 'animationDuration':
      case 'animationDelay':
      case 'transitionDuration':
      case 'transitionDelay':
        return this.isValidTime(value);
        
      case 'lineHeight':
        return typeof value === 'number' || this.isValidLength(value);
        
      default:
        return true;
    }
  }
}

/**
 * Type-safe CSS object creator
 */
export function css<T extends StrictCSSProperties>(styles: T): T {
  if (process.env.NODE_ENV !== 'production') {
    Object.entries(styles).forEach(([property, value]) => {
      if (!CSSValidator.validateProperty(property as keyof StrictCSSProperties, value)) {
        console.warn(`Invalid CSS value for property "${property}": ${value}`);
      }
    });
  }
  return styles;
}

/**
 * Type-safe CSS variable creator
 */
export type CSSVariable<T = string> = `--${string}`;

export function cssVar<T extends string>(name: T): CSSVariable<T> {
  return `--${name}` as CSSVariable<T>;
}

/**
 * Type-safe CSS variable value getter
 */
export function getCSSVar(name: CSSVariable): string {
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue(name);
  }
  return '';
}

/**
 * Type-safe CSS variable setter
 */
export function setCSSVar(name: CSSVariable, value: string): void {
  if (typeof window !== 'undefined') {
    document.documentElement.style.setProperty(name, value);
  }
}

/**
 * CSS-in-TS template literal helper
 */
export function cssTemplate(
  strings: TemplateStringsArray,
  ...values: (CSSLength | CSSColor | CSSTime | string | number)[]
): string {
  return strings.reduce((result, str, i) => {
    const value = values[i - 1];
    return result + (value ?? '') + str;
  });
}

/**
 * Media query type helpers
 */
export type MediaQuery = 
  | `@media (min-width: ${string})`
  | `@media (max-width: ${string})`
  | `@media (prefers-color-scheme: ${'dark' | 'light'})`
  | `@media (prefers-reduced-motion: ${'reduce' | 'no-preference'})`;

export type ResponsiveStyle<T> = T & {
  [K in MediaQuery]?: T;
};

/**
 * Keyframe type helper
 */
export type Keyframes = {
  from?: StrictCSSProperties;
  to?: StrictCSSProperties;
  [key: `${number}%`]: StrictCSSProperties;
};

/**
 * Animation creator with type safety
 */
export function keyframes(frames: Keyframes): string {
  const keyframeRules = Object.entries(frames)
    .map(([key, styles]) => {
      const cssString = Object.entries(styles)
        .map(([prop, value]) => `${prop}: ${value};`)
        .join(' ');
      return `${key} { ${cssString} }`;
    })
    .join(' ');
    
  return `@keyframes animation-${Date.now()} { ${keyframeRules} }`;
}