import { Page, expect } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { createReadStream, createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Automated screenshot comparison utilities for Re-Shell UI
 */

export interface ScreenshotComparisonOptions {
  threshold?: number; // 0-1, default 0.1
  includeAA?: boolean; // Include anti-aliasing differences
  alpha?: number; // Transparency threshold 0-1
  diffColor?: [number, number, number, number]; // RGBA diff color
  aaColor?: [number, number, number, number]; // RGBA anti-aliasing color
  outputDiff?: boolean; // Save diff image
  failOnDifference?: boolean; // Fail test on difference
  maskElements?: string[]; // CSS selectors to mask
  ignoreRegions?: Array<{ x: number; y: number; width: number; height: number }>;
}

export class ScreenshotComparator {
  private baselineDir: string;
  private actualDir: string;
  private diffDir: string;

  constructor(
    baseDir: string = './test-results/screenshots',
    dirs: {
      baseline?: string;
      actual?: string;
      diff?: string;
    } = {}
  ) {
    this.baselineDir = join(baseDir, dirs.baseline || 'baseline');
    this.actualDir = join(baseDir, dirs.actual || 'actual');
    this.diffDir = join(baseDir, dirs.diff || 'diff');

    // Ensure directories exist
    [this.baselineDir, this.actualDir, this.diffDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  async captureScreenshot(
    page: Page,
    name: string,
    options: {
      fullPage?: boolean;
      clip?: { x: number; y: number; width: number; height: number };
      maskElements?: string[];
    } = {}
  ): Promise<Buffer> {
    // Mask elements if specified
    if (options.maskElements && options.maskElements.length > 0) {
      await this.maskElements(page, options.maskElements);
    }

    // Capture screenshot
    const screenshot = await page.screenshot({
      fullPage: options.fullPage,
      clip: options.clip,
      animations: 'disabled',
    });

    // Unmask elements
    if (options.maskElements && options.maskElements.length > 0) {
      await this.unmaskElements(page);
    }

    return screenshot;
  }

  async compareWithBaseline(
    page: Page,
    name: string,
    options: ScreenshotComparisonOptions = {}
  ): Promise<ComparisonResult> {
    const {
      threshold = 0.1,
      includeAA = false,
      alpha = 0.1,
      diffColor = [255, 0, 0, 255],
      aaColor = [255, 255, 0, 255],
      outputDiff = true,
      failOnDifference = true,
      maskElements = [],
    } = options;

    const baselinePath = join(this.baselineDir, `${name}.png`);
    const actualPath = join(this.actualDir, `${name}.png`);
    const diffPath = join(this.diffDir, `${name}-diff.png`);

    // Capture current screenshot
    const actualBuffer = await this.captureScreenshot(page, name, { maskElements });
    
    // Save actual screenshot
    await this.saveImage(actualBuffer, actualPath);

    // Check if baseline exists
    if (!existsSync(baselinePath)) {
      // No baseline, save current as baseline
      await this.saveImage(actualBuffer, baselinePath);
      return {
        match: true,
        diffPixels: 0,
        diffPercentage: 0,
        baselineCreated: true,
      };
    }

    // Load images
    const baseline = await this.loadImage(baselinePath);
    const actual = PNG.sync.read(actualBuffer);

    // Ensure images have same dimensions
    if (baseline.width !== actual.width || baseline.height !== actual.height) {
      return {
        match: false,
        diffPixels: -1,
        diffPercentage: 100,
        error: `Image dimensions don't match: baseline ${baseline.width}x${baseline.height}, actual ${actual.width}x${actual.height}`,
      };
    }

    // Create diff image
    const diff = new PNG({ width: baseline.width, height: baseline.height });

    // Apply ignore regions
    if (options.ignoreRegions) {
      this.applyIgnoreRegions(baseline, actual, options.ignoreRegions);
    }

    // Compare pixels
    const diffPixels = pixelmatch(
      baseline.data,
      actual.data,
      diff.data,
      baseline.width,
      baseline.height,
      {
        threshold,
        includeAA,
        alpha,
        diffColor,
        aaColor,
      }
    );

    const totalPixels = baseline.width * baseline.height;
    const diffPercentage = (diffPixels / totalPixels) * 100;

    // Save diff image if requested
    if (outputDiff && diffPixels > 0) {
      await this.saveImage(PNG.sync.write(diff), diffPath);
    }

    const result: ComparisonResult = {
      match: diffPercentage <= threshold * 100,
      diffPixels,
      diffPercentage,
      diffPath: diffPixels > 0 ? diffPath : undefined,
    };

    if (failOnDifference && !result.match) {
      throw new Error(
        `Screenshot comparison failed: ${diffPercentage.toFixed(2)}% difference (${diffPixels} pixels)`
      );
    }

    return result;
  }

  async updateBaseline(page: Page, name: string, options: { maskElements?: string[] } = {}) {
    const baselinePath = join(this.baselineDir, `${name}.png`);
    const screenshot = await this.captureScreenshot(page, name, options);
    await this.saveImage(screenshot, baselinePath);
  }

  async compareMultiple(
    pages: Map<string, Page>,
    name: string,
    options: ScreenshotComparisonOptions = {}
  ): Promise<MultiComparisonResult> {
    const results: Map<string, ComparisonResult> = new Map();
    const screenshots: Map<string, Buffer> = new Map();

    // Capture all screenshots
    for (const [browserName, page] of pages) {
      const screenshot = await this.captureScreenshot(page, `${name}-${browserName}`, options);
      screenshots.set(browserName, screenshot);
    }

    // Compare all screenshots with the first one as reference
    const [referenceName, referenceBuffer] = screenshots.entries().next().value;
    const referencePNG = PNG.sync.read(referenceBuffer);

    for (const [browserName, buffer] of screenshots) {
      if (browserName === referenceName) {
        results.set(browserName, { match: true, diffPixels: 0, diffPercentage: 0 });
        continue;
      }

      const currentPNG = PNG.sync.read(buffer);
      
      if (referencePNG.width !== currentPNG.width || referencePNG.height !== currentPNG.height) {
        results.set(browserName, {
          match: false,
          diffPixels: -1,
          diffPercentage: 100,
          error: 'Dimension mismatch',
        });
        continue;
      }

      const diff = new PNG({ width: referencePNG.width, height: referencePNG.height });
      const diffPixels = pixelmatch(
        referencePNG.data,
        currentPNG.data,
        diff.data,
        referencePNG.width,
        referencePNG.height,
        { threshold: options.threshold || 0.1 }
      );

      const totalPixels = referencePNG.width * referencePNG.height;
      const diffPercentage = (diffPixels / totalPixels) * 100;

      results.set(browserName, {
        match: diffPercentage <= (options.threshold || 0.1) * 100,
        diffPixels,
        diffPercentage,
      });
    }

    return {
      reference: referenceName,
      results,
      allMatch: Array.from(results.values()).every(r => r.match),
    };
  }

  private async maskElements(page: Page, selectors: string[]) {
    await page.evaluate((selectors) => {
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          (el as HTMLElement).style.visibility = 'hidden';
        });
      });
    }, selectors);
  }

  private async unmaskElements(page: Page) {
    await page.evaluate(() => {
      const hidden = document.querySelectorAll('[style*="visibility: hidden"]');
      hidden.forEach(el => {
        (el as HTMLElement).style.visibility = '';
      });
    });
  }

  private applyIgnoreRegions(
    baseline: PNG,
    actual: PNG,
    regions: Array<{ x: number; y: number; width: number; height: number }>
  ) {
    regions.forEach(region => {
      for (let y = region.y; y < region.y + region.height; y++) {
        for (let x = region.x; x < region.x + region.width; x++) {
          const idx = (baseline.width * y + x) << 2;
          // Set to same color in both images
          baseline.data[idx] = 0;
          baseline.data[idx + 1] = 0;
          baseline.data[idx + 2] = 0;
          baseline.data[idx + 3] = 255;
          
          actual.data[idx] = 0;
          actual.data[idx + 1] = 0;
          actual.data[idx + 2] = 0;
          actual.data[idx + 3] = 255;
        }
      }
    });
  }

  private async loadImage(path: string): Promise<PNG> {
    return new Promise((resolve, reject) => {
      const stream = createReadStream(path);
      const png = new PNG();
      
      stream
        .pipe(png)
        .on('parsed', () => resolve(png))
        .on('error', reject);
    });
  }

  private async saveImage(buffer: Buffer, path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = createWriteStream(path);
      stream.write(buffer, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

export interface ComparisonResult {
  match: boolean;
  diffPixels: number;
  diffPercentage: number;
  diffPath?: string;
  error?: string;
  baselineCreated?: boolean;
}

export interface MultiComparisonResult {
  reference: string;
  results: Map<string, ComparisonResult>;
  allMatch: boolean;
}

/**
 * Visual regression test helpers
 */
export async function visualRegressionTest(
  page: Page,
  componentName: string,
  scenarios: Array<{
    name: string;
    setup?: () => Promise<void>;
    selector?: string;
    options?: ScreenshotComparisonOptions;
  }>
) {
  const comparator = new ScreenshotComparator();

  for (const scenario of scenarios) {
    await test(`${componentName} - ${scenario.name}`, async () => {
      if (scenario.setup) {
        await scenario.setup();
      }

      if (scenario.selector) {
        await page.waitForSelector(scenario.selector, { state: 'visible' });
      }

      const result = await comparator.compareWithBaseline(
        page,
        `${componentName}-${scenario.name}`,
        scenario.options
      );

      expect(result.match).toBe(true);
    });
  }
}

/**
 * Responsive screenshot testing
 */
export async function responsiveScreenshotTest(
  page: Page,
  url: string,
  name: string,
  viewports: Array<{ width: number; height: number; label: string }>
) {
  const comparator = new ScreenshotComparator();

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto(url);
    await page.waitForLoadState('networkidle');

    const result = await comparator.compareWithBaseline(
      page,
      `${name}-${viewport.label}`,
      { fullPage: true }
    );

    expect(result.match).toBe(true);
  }
}

/**
 * Animation screenshot testing
 */
export async function animationScreenshotTest(
  page: Page,
  triggerSelector: string,
  name: string,
  options: {
    frames?: number;
    frameDuration?: number;
    captureBeforeTrigger?: boolean;
  } = {}
) {
  const {
    frames = 5,
    frameDuration = 100,
    captureBeforeTrigger = true,
  } = options;

  const comparator = new ScreenshotComparator();
  const results: ComparisonResult[] = [];

  // Capture before state
  if (captureBeforeTrigger) {
    const beforeResult = await comparator.compareWithBaseline(
      page,
      `${name}-frame-0-before`
    );
    results.push(beforeResult);
  }

  // Trigger animation
  await page.click(triggerSelector);

  // Capture frames
  for (let i = 0; i < frames; i++) {
    await page.waitForTimeout(frameDuration);
    const frameResult = await comparator.compareWithBaseline(
      page,
      `${name}-frame-${i + 1}`
    );
    results.push(frameResult);
  }

  // All frames should match
  results.forEach((result, index) => {
    expect(result.match).toBe(true);
  });
}