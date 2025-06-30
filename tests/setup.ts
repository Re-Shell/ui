import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * Global test setup for Re-Shell UI
 */

// Extend matchers
declare global {
  namespace Vi {
    interface Assertion {
      toBeAccessible(): void;
      toHaveNoViolations(): void;
    }
  }
}

// Setup DOM environment
beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
  }));

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock requestAnimationFrame
  global.requestAnimationFrame = vi.fn().mockImplementation(cb => {
    setTimeout(cb, 0);
    return 0;
  });

  // Mock scrollTo
  window.scrollTo = vi.fn();
  Element.prototype.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();

  // Mock getComputedStyle
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = (element) => {
    const styles = originalGetComputedStyle(element);
    return {
      ...styles,
      getPropertyValue: (prop: string) => {
        return styles.getPropertyValue(prop) || '';
      },
    };
  };

  // Setup CSS custom properties
  document.documentElement.style.setProperty('--re-shell-primary', '#007bff');
  document.documentElement.style.setProperty('--re-shell-secondary', '#6c757d');
  document.documentElement.style.setProperty('--re-shell-success', '#28a745');
  document.documentElement.style.setProperty('--re-shell-danger', '#dc3545');
  document.documentElement.style.setProperty('--re-shell-warning', '#ffc107');
  document.documentElement.style.setProperty('--re-shell-info', '#17a2b8');
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  
  // Clear any test-specific DOM modifications
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

// Global teardown
afterAll(() => {
  vi.restoreAllMocks();
});

// Custom matchers
expect.extend({
  toBeAccessible(received) {
    // Simple accessibility check
    const element = received as HTMLElement;
    const issues: string[] = [];
    
    // Check for alt text on images
    const images = element.querySelectorAll('img');
    images.forEach(img => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        issues.push(`Image missing alt text: ${img.src}`);
      }
    });
    
    // Check for labels on form inputs
    const inputs = element.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const id = input.id;
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      
      if (!id || (!element.querySelector(`label[for="${id}"]`) && !ariaLabel && !ariaLabelledBy)) {
        issues.push(`Form input missing label: ${input.outerHTML}`);
      }
    });
    
    const pass = issues.length === 0;
    
    return {
      pass,
      message: () => pass
        ? 'Element is accessible'
        : `Accessibility issues found:\n${issues.join('\n')}`,
    };
  },
  
  toHaveNoViolations(received) {
    const violations = received as any[];
    const pass = violations.length === 0;
    
    return {
      pass,
      message: () => pass
        ? 'No accessibility violations found'
        : `Found ${violations.length} accessibility violations:\n${
            violations.map(v => `- ${v.description}`).join('\n')
          }`,
    };
  },
});

// Performance monitoring
if (process.env.VITEST_PERFORMANCE) {
  beforeAll(() => {
    performance.mark('test-suite-start');
  });
  
  afterAll(() => {
    performance.mark('test-suite-end');
    performance.measure('test-suite-duration', 'test-suite-start', 'test-suite-end');
    
    const measure = performance.getEntriesByName('test-suite-duration')[0];
    console.log(`Total test suite duration: ${measure.duration.toFixed(2)}ms`);
  });
}

// Error boundary for tests
window.addEventListener('error', (event) => {
  console.error('Uncaught error in test:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection in test:', event.reason);
});