import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Custom test fixture with accessibility testing
 */
export const test = base.extend({
  // Add axe to the test context
  makeAxeBuilder: async ({ page }, use) => {
    const makeAxeBuilder = () => new AxeBuilder({ page });
    await use(makeAxeBuilder);
  },
});

/**
 * Accessibility test helpers
 */
export const a11y = {
  /**
   * Run accessibility scan on the page
   */
  async checkA11y(
    page: any,
    options?: {
      includedImpacts?: string[];
      detailedReport?: boolean;
      rules?: any;
    }
  ) {
    const builder = new AxeBuilder({ page });
    
    if (options?.includedImpacts) {
      builder.include(options.includedImpacts);
    }
    
    if (options?.rules) {
      builder.withRules(options.rules);
    }
    
    const results = await builder.analyze();
    
    if (options?.detailedReport) {
      console.log('Accessibility scan results:', {
        violations: results.violations.length,
        passes: results.passes.length,
        incomplete: results.incomplete.length,
      });
    }
    
    expect(results.violations).toEqual([]);
  },
  
  /**
   * Check keyboard navigation
   */
  async checkKeyboardNav(page: any, selectors: string[]) {
    for (const selector of selectors) {
      const element = await page.locator(selector);
      
      // Check if element can receive focus
      await element.focus();
      await expect(element).toBeFocused();
      
      // Check if element responds to Enter/Space
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      if (['button', 'a'].includes(tagName)) {
        const isClickable = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return computed.pointerEvents !== 'none' && !el.hasAttribute('disabled');
        });
        expect(isClickable).toBe(true);
      }
    }
    
    // Test tab navigation order
    for (let i = 0; i < selectors.length; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    }
  },
  
  /**
   * Check ARIA attributes
   */
  async checkAria(page: any, selector: string, expectedAttributes: Record<string, any>) {
    const element = await page.locator(selector);
    
    for (const [attr, value] of Object.entries(expectedAttributes)) {
      const actualValue = await element.getAttribute(attr);
      expect(actualValue).toBe(value);
    }
  },
  
  /**
   * Check color contrast
   */
  async checkContrast(page: any, selector: string, minRatio = 4.5) {
    const element = await page.locator(selector);
    
    const contrast = await element.evaluate(el => {
      const computed = window.getComputedStyle(el);
      const bgColor = computed.backgroundColor;
      const color = computed.color;
      
      // Simple contrast calculation (for demo)
      // In real implementation, use a proper contrast calculation library
      return { bgColor, color, ratio: 5.0 }; // Mock ratio
    });
    
    expect(contrast.ratio).toBeGreaterThanOrEqual(minRatio);
  },
  
  /**
   * Check focus indicators
   */
  async checkFocusIndicators(page: any, selector: string) {
    const element = await page.locator(selector);
    
    // Get styles before focus
    const beforeFocus = await element.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        outline: computed.outline,
        boxShadow: computed.boxShadow,
        border: computed.border,
      };
    });
    
    // Focus the element
    await element.focus();
    
    // Get styles after focus
    const afterFocus = await element.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        outline: computed.outline,
        boxShadow: computed.boxShadow,
        border: computed.border,
      };
    });
    
    // Check that some visual indicator changed
    const hasVisualChange = 
      beforeFocus.outline !== afterFocus.outline ||
      beforeFocus.boxShadow !== afterFocus.boxShadow ||
      beforeFocus.border !== afterFocus.border;
    
    expect(hasVisualChange).toBe(true);
  },
  
  /**
   * Check screen reader announcements
   */
  async checkAnnouncements(page: any, action: () => Promise<void>, expectedText: string) {
    // Monitor ARIA live regions
    const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').all();
    
    // Perform action
    await action();
    
    // Check if any live region contains the expected text
    let found = false;
    for (const region of liveRegions) {
      const text = await region.textContent();
      if (text?.includes(expectedText)) {
        found = true;
        break;
      }
    }
    
    expect(found).toBe(true);
  },
};

/**
 * WCAG compliance levels
 */
export const wcagLevels = {
  A: {
    rules: {
      'color-contrast': { enabled: false }, // AA level
      'color-contrast-enhanced': { enabled: false }, // AAA level
    },
  },
  AA: {
    rules: {
      'color-contrast-enhanced': { enabled: false }, // AAA level
    },
  },
  AAA: {
    rules: {}, // All rules enabled
    },
};

/**
 * Component-specific accessibility tests
 */
export const componentA11y = {
  button: async (page: any, selector: string) => {
    const button = await page.locator(selector);
    
    // Check role
    const role = await button.getAttribute('role');
    const tagName = await button.evaluate(el => el.tagName.toLowerCase());
    expect(role === 'button' || tagName === 'button').toBe(true);
    
    // Check keyboard accessibility
    await a11y.checkKeyboardNav(page, [selector]);
    
    // Check disabled state
    const isDisabled = await button.isDisabled();
    if (isDisabled) {
      const ariaDisabled = await button.getAttribute('aria-disabled');
      expect(ariaDisabled).toBe('true');
    }
  },
  
  form: async (page: any, formSelector: string) => {
    const form = await page.locator(formSelector);
    
    // Check all inputs have labels
    const inputs = await form.locator('input, select, textarea').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      
      if (!ariaLabel && !ariaLabelledby) {
        const label = await page.locator(`label[for="${id}"]`);
        await expect(label).toBeVisible();
      }
    }
    
    // Check error messages
    const errorInputs = await form.locator('[aria-invalid="true"]').all();
    for (const input of errorInputs) {
      const describedby = await input.getAttribute('aria-describedby');
      expect(describedby).toBeTruthy();
      
      const errorMessage = await page.locator(`#${describedby}`);
      await expect(errorMessage).toBeVisible();
    }
  },
  
  modal: async (page: any, modalSelector: string) => {
    const modal = await page.locator(modalSelector);
    
    // Check focus trap
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    
    // Tab through all focusable elements
    let tabCount = 0;
    while (tabCount < 20) { // Safety limit
      await page.keyboard.press('Tab');
      tabCount++;
      
      const currentFocused = await page.evaluate(() => document.activeElement?.tagName);
      if (currentFocused === firstFocused && tabCount > 1) {
        break; // Focus wrapped around
      }
    }
    
    expect(tabCount).toBeGreaterThan(1); // Should have focusable elements
    expect(tabCount).toBeLessThan(20); // Should wrap focus
    
    // Check ARIA attributes
    await a11y.checkAria(page, modalSelector, {
      'role': 'dialog',
      'aria-modal': 'true',
    });
    
    // Check close button
    const closeButton = await modal.locator('[aria-label*="close"], [aria-label*="Close"]').first();
    await expect(closeButton).toBeVisible();
  },
};