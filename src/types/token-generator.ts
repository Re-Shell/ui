/**
 * Type generation from design tokens
 */

import { Theme, ThemeColors, ThemeSpacing, ThemeTypography } from './theme';
import { CSSColor, CSSLength } from './css';

/**
 * Design token structure
 */
export interface DesignToken<T = any> {
  name: string;
  value: T;
  type: 'color' | 'spacing' | 'typography' | 'shadow' | 'radius' | 'animation';
  description?: string;
  category?: string;
  metadata?: Record<string, any>;
}

/**
 * Design token collection
 */
export interface DesignTokens {
  colors: Record<string, DesignToken<CSSColor>>;
  spacing: Record<string, DesignToken<CSSLength>>;
  typography: Record<string, DesignToken<TypographyValue>>;
  shadows: Record<string, DesignToken<string>>;
  radii: Record<string, DesignToken<CSSLength>>;
  animations: Record<string, DesignToken<AnimationValue>>;
}

/**
 * Typography token value
 */
export interface TypographyValue {
  fontFamily: string;
  fontSize: CSSLength;
  fontWeight: number;
  lineHeight: number | CSSLength;
  letterSpacing?: CSSLength;
}

/**
 * Animation token value
 */
export interface AnimationValue {
  duration: string;
  easing: string;
  delay?: string;
}

/**
 * Generate TypeScript types from design tokens
 */
export class TokenTypeGenerator {
  /**
   * Generate color type from tokens
   */
  static generateColorType(tokens: Record<string, DesignToken<CSSColor>>): string {
    const properties = Object.entries(tokens)
      .map(([key, token]) => `  ${key}: '${token.value}';`)
      .join('\n');
    
    return `export interface GeneratedColors {\n${properties}\n}`;
  }
  
  /**
   * Generate spacing type from tokens
   */
  static generateSpacingType(tokens: Record<string, DesignToken<CSSLength>>): string {
    const properties = Object.entries(tokens)
      .map(([key, token]) => `  ${key}: '${token.value}';`)
      .join('\n');
    
    return `export interface GeneratedSpacing {\n${properties}\n}`;
  }
  
  /**
   * Generate complete theme type from tokens
   */
  static generateThemeType(tokens: DesignTokens): string {
    const sections = [
      this.generateColorType(tokens.colors),
      this.generateSpacingType(tokens.spacing),
      this.generateTypographyType(tokens.typography),
      this.generateShadowType(tokens.shadows),
      this.generateRadiusType(tokens.radii),
      this.generateAnimationType(tokens.animations)
    ];
    
    return sections.join('\n\n');
  }
  
  /**
   * Generate typography type from tokens
   */
  static generateTypographyType(tokens: Record<string, DesignToken<TypographyValue>>): string {
    const properties = Object.entries(tokens)
      .map(([key, token]) => {
        const { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing } = token.value;
        return `  ${key}: {
    fontFamily: '${fontFamily}';
    fontSize: '${fontSize}';
    fontWeight: ${fontWeight};
    lineHeight: ${typeof lineHeight === 'string' ? `'${lineHeight}'` : lineHeight};${
    letterSpacing ? `\n    letterSpacing: '${letterSpacing}';` : ''
  }
  };`;
      })
      .join('\n');
    
    return `export interface GeneratedTypography {\n${properties}\n}`;
  }
  
  /**
   * Generate shadow type from tokens
   */
  static generateShadowType(tokens: Record<string, DesignToken<string>>): string {
    const properties = Object.entries(tokens)
      .map(([key, token]) => `  ${key}: '${token.value}';`)
      .join('\n');
    
    return `export interface GeneratedShadows {\n${properties}\n}`;
  }
  
  /**
   * Generate radius type from tokens
   */
  static generateRadiusType(tokens: Record<string, DesignToken<CSSLength>>): string {
    const properties = Object.entries(tokens)
      .map(([key, token]) => `  ${key}: '${token.value}';`)
      .join('\n');
    
    return `export interface GeneratedRadii {\n${properties}\n}`;
  }
  
  /**
   * Generate animation type from tokens
   */
  static generateAnimationType(tokens: Record<string, DesignToken<AnimationValue>>): string {
    const properties = Object.entries(tokens)
      .map(([key, token]) => {
        const { duration, easing, delay } = token.value;
        return `  ${key}: {
    duration: '${duration}';
    easing: '${easing}';${delay ? `\n    delay: '${delay}';` : ''}
  };`;
      })
      .join('\n');
    
    return `export interface GeneratedAnimations {\n${properties}\n}`;
  }
}

/**
 * Token transformer for runtime usage
 */
export class TokenTransformer {
  /**
   * Transform design tokens to theme object
   */
  static tokensToTheme(tokens: DesignTokens): Partial<Theme> {
    return {
      colors: this.transformColors(tokens.colors) as any,
      spacing: this.transformSpacing(tokens.spacing) as any,
      typography: this.transformTypography(tokens.typography) as any,
      shadows: this.transformShadows(tokens.shadows) as any,
      radii: this.transformRadii(tokens.radii) as any,
      animations: this.transformAnimations(tokens.animations) as any
    };
  }
  
  private static transformColors(tokens: Record<string, DesignToken<CSSColor>>): Partial<ThemeColors> {
    const colors: any = { palettes: {}, semantic: {} };
    
    Object.entries(tokens).forEach(([key, token]) => {
      if (key.includes('.')) {
        const [palette, shade] = key.split('.');
        if (!colors.palettes[palette]) {
          colors.palettes[palette] = {};
        }
        colors.palettes[palette][shade] = token.value;
      } else {
        colors.semantic[key] = token.value;
      }
    });
    
    return colors;
  }
  
  private static transformSpacing(tokens: Record<string, DesignToken<CSSLength>>): Partial<ThemeSpacing> {
    const spacing: any = {};
    
    Object.entries(tokens).forEach(([key, token]) => {
      spacing[key] = token.value;
    });
    
    return spacing;
  }
  
  private static transformTypography(tokens: Record<string, DesignToken<TypographyValue>>): Partial<ThemeTypography> {
    const typography: any = {
      fonts: {},
      fontSizes: {},
      fontWeights: {},
      lineHeights: {},
      letterSpacings: {}
    };
    
    Object.entries(tokens).forEach(([key, token]) => {
      const value = token.value;
      if (key.startsWith('font.')) {
        const fontKey = key.replace('font.', '');
        typography.fonts[fontKey] = value.fontFamily;
      } else if (key.startsWith('size.')) {
        const sizeKey = key.replace('size.', '');
        typography.fontSizes[sizeKey] = value.fontSize;
      }
    });
    
    return typography;
  }
  
  private static transformShadows(tokens: Record<string, DesignToken<string>>): Record<string, string> {
    const shadows: Record<string, string> = {};
    
    Object.entries(tokens).forEach(([key, token]) => {
      shadows[key] = token.value;
    });
    
    return shadows;
  }
  
  private static transformRadii(tokens: Record<string, DesignToken<CSSLength>>): Record<string, CSSLength> {
    const radii: Record<string, CSSLength> = {};
    
    Object.entries(tokens).forEach(([key, token]) => {
      radii[key] = token.value;
    });
    
    return radii;
  }
  
  private static transformAnimations(tokens: Record<string, DesignToken<AnimationValue>>): any {
    const animations: any = {
      durations: {},
      easings: {},
      transitions: {}
    };
    
    Object.entries(tokens).forEach(([key, token]) => {
      const value = token.value;
      if (key.includes('duration')) {
        animations.durations[key.replace('.duration', '')] = value.duration;
      } else if (key.includes('easing')) {
        animations.easings[key.replace('.easing', '')] = value.easing;
      }
    });
    
    return animations;
  }
}

/**
 * Token validation
 */
export class TokenValidator {
  static validateColorToken(token: DesignToken<CSSColor>): boolean {
    // Validate color format
    const colorRegex = /^(#[0-9a-f]{3,8}|rgb|rgba|hsl|hsla|transparent|currentColor)/i;
    return colorRegex.test(token.value);
  }
  
  static validateSpacingToken(token: DesignToken<CSSLength>): boolean {
    // Validate spacing format
    const spacingRegex = /^(-?\d*\.?\d+)(px|em|rem|%|vw|vh)$/;
    return token.value === 0 || spacingRegex.test(token.value.toString());
  }
  
  static validateTokens(tokens: DesignTokens): ValidationResult {
    const errors: string[] = [];
    
    // Validate colors
    Object.entries(tokens.colors).forEach(([key, token]) => {
      if (!this.validateColorToken(token)) {
        errors.push(`Invalid color token: ${key}`);
      }
    });
    
    // Validate spacing
    Object.entries(tokens.spacing).forEach(([key, token]) => {
      if (!this.validateSpacingToken(token)) {
        errors.push(`Invalid spacing token: ${key}`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Create type-safe token getter
 */
export function createTokenGetter<T extends DesignTokens>(tokens: T) {
  return {
    color: (path: keyof T['colors']): CSSColor => tokens.colors[path as string].value,
    spacing: (path: keyof T['spacing']): CSSLength => tokens.spacing[path as string].value,
    typography: (path: keyof T['typography']): TypographyValue => tokens.typography[path as string].value,
    shadow: (path: keyof T['shadows']): string => tokens.shadows[path as string].value,
    radius: (path: keyof T['radii']): CSSLength => tokens.radii[path as string].value,
    animation: (path: keyof T['animations']): AnimationValue => tokens.animations[path as string].value,
  };
}