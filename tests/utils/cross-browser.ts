import { Browser, BrowserContext, Page, chromium, firefox, webkit } from 'playwright';

/**
 * Cross-browser testing utilities for Re-Shell UI
 */

export type BrowserName = 'chromium' | 'firefox' | 'webkit';

export interface CrossBrowserTestOptions {
  browsers?: BrowserName[];
  viewport?: { width: number; height: number };
  deviceScaleFactor?: number;
  hasTouch?: boolean;
  isMobile?: boolean;
  locale?: string;
  timezone?: string;
  geolocation?: { latitude: number; longitude: number };
  permissions?: string[];
}

/**
 * Cross-browser test runner
 */
export class CrossBrowserTestRunner {
  private browsers: Map<BrowserName, Browser> = new Map();
  private contexts: Map<BrowserName, BrowserContext> = new Map();
  private pages: Map<BrowserName, Page> = new Map();

  async setup(options: CrossBrowserTestOptions = {}) {
    const {
      browsers = ['chromium', 'firefox', 'webkit'],
      viewport = { width: 1280, height: 720 },
      ...contextOptions
    } = options;

    for (const browserName of browsers) {
      const browserType = this.getBrowserType(browserName);
      const browser = await browserType.launch();
      this.browsers.set(browserName, browser);

      const context = await browser.newContext({
        viewport,
        ...contextOptions,
      });
      this.contexts.set(browserName, context);

      const page = await context.newPage();
      this.pages.set(browserName, page);
    }
  }

  private getBrowserType(browserName: BrowserName) {
    switch (browserName) {
      case 'chromium':
        return chromium;
      case 'firefox':
        return firefox;
      case 'webkit':
        return webkit;
    }
  }

  async runTest(
    testFn: (page: Page, browserName: BrowserName) => Promise<void>
  ) {
    const results: Map<BrowserName, { success: boolean; error?: Error }> = new Map();

    for (const [browserName, page] of this.pages) {
      try {
        await testFn(page, browserName);
        results.set(browserName, { success: true });
      } catch (error) {
        results.set(browserName, { success: false, error: error as Error });
      }
    }

    return results;
  }

  async runParallel(
    testFn: (page: Page, browserName: BrowserName) => Promise<void>
  ) {
    const promises = Array.from(this.pages.entries()).map(
      async ([browserName, page]) => {
        try {
          await testFn(page, browserName);
          return { browserName, success: true };
        } catch (error) {
          return { browserName, success: false, error };
        }
      }
    );

    return await Promise.all(promises);
  }

  async teardown() {
    for (const browser of this.browsers.values()) {
      await browser.close();
    }
    this.browsers.clear();
    this.contexts.clear();
    this.pages.clear();
  }

  getPage(browserName: BrowserName): Page | undefined {
    return this.pages.get(browserName);
  }

  getContext(browserName: BrowserName): BrowserContext | undefined {
    return this.contexts.get(browserName);
  }
}

/**
 * Browser-specific feature detection
 */
export const browserFeatures = {
  async detectFeatures(page: Page): Promise<{
    webGL: boolean;
    webGL2: boolean;
    webP: boolean;
    avif: boolean;
    serviceWorker: boolean;
    webAssembly: boolean;
    intersectionObserver: boolean;
    resizeObserver: boolean;
    customElements: boolean;
    shadowDOM: boolean;
    cssGrid: boolean;
    cssContainerQueries: boolean;
    cssHas: boolean;
  }> {
    return await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      const gl2 = canvas.getContext('webgl2');

      return {
        webGL: !!gl,
        webGL2: !!gl2,
        webP: (() => {
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1;
          return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
        })(),
        avif: (() => {
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1;
          return canvas.toDataURL('image/avif').indexOf('image/avif') === 5;
        })(),
        serviceWorker: 'serviceWorker' in navigator,
        webAssembly: typeof WebAssembly === 'object',
        intersectionObserver: 'IntersectionObserver' in window,
        resizeObserver: 'ResizeObserver' in window,
        customElements: 'customElements' in window,
        shadowDOM: 'attachShadow' in Element.prototype,
        cssGrid: CSS.supports('display', 'grid'),
        cssContainerQueries: CSS.supports('container-type', 'inline-size'),
        cssHas: CSS.supports(':has(a)'),
      };
    });
  },
};

/**
 * Browser compatibility test matrix
 */
export const compatibilityMatrix = {
  async test(
    page: Page,
    component: string,
    features: string[]
  ): Promise<{ feature: string; supported: boolean }[]> {
    const results = [];

    for (const feature of features) {
      const supported = await this.checkFeature(page, component, feature);
      results.push({ feature, supported });
    }

    return results;
  },

  async checkFeature(
    page: Page,
    component: string,
    feature: string
  ): Promise<boolean> {
    // This would check specific component features
    // For now, return true as placeholder
    return true;
  },
};

/**
 * Browser performance comparison
 */
export async function compareBrowserPerformance(
  testFn: (page: Page) => Promise<{ metric: string; value: number }[]>,
  options?: CrossBrowserTestOptions
): Promise<Map<BrowserName, { metric: string; value: number }[]>> {
  const runner = new CrossBrowserTestRunner();
  await runner.setup(options);

  const results = new Map<BrowserName, { metric: string; value: number }[]>();

  await runner.runTest(async (page, browserName) => {
    const metrics = await testFn(page);
    results.set(browserName, metrics);
  });

  await runner.teardown();
  return results;
}

/**
 * Browser-specific quirks and workarounds
 */
export const browserQuirks = {
  firefox: {
    // Firefox-specific issues
    scrollBehavior: 'smooth not always respected',
    flexboxGaps: 'gap property might need fallback',
    inputDatePlaceholder: 'placeholder not shown for date inputs',
  },
  webkit: {
    // Safari/WebKit-specific issues
    scrollbarStyling: 'limited ::-webkit-scrollbar support',
    positionSticky: 'issues with table headers',
    inputTypeSearch: 'different default styling',
  },
  chromium: {
    // Chrome/Edge-specific issues
    printMediaQuery: 'might not trigger in headless mode',
    subpixelRendering: 'can cause 1px gaps in some layouts',
  },
};

/**
 * Cross-browser screenshot comparison
 */
export async function compareScreenshots(
  url: string,
  selector: string,
  options?: CrossBrowserTestOptions
): Promise<Map<BrowserName, Buffer>> {
  const runner = new CrossBrowserTestRunner();
  await runner.setup(options);

  const screenshots = new Map<BrowserName, Buffer>();

  await runner.runTest(async (page, browserName) => {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    
    const element = await page.locator(selector);
    const screenshot = await element.screenshot();
    screenshots.set(browserName, screenshot);
  });

  await runner.teardown();
  return screenshots;
}