import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';

/**
 * Custom render function that includes common providers
 */
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: any;
  locale?: string;
  initialState?: any;
}

const AllTheProviders: React.FC<{ children: React.ReactNode; options?: CustomRenderOptions }> = ({ 
  children, 
  options = {} 
}) => {
  return <>{children}</>;
};

export function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  const user = userEvent.setup();
  
  const rendered = render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders options={options}>{children}</AllTheProviders>
    ),
    ...options,
  });

  return {
    ...rendered,
    user,
  };
}

/**
 * Wait for async updates
 */
export const waitForAsync = async (ms = 0) => {
  await new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Mock console methods
 */
export const mockConsole = () => {
  const originalConsole = { ...console };
  
  beforeAll(() => {
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
  });
  
  afterAll(() => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });
  
  return {
    log: console.log as any,
    warn: console.warn as any,
    error: console.error as any,
  };
};

/**
 * Create mock component props
 */
export function createMockProps<T>(overrides?: Partial<T>): T {
  return {
    ...overrides,
  } as T;
}

/**
 * Test accessibility
 */
export async function testA11y(
  ui: ReactElement,
  options?: CustomRenderOptions
): Promise<void> {
  const { container } = customRender(ui, options);
  
  // Basic accessibility checks
  const interactiveElements = container.querySelectorAll(
    'button, a, input, select, textarea, [role="button"], [role="link"]'
  );
  
  interactiveElements.forEach(element => {
    // Check for accessible name
    const hasAriaLabel = element.hasAttribute('aria-label');
    const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
    const hasTextContent = element.textContent?.trim() !== '';
    
    expect(
      hasAriaLabel || hasAriaLabelledBy || hasTextContent,
      `Element ${element.tagName} should have an accessible name`
    ).toBe(true);
    
    // Check for keyboard accessibility
    if (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA' && element.tagName !== 'SELECT') {
      const tabIndex = element.getAttribute('tabindex');
      expect(
        tabIndex === null || parseInt(tabIndex) >= 0,
        `Element ${element.tagName} should be keyboard accessible`
      ).toBe(true);
    }
  });
}

/**
 * Test keyboard navigation
 */
export async function testKeyboardNavigation(
  element: HTMLElement,
  key: string
): Promise<void> {
  element.focus();
  await userEvent.keyboard(key);
}

/**
 * Create a test harness for components
 */
export function createTestHarness<P>(
  Component: React.ComponentType<P>,
  defaultProps: P
) {
  return {
    render: (props?: Partial<P>, options?: CustomRenderOptions) => {
      return customRender(
        <Component {...defaultProps} {...props} />,
        options
      );
    },
    
    renderWithRef: (ref: React.Ref<any>, props?: Partial<P>) => {
      const ComponentWithRef = React.forwardRef<any, P>((props, ref) => (
        <Component {...props} ref={ref} />
      ));
      
      return customRender(
        <ComponentWithRef {...defaultProps} {...props} ref={ref} />
      );
    },
  };
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
export { userEvent };