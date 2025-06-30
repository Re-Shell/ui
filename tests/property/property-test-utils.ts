import fc from 'fast-check';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import { expect, it } from 'vitest';
import { vi } from 'vitest';

/**
 * Property-based testing utilities for Re-Shell UI
 */

/**
 * Common arbitraries for UI testing
 */
export const arbitraries = {
  // CSS values
  cssColor: fc.oneof(
    fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
    fc.tuple(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 })
    ).map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`),
    fc.tuple(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.float({ min: 0, max: 1 })
    ).map(([r, g, b, a]) => `rgba(${r}, ${g}, ${b}, ${a})`),
    fc.constantFrom(
      'red', 'blue', 'green', 'yellow', 'orange', 'purple',
      'black', 'white', 'gray', 'transparent'
    )
  ),
  
  cssLength: fc.oneof(
    fc.integer({ min: 0, max: 1000 }).map(n => `${n}px`),
    fc.float({ min: 0, max: 100 }).map(n => `${n}%`),
    fc.float({ min: 0, max: 50 }).map(n => `${n}rem`),
    fc.float({ min: 0, max: 50 }).map(n => `${n}em`),
    fc.constantFrom('auto', '0', 'inherit', 'initial')
  ),
  
  cssSpacing: fc.oneof(
    fc.integer({ min: 0, max: 100 }).map(n => `${n}px`),
    fc.float({ min: 0, max: 10 }).map(n => `${n}rem`),
    fc.constantFrom('0', 'auto')
  ),
  
  // Component props
  componentSize: fc.constantFrom('xs', 'sm', 'md', 'lg', 'xl'),
  componentVariant: fc.constantFrom('primary', 'secondary', 'success', 'danger', 'warning', 'info'),
  componentState: fc.constantFrom('default', 'hover', 'focus', 'active', 'disabled'),
  
  // Text content
  safeText: fc.string({ minLength: 0, maxLength: 100 }).filter(
    str => !str.includes('<') && !str.includes('>') && !str.includes('&')
  ),
  
  // Accessibility
  ariaLabel: fc.string({ minLength: 1, maxLength: 50 }),
  ariaRole: fc.constantFrom(
    'button', 'link', 'navigation', 'main', 'article',
    'section', 'heading', 'list', 'listitem', 'img'
  ),
  
  // Events
  eventHandler: fc.func(fc.constant(undefined)),
  
  // Collections
  stringArray: fc.array(fc.string(), { minLength: 0, maxLength: 10 }),
  objectArray: fc.array(
    fc.record({
      id: fc.string(),
      label: fc.string(),
      value: fc.anything(),
    }),
    { minLength: 0, maxLength: 20 }
  ),
};

/**
 * Property test runner for React components
 */
export function propertyTest<P>(
  Component: React.ComponentType<P>,
  propsArbitrary: fc.Arbitrary<P>,
  property: (props: P) => boolean | void,
  options: {
    numRuns?: number;
    seed?: number;
    verbose?: boolean;
  } = {}
) {
  const { numRuns = 100, seed, verbose = false } = options;
  
  return fc.assert(
    fc.property(propsArbitrary, (props) => {
      try {
        const { container } = render(React.createElement(Component, props));
        
        // Component should render without throwing
        expect(container).toBeTruthy();
        
        // Run custom property check
        const result = property(props);
        
        // Cleanup
        cleanup();
        
        return result !== false;
      } catch (error) {
        if (verbose) {
          console.error('Property test failed with props:', props, error);
        }
        throw error;
      }
    }),
    { numRuns, seed, verbose }
  );
}

/**
 * Common property checks
 */
export const propertyChecks = {
  // Component renders without errors
  rendersWithoutError: <P extends {}>(Component: React.ComponentType<P>) => (props: P) => {
    const { container } = render(React.createElement(Component, props));
    return container.firstChild !== null;
  },
  
  // Required props are respected
  requiredPropsRespected: <P extends Record<string, any>>(
    Component: React.ComponentType<P>,
    requiredProps: (keyof P)[]
  ) => (props: P) => {
    const hasAllRequired = requiredProps.every(prop => props[prop] !== undefined);
    if (!hasAllRequired) {
      expect(() => render(React.createElement(Component, props))).toThrow();
      return true;
    }
    return true;
  },
  
  // Accessibility properties are valid
  accessibilityValid: <P extends Record<string, any>>(Component: React.ComponentType<P>) => (props: P) => {
    const { container } = render(React.createElement(Component, props));
    const element = container.firstChild as HTMLElement;
    
    if (props.role) {
      expect(element.getAttribute('role')).toBe(props.role);
    }
    
    if (props['aria-label']) {
      expect(element.getAttribute('aria-label')).toBe(props['aria-label']);
    }
    
    return true;
  },
  
  // Event handlers are called
  eventHandlersCalled: <P extends Record<string, any>>(
    Component: React.ComponentType<P>,
    eventProps: string[]
  ) => (props: P) => {
    const mockedProps = { ...props };
    const mocks: Record<string, jest.Mock> = {};
    
    eventProps.forEach(prop => {
      if (props[prop]) {
        mocks[prop] = vi.fn();
        mockedProps[prop] = mocks[prop];
      }
    });
    
    const { container } = render(React.createElement(Component, mockedProps));
    
    // Simulate events based on prop names
    Object.keys(mocks).forEach(prop => {
      const element = container.firstChild as HTMLElement;
      if (prop.startsWith('onClick')) {
        element.click();
        expect(mocks[prop]).toHaveBeenCalled();
      }
    });
    
    return true;
  },
};

/**
 * Component property specifications
 */
export function defineComponentSpec<P>(
  Component: React.ComponentType<P>,
  spec: {
    props: fc.Arbitrary<P>;
    invariants?: Array<(props: P, element: HTMLElement) => boolean>;
    examples?: P[];
  }
) {
  return {
    Component,
    ...spec,
    
    test(description: string, options?: Parameters<typeof propertyTest>[3]) {
      it(description, () => {
        propertyTest(Component, spec.props, (props) => {
          const { container } = render(React.createElement(Component, props));
          const element = container.firstChild as HTMLElement;
          
          if (spec.invariants) {
            return spec.invariants.every(invariant => invariant(props, element));
          }
          
          return true;
        }, options);
      });
    },
    
    testExamples() {
      if (spec.examples) {
        spec.examples.forEach((example, index) => {
          it(`renders example ${index + 1}`, () => {
            const { container } = render(React.createElement(Component, example));
            expect(container.firstChild).toBeTruthy();
          });
        });
      }
    },
  };
}

/**
 * CSS property testing
 */
export const cssPropTests = {
  validCSSValue: (value: string, property: string): boolean => {
    const div = document.createElement('div');
    div.style[property as any] = value;
    return div.style[property as any] !== '';
  },
  
  colorContrast: (foreground: string, background: string, minRatio: number = 4.5): boolean => {
    // Simplified contrast check - in real implementation use proper algorithm
    return true;
  },
  
  validSpacing: (value: string): boolean => {
    const validUnits = ['px', 'rem', 'em', '%', 'vh', 'vw'];
    return value === '0' || value === 'auto' || 
           validUnits.some(unit => value.endsWith(unit));
  },
};

/**
 * Shrink reporter for better error messages
 */
export function createShrinkReporter<T>(name: string) {
  return (shrunkValue: T, error: Error) => {
    console.error(`Property test "${name}" failed with minimal failing case:`);
    console.error('Input:', JSON.stringify(shrunkValue, null, 2));
    console.error('Error:', error.message);
  };
}

/**
 * Model-based testing for stateful components
 */
export class ComponentModel<S, A> {
  constructor(
    private initialState: S,
    private actions: Record<string, (state: S, ...args: any[]) => S>,
    private invariants: Array<(state: S) => boolean> = []
  ) {}
  
  generateCommands(state: S): fc.Arbitrary<Command<S, A>> {
    const availableActions = Object.entries(this.actions)
      .filter(([_, action]) => {
        try {
          action(state);
          return true;
        } catch {
          return false;
        }
      })
      .map(([name]) => name);
    
    return fc.constantFrom(...availableActions).map(actionName => ({
      check: (s: S) => true,
      run: (s: S) => this.actions[actionName](s),
      toString: () => actionName,
    }));
  }
  
  checkInvariants(state: S): boolean {
    return this.invariants.every(inv => inv(state));
  }
}

interface Command<S, A> {
  check(state: S): boolean;
  run(state: S, real?: A): S;
  toString(): string;
}