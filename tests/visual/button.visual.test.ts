import { test, expect } from '@playwright/test';
import { 
  testInViewports, 
  testThemeVariations, 
  testInteractionStates,
  viewports 
} from './visual-test-utils';

test.describe('Button Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to button component in Storybook
    await page.goto('/iframe.html?id=components-button--default');
    await page.waitForLoadState('networkidle');
  });

  test('default button appearance', async ({ page }) => {
    await expect(page.locator('button')).toBeVisible();
    await page.screenshot({ 
      path: 'test-results/visual/button-default.png',
      fullPage: false 
    });
  });

  test('button variants', async ({ page }) => {
    const variants = ['primary', 'secondary', 'outline', 'ghost', 'danger'];
    
    for (const variant of variants) {
      await page.goto(`/iframe.html?id=components-button--${variant}`);
      await page.waitForLoadState('networkidle');
      
      const button = page.locator('button');
      await expect(button).toBeVisible();
      
      await page.screenshot({
        path: `test-results/visual/button-${variant}.png`,
        clip: await button.boundingBox() || undefined,
      });
    }
  });

  test('button sizes', async ({ page }) => {
    const sizes = ['small', 'medium', 'large'];
    
    for (const size of sizes) {
      await page.goto(`/iframe.html?id=components-button--${size}`);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({
        path: `test-results/visual/button-size-${size}.png`,
      });
    }
  });

  test('button states', async ({ page }) => {
    await testInteractionStates(page, 'button', ['default', 'hover', 'focus', 'active', 'disabled']);
  });

  test('button with icons', async ({ page }) => {
    await page.goto('/iframe.html?id=components-button--with-icon');
    await page.waitForLoadState('networkidle');
    
    const positions = ['left', 'right', 'only'];
    
    for (const position of positions) {
      await page.goto(`/iframe.html?id=components-button--icon-${position}`);
      await page.screenshot({
        path: `test-results/visual/button-icon-${position}.png`,
      });
    }
  });

  test('button loading state', async ({ page }) => {
    await page.goto('/iframe.html?id=components-button--loading');
    await page.waitForLoadState('networkidle');
    
    // Capture loading animation frames
    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(200);
      await page.screenshot({
        path: `test-results/visual/button-loading-frame-${i}.png`,
      });
    }
  });

  test('button in different themes', async ({ page }) => {
    await testThemeVariations(page, ['light', 'dark', 'high-contrast']);
  });

  test('button responsive behavior', async ({ page }) => {
    await testInViewports(page, '/iframe.html?id=components-button--responsive', ['mobile', 'tablet', 'desktop']);
  });

  test('button group visual test', async ({ page }) => {
    await page.goto('/iframe.html?id=components-button-group--default');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: 'test-results/visual/button-group.png',
    });
    
    // Test different orientations
    const orientations = ['horizontal', 'vertical'];
    for (const orientation of orientations) {
      await page.goto(`/iframe.html?id=components-button-group--${orientation}`);
      await page.screenshot({
        path: `test-results/visual/button-group-${orientation}.png`,
      });
    }
  });

  test('button focus visible styles', async ({ page }) => {
    const button = page.locator('button');
    
    // Test keyboard focus vs mouse focus
    await button.focus();
    await page.screenshot({
      path: 'test-results/visual/button-keyboard-focus.png',
      clip: await button.boundingBox() || undefined,
    });
    
    await button.blur();
    await button.click();
    await page.screenshot({
      path: 'test-results/visual/button-mouse-focus.png',
      clip: await button.boundingBox() || undefined,
    });
  });

  test('button ripple effect', async ({ page }) => {
    await page.goto('/iframe.html?id=components-button--with-ripple');
    
    const button = page.locator('button');
    const box = await button.boundingBox();
    
    if (box) {
      // Click at center to trigger ripple
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      
      // Capture ripple animation
      for (let i = 0; i < 5; i++) {
        await page.waitForTimeout(50);
        await page.screenshot({
          path: `test-results/visual/button-ripple-${i}.png`,
          clip: box,
        });
      }
    }
  });

  test('button contrast ratios', async ({ page }) => {
    // This test would verify WCAG contrast requirements
    const button = page.locator('button');
    
    // Get computed styles
    const styles = await button.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        fontSize: computed.fontSize,
      };
    });
    
    // Log for manual verification (would integrate with contrast checking tool)
    console.log('Button styles for contrast check:', styles);
    
    await page.screenshot({
      path: 'test-results/visual/button-contrast-check.png',
    });
  });
});