import { Page, BrowserContext, devices } from '@playwright/test';

/**
 * Mobile device testing utilities for Re-Shell UI
 */

export interface MobileTestOptions {
  device?: keyof typeof devices;
  orientation?: 'portrait' | 'landscape';
  geolocation?: { latitude: number; longitude: number };
  permissions?: string[];
  offline?: boolean;
  throttleNetwork?: '3G' | '4G' | 'offline';
  reducedMotion?: boolean;
  colorScheme?: 'light' | 'dark' | 'no-preference';
}

/**
 * Mobile gesture simulator
 */
export class MobileGestures {
  constructor(private page: Page) {}

  async swipe(
    direction: 'left' | 'right' | 'up' | 'down',
    options: {
      distance?: number;
      duration?: number;
      startX?: number;
      startY?: number;
    } = {}
  ) {
    const { distance = 100, duration = 300 } = options;
    const viewport = this.page.viewportSize()!;
    
    const startX = options.startX ?? viewport.width / 2;
    const startY = options.startY ?? viewport.height / 2;
    
    let endX = startX;
    let endY = startY;
    
    switch (direction) {
      case 'left':
        endX = startX - distance;
        break;
      case 'right':
        endX = startX + distance;
        break;
      case 'up':
        endY = startY - distance;
        break;
      case 'down':
        endY = startY + distance;
        break;
    }
    
    await this.page.touchscreen.tap(startX, startY);
    await this.page.waitForTimeout(50);
    
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      const x = startX + (endX - startX) * (i / steps);
      const y = startY + (endY - startY) * (i / steps);
      await this.page.touchscreen.tap(x, y);
      await this.page.waitForTimeout(duration / steps);
    }
  }

  async pinch(scale: number, options: { duration?: number } = {}) {
    const { duration = 300 } = options;
    const viewport = this.page.viewportSize()!;
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;
    
    // Start with two fingers
    const finger1Start = { x: centerX - 50, y: centerY };
    const finger2Start = { x: centerX + 50, y: centerY };
    
    const finger1End = { x: centerX - 50 * scale, y: centerY };
    const finger2End = { x: centerX + 50 * scale, y: centerY };
    
    // Simulate pinch gesture
    await this.page.touchscreen.tap(finger1Start.x, finger1Start.y);
    await this.page.touchscreen.tap(finger2Start.x, finger2Start.y);
    
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      
      const x1 = finger1Start.x + (finger1End.x - finger1Start.x) * progress;
      const x2 = finger2Start.x + (finger2End.x - finger2Start.x) * progress;
      
      await this.page.touchscreen.tap(x1, centerY);
      await this.page.touchscreen.tap(x2, centerY);
      await this.page.waitForTimeout(duration / steps);
    }
  }

  async longPress(selector: string, duration: number = 500) {
    const element = await this.page.locator(selector).boundingBox();
    if (!element) throw new Error(`Element ${selector} not found`);
    
    const x = element.x + element.width / 2;
    const y = element.y + element.height / 2;
    
    await this.page.touchscreen.tap(x, y);
    await this.page.waitForTimeout(duration);
  }

  async doubleTap(selector: string) {
    const element = await this.page.locator(selector).boundingBox();
    if (!element) throw new Error(`Element ${selector} not found`);
    
    const x = element.x + element.width / 2;
    const y = element.y + element.height / 2;
    
    await this.page.touchscreen.tap(x, y);
    await this.page.waitForTimeout(100);
    await this.page.touchscreen.tap(x, y);
  }

  async rotate(angle: number) {
    // Simulate device rotation
    const currentViewport = this.page.viewportSize()!;
    const isPortrait = currentViewport.height > currentViewport.width;
    
    if ((angle === 90 || angle === 270) && isPortrait) {
      await this.page.setViewportSize({
        width: currentViewport.height,
        height: currentViewport.width,
      });
    } else if ((angle === 0 || angle === 180) && !isPortrait) {
      await this.page.setViewportSize({
        width: currentViewport.height,
        height: currentViewport.width,
      });
    }
  }
}

/**
 * Mobile viewport tester
 */
export async function testMobileViewports(
  page: Page,
  url: string,
  testFn: (device: string) => Promise<void>
) {
  const mobileDevices = [
    'iPhone 12',
    'iPhone 12 Pro',
    'iPhone 12 Mini',
    'iPhone SE',
    'Pixel 5',
    'Galaxy S21',
    'iPad',
    'iPad Pro',
  ];
  
  for (const deviceName of mobileDevices) {
    const device = devices[deviceName];
    if (!device) continue;
    
    await page.setViewportSize(device.viewport);
    await page.setUserAgent(device.userAgent);
    await page.goto(url);
    
    await testFn(deviceName);
  }
}

/**
 * Mobile performance metrics
 */
export async function measureMobilePerformance(page: Page) {
  // Measure First Contentful Paint
  const fcp = await page.evaluate(() => {
    const entry = performance.getEntriesByType('paint').find(
      e => e.name === 'first-contentful-paint'
    );
    return entry ? entry.startTime : null;
  });
  
  // Measure Largest Contentful Paint
  const lcp = await page.evaluate(() => {
    return new Promise<number>(resolve => {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    });
  });
  
  // Measure Time to Interactive
  const tti = await page.evaluate(() => {
    return new Promise<number>(resolve => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver(() => {
          resolve(performance.now());
        });
        observer.observe({ entryTypes: ['longtask'] });
        
        // Fallback after 5 seconds
        setTimeout(() => resolve(performance.now()), 5000);
      } else {
        resolve(performance.now());
      }
    });
  });
  
  // Measure Total Blocking Time
  const tbt = await page.evaluate(() => {
    let totalBlockingTime = 0;
    const longTasks = performance.getEntriesByType('longtask');
    
    longTasks.forEach(task => {
      const blockingTime = task.duration - 50;
      if (blockingTime > 0) {
        totalBlockingTime += blockingTime;
      }
    });
    
    return totalBlockingTime;
  });
  
  return {
    firstContentfulPaint: fcp,
    largestContentfulPaint: lcp,
    timeToInteractive: tti,
    totalBlockingTime: tbt,
  };
}

/**
 * Mobile network conditions
 */
export const networkProfiles = {
  '3G': {
    download: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
    upload: 750 * 1024 / 8, // 750 kbps
    latency: 150,
  },
  '4G': {
    download: 12 * 1024 * 1024 / 8, // 12 Mbps
    upload: 3 * 1024 * 1024 / 8, // 3 Mbps
    latency: 50,
  },
  'offline': {
    offline: true,
  },
};

/**
 * Touch interaction tester
 */
export async function testTouchInteractions(
  page: Page,
  component: string,
  interactions: Array<{
    type: 'tap' | 'swipe' | 'pinch' | 'longPress';
    target?: string;
    options?: any;
    expectation: () => Promise<void> | void;
  }>
) {
  const gestures = new MobileGestures(page);
  
  for (const interaction of interactions) {
    switch (interaction.type) {
      case 'tap':
        if (interaction.target) {
          await page.tap(interaction.target);
        }
        break;
        
      case 'swipe':
        await gestures.swipe(
          interaction.options?.direction || 'left',
          interaction.options
        );
        break;
        
      case 'pinch':
        await gestures.pinch(
          interaction.options?.scale || 0.5,
          interaction.options
        );
        break;
        
      case 'longPress':
        if (interaction.target) {
          await gestures.longPress(
            interaction.target,
            interaction.options?.duration
          );
        }
        break;
    }
    
    await interaction.expectation();
  }
}

/**
 * Mobile accessibility checker
 */
export async function checkMobileAccessibility(page: Page) {
  // Check touch target sizes
  const touchTargets = await page.evaluate(() => {
    const minSize = 44; // Apple's recommended minimum
    const elements = document.querySelectorAll('button, a, input, [role="button"]');
    const issues: string[] = [];
    
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width < minSize || rect.height < minSize) {
        issues.push(`${el.tagName} is too small: ${rect.width}x${rect.height}`);
      }
    });
    
    return issues;
  });
  
  // Check text readability
  const textReadability = await page.evaluate(() => {
    const minFontSize = 12;
    const elements = document.querySelectorAll('p, span, div, li');
    const issues: string[] = [];
    
    elements.forEach(el => {
      const style = window.getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      
      if (fontSize < minFontSize && el.textContent?.trim()) {
        issues.push(`Text too small: ${fontSize}px in ${el.tagName}`);
      }
    });
    
    return issues;
  });
  
  return {
    touchTargets,
    textReadability,
    passed: touchTargets.length === 0 && textReadability.length === 0,
  };
}

/**
 * Mobile-specific test configurations
 */
export const mobileTestConfig = {
  defaultTimeout: 30000,
  navigationTimeout: 60000, // Slower on mobile
  actionTimeout: 10000,
  retries: 2,
  video: {
    mode: 'on-first-retry',
    size: { width: 375, height: 812 },
  },
  screenshot: {
    mode: 'only-on-failure',
    fullPage: true,
  },
};