import { Page, test as base } from '@playwright/test';
import { join } from 'path';

/**
 * Visual regression test utilities for Re-Shell UI components
 */

export interface VisualTestOptions {
  fullPage?: boolean;
  clip?: { x: number; y: number; width: number; height: number };
  mask?: string[];
  maxDiffPixels?: number;
  threshold?: number;
  animations?: 'disabled' | 'allow';
}

/**
 * Enhanced test fixture with visual regression utilities
 */
export const test = base.extend<{
  takeSnapshot: (name: string, options?: VisualTestOptions) => Promise<void>;
  compareSnapshots: (baseline: string, current: string) => Promise<boolean>;
}>({
  takeSnapshot: async ({ page }, use) => {
    const takeSnapshot = async (name: string, options: VisualTestOptions = {}) => {
      // Wait for animations to complete
      if (options.animations !== 'allow') {
        await page.addStyleTag({
          content: `
            *, *::before, *::after {
              animation-duration: 0s !important;
              animation-delay: 0s !important;
              transition-duration: 0s !important;
              transition-delay: 0s !important;
            }
          `
        });
      }

      // Wait for fonts to load
      await page.evaluate(() => document.fonts.ready);

      // Wait for images to load
      await page.waitForLoadState('networkidle');

      // Take screenshot
      await page.screenshot({
        path: join('test-results', 'visual', `${name}.png`),
        fullPage: options.fullPage,
        clip: options.clip,
        mask: options.mask ? await Promise.all(
          options.mask.map(selector => page.locator(selector))
        ) : undefined,
      });
    };

    await use(takeSnapshot);
  },

  compareSnapshots: async ({}, use) => {
    const compareSnapshots = async (baseline: string, current: string) => {
      // This would integrate with a visual comparison tool
      // For now, return true as a placeholder
      console.log(`Comparing ${baseline} with ${current}`);
      return true;
    };

    await use(compareSnapshots);
  },
});

/**
 * Visual test scenarios for different viewport sizes
 */
export const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
  wide: { width: 1920, height: 1080 },
} as const;

/**
 * Test component in multiple viewports
 */
export async function testInViewports(
  page: Page,
  url: string,
  viewportTests: Array<keyof typeof viewports>
) {
  for (const viewport of viewportTests) {
    await page.setViewportSize(viewports[viewport]);
    await page.goto(url);
    await page.screenshot({
      path: join('test-results', 'visual', `${viewport}-${Date.now()}.png`),
    });
  }
}

/**
 * Test theme variations
 */
export async function testThemeVariations(
  page: Page,
  themes: string[] = ['light', 'dark']
) {
  for (const theme of themes) {
    await page.evaluate((theme) => {
      document.documentElement.setAttribute('data-theme', theme);
    }, theme);
    
    await page.waitForTimeout(100); // Wait for theme to apply
    
    await page.screenshot({
      path: join('test-results', 'visual', `theme-${theme}-${Date.now()}.png`),
    });
  }
}

/**
 * Test interaction states
 */
export async function testInteractionStates(
  page: Page,
  selector: string,
  states: Array<'default' | 'hover' | 'focus' | 'active' | 'disabled'> = ['default', 'hover', 'focus', 'active']
) {
  const element = page.locator(selector);
  
  for (const state of states) {
    switch (state) {
      case 'hover':
        await element.hover();
        break;
      case 'focus':
        await element.focus();
        break;
      case 'active':
        await element.click({ delay: 100 });
        break;
      case 'disabled':
        await element.evaluate(el => el.setAttribute('disabled', 'true'));
        break;
    }
    
    await page.screenshot({
      path: join('test-results', 'visual', `state-${state}-${Date.now()}.png`),
      clip: await element.boundingBox() || undefined,
    });
  }
}

/**
 * Test animation sequences
 */
export async function testAnimationSequence(
  page: Page,
  triggerSelector: string,
  animationDuration: number,
  frames: number = 5
) {
  const trigger = page.locator(triggerSelector);
  const frameDelay = animationDuration / frames;
  
  // Trigger animation
  await trigger.click();
  
  // Capture frames
  for (let i = 0; i < frames; i++) {
    await page.waitForTimeout(frameDelay);
    await page.screenshot({
      path: join('test-results', 'visual', `animation-frame-${i}.png`),
    });
  }
}

/**
 * Visual diff configuration
 */
export const visualDiffConfig = {
  // Threshold for pixel differences (0-1)
  threshold: 0.2,
  
  // Maximum allowed pixel differences
  maxDiffPixels: 100,
  
  // Ignore areas that commonly change
  ignoreAreas: [
    '.timestamp',
    '.dynamic-content',
    '[data-testid="ignore-visual"]',
  ],
  
  // Wait strategies
  waitStrategies: {
    fonts: async (page: Page) => page.evaluate(() => document.fonts.ready),
    animations: async (page: Page) => page.waitForTimeout(300),
    images: async (page: Page) => page.waitForLoadState('networkidle'),
  },
};

/**
 * Cross-browser visual testing
 */
export async function crossBrowserVisualTest(
  testFn: (page: Page) => Promise<void>,
  browsers: string[] = ['chromium', 'firefox', 'webkit']
) {
  for (const browserName of browsers) {
    await test(`Visual test in ${browserName}`, async ({ page, browserName }) => {
      await testFn(page);
      await page.screenshot({
        path: join('test-results', 'visual', `${browserName}-result.png`),
      });
    });
  }
}