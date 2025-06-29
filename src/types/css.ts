/**
 * Branded types for CSS units and values
 */

declare const brand: unique symbol;

/**
 * Branded type helper
 */
type Brand<K, T> = K & { [brand]: T };

/**
 * CSS Length units
 */
export type Px = Brand<number, 'px'>;
export type Em = Brand<number, 'em'>;
export type Rem = Brand<number, 'rem'>;
export type Percent = Brand<number, '%'>;
export type Vw = Brand<number, 'vw'>;
export type Vh = Brand<number, 'vh'>;

export type CSSLength = Px | Em | Rem | Percent | Vw | Vh | 0 | 'auto';

/**
 * CSS Color types
 */
export type HexColor = Brand<string, 'hex'>;
export type RgbColor = Brand<string, 'rgb'>;
export type RgbaColor = Brand<string, 'rgba'>;
export type HslColor = Brand<string, 'hsl'>;
export type HslaColor = Brand<string, 'hsla'>;

export type CSSColor = HexColor | RgbColor | RgbaColor | HslColor | HslaColor | 'transparent' | 'currentColor';

/**
 * CSS Time units
 */
export type Ms = Brand<number, 'ms'>;
export type Seconds = Brand<number, 's'>;

export type CSSTime = Ms | Seconds;

/**
 * Type constructors
 */
export const px = (value: number): Px => value as Px;
export const em = (value: number): Em => value as Em;
export const rem = (value: number): Rem => value as Rem;
export const percent = (value: number): Percent => value as Percent;
export const vw = (value: number): Vw => value as Vw;
export const vh = (value: number): Vh => value as Vh;

export const ms = (value: number): Ms => value as Ms;
export const seconds = (value: number): Seconds => value as Seconds;

export const hex = (value: string): HexColor => {
  if (!/^#[0-9A-F]{6}$/i.test(value) && !/^#[0-9A-F]{3}$/i.test(value)) {
    throw new Error(`Invalid hex color: ${value}`);
  }
  return value as HexColor;
};

export const rgb = (r: number, g: number, b: number): RgbColor => {
  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
    throw new Error('RGB values must be between 0 and 255');
  }
  return `rgb(${r}, ${g}, ${b})` as RgbColor;
};

export const rgba = (r: number, g: number, b: number, a: number): RgbaColor => {
  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255 || a < 0 || a > 1) {
    throw new Error('RGB values must be between 0 and 255, alpha must be between 0 and 1');
  }
  return `rgba(${r}, ${g}, ${b}, ${a})` as RgbaColor;
};

/**
 * Type guards
 */
export function isPx(value: CSSLength): value is Px {
  return typeof value === 'number' && value !== 0;
}

export function isPercent(value: CSSLength): value is Percent {
  return typeof value === 'number' && value !== 0;
}

export function isAuto(value: CSSLength): value is 'auto' {
  return value === 'auto';
}

export function isHexColor(value: CSSColor): value is HexColor {
  return typeof value === 'string' && value.startsWith('#');
}

export function isRgbColor(value: CSSColor): value is RgbColor {
  return typeof value === 'string' && value.startsWith('rgb(');
}

export function isRgbaColor(value: CSSColor): value is RgbaColor {
  return typeof value === 'string' && value.startsWith('rgba(');
}