/**
 * Mapped types for theme customization
 */

import { CSSColor, CSSLength, CSSTime } from './css';

/**
 * Deep partial type
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * Deep merge type
 */
export type DeepMerge<T, U> = T extends object
  ? U extends object
    ? {
        [K in keyof T | keyof U]: K extends keyof T
          ? K extends keyof U
            ? DeepMerge<T[K], U[K]>
            : T[K]
          : K extends keyof U
          ? U[K]
          : never;
      }
    : U
  : U;

/**
 * Theme color palette
 */
export type ColorPalette = {
  50: CSSColor;
  100: CSSColor;
  200: CSSColor;
  300: CSSColor;
  400: CSSColor;
  500: CSSColor;
  600: CSSColor;
  700: CSSColor;
  800: CSSColor;
  900: CSSColor;
  950: CSSColor;
};

/**
 * Theme colors
 */
export type ThemeColors = {
  // Color palettes
  palettes: {
    primary: ColorPalette;
    secondary: ColorPalette;
    tertiary: ColorPalette;
    gray: ColorPalette;
    red: ColorPalette;
    orange: ColorPalette;
    yellow: ColorPalette;
    green: ColorPalette;
    blue: ColorPalette;
    indigo: ColorPalette;
    purple: ColorPalette;
    pink: ColorPalette;
  };
  
  // Semantic colors
  semantic: {
    background: CSSColor;
    foreground: CSSColor;
    card: CSSColor;
    cardForeground: CSSColor;
    popover: CSSColor;
    popoverForeground: CSSColor;
    primary: CSSColor;
    primaryForeground: CSSColor;
    secondary: CSSColor;
    secondaryForeground: CSSColor;
    muted: CSSColor;
    mutedForeground: CSSColor;
    accent: CSSColor;
    accentForeground: CSSColor;
    destructive: CSSColor;
    destructiveForeground: CSSColor;
    border: CSSColor;
    input: CSSColor;
    ring: CSSColor;
  };
};

/**
 * Theme spacing
 */
export type ThemeSpacing = {
  0: CSSLength;
  1: CSSLength;
  2: CSSLength;
  3: CSSLength;
  4: CSSLength;
  5: CSSLength;
  6: CSSLength;
  8: CSSLength;
  10: CSSLength;
  12: CSSLength;
  16: CSSLength;
  20: CSSLength;
  24: CSSLength;
  32: CSSLength;
  40: CSSLength;
  48: CSSLength;
  56: CSSLength;
  64: CSSLength;
};

/**
 * Theme typography
 */
export type ThemeTypography = {
  fonts: {
    sans: string;
    serif: string;
    mono: string;
  };
  fontSizes: {
    xs: CSSLength;
    sm: CSSLength;
    base: CSSLength;
    lg: CSSLength;
    xl: CSSLength;
    '2xl': CSSLength;
    '3xl': CSSLength;
    '4xl': CSSLength;
    '5xl': CSSLength;
    '6xl': CSSLength;
    '7xl': CSSLength;
    '8xl': CSSLength;
    '9xl': CSSLength;
  };
  fontWeights: {
    thin: 100;
    extralight: 200;
    light: 300;
    normal: 400;
    medium: 500;
    semibold: 600;
    bold: 700;
    extrabold: 800;
    black: 900;
  };
  lineHeights: {
    none: 1;
    tight: 1.25;
    snug: 1.375;
    normal: 1.5;
    relaxed: 1.625;
    loose: 2;
  };
  letterSpacings: {
    tighter: '-0.05em';
    tight: '-0.025em';
    normal: '0em';
    wide: '0.025em';
    wider: '0.05em';
    widest: '0.1em';
  };
};

/**
 * Theme shadows
 */
export type ThemeShadows = {
  none: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
};

/**
 * Theme animations
 */
export type ThemeAnimations = {
  durations: {
    fast: CSSTime;
    normal: CSSTime;
    slow: CSSTime;
  };
  easings: {
    linear: string;
    in: string;
    out: string;
    inOut: string;
    bounce: string;
  };
  transitions: {
    none: string;
    all: string;
    colors: string;
    opacity: string;
    shadow: string;
    transform: string;
  };
};

/**
 * Theme radii
 */
export type ThemeRadii = {
  none: CSSLength;
  sm: CSSLength;
  base: CSSLength;
  md: CSSLength;
  lg: CSSLength;
  xl: CSSLength;
  '2xl': CSSLength;
  '3xl': CSSLength;
  full: CSSLength;
};

/**
 * Complete theme type
 */
export type Theme = {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  shadows: ThemeShadows;
  animations: ThemeAnimations;
  radii: ThemeRadii;
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  zIndices: {
    hide: -1;
    base: 0;
    dropdown: 1000;
    sticky: 1100;
    overlay: 1200;
    modal: 1300;
    popover: 1400;
    tooltip: 1500;
  };
};

/**
 * Theme override type
 */
export type ThemeOverride = DeepPartial<Theme>;

/**
 * Theme factory type
 */
export type ThemeFactory<T extends Theme = Theme> = (base: T) => T;

/**
 * Theme token paths
 */
export type TokenPath<T, K extends keyof T = keyof T> = K extends string
  ? T[K] extends object
    ? `${K}.${TokenPath<T[K]>}`
    : K
  : never;

/**
 * Get token value type
 */
export type TokenValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? TokenValue<T[K], Rest>
    : never
  : P extends keyof T
  ? T[P]
  : never;