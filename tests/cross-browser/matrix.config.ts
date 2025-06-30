/**
 * Cross-browser testing matrix configuration for Re-Shell UI
 */

export interface BrowserConfig {
  name: string;
  browserName: 'chromium' | 'firefox' | 'webkit';
  channel?: string;
  version?: string;
  viewport: { width: number; height: number };
  userAgent?: string;
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
  locale?: string;
}

export interface TestMatrix {
  browsers: BrowserConfig[];
  viewports: Record<string, { width: number; height: number }>;
  devices: DeviceConfig[];
  features: string[];
}

export interface DeviceConfig {
  name: string;
  viewport: { width: number; height: number };
  userAgent: string;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
}

/**
 * Browser testing matrix
 */
export const browserMatrix: BrowserConfig[] = [
  // Desktop browsers
  {
    name: 'Chrome Latest',
    browserName: 'chromium',
    viewport: { width: 1920, height: 1080 },
  },
  {
    name: 'Chrome Beta',
    browserName: 'chromium',
    channel: 'chrome-beta',
    viewport: { width: 1920, height: 1080 },
  },
  {
    name: 'Edge',
    browserName: 'chromium',
    channel: 'msedge',
    viewport: { width: 1920, height: 1080 },
  },
  {
    name: 'Firefox Latest',
    browserName: 'firefox',
    viewport: { width: 1920, height: 1080 },
  },
  {
    name: 'Firefox ESR',
    browserName: 'firefox',
    channel: 'firefox-esr',
    viewport: { width: 1920, height: 1080 },
  },
  {
    name: 'Safari',
    browserName: 'webkit',
    viewport: { width: 1920, height: 1080 },
  },
];

/**
 * Mobile device configurations
 */
export const mobileDevices: DeviceConfig[] = [
  {
    name: 'iPhone 14 Pro',
    viewport: { width: 393, height: 852 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  {
    name: 'iPhone SE',
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
  {
    name: 'iPad Pro 12.9',
    viewport: { width: 1024, height: 1366 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
  {
    name: 'Samsung Galaxy S23',
    viewport: { width: 360, height: 780 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  {
    name: 'Pixel 7',
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36',
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
  },
];

/**
 * Viewport configurations
 */
export const viewportConfigs = {
  'mobile-small': { width: 320, height: 568 },
  'mobile': { width: 375, height: 667 },
  'mobile-large': { width: 414, height: 896 },
  'tablet': { width: 768, height: 1024 },
  'tablet-landscape': { width: 1024, height: 768 },
  'desktop': { width: 1366, height: 768 },
  'desktop-large': { width: 1920, height: 1080 },
  'desktop-4k': { width: 3840, height: 2160 },
} as const;

/**
 * Feature support matrix
 */
export const featureMatrix = {
  'css-grid': ['chromium', 'firefox', 'webkit'],
  'css-container-queries': ['chromium', 'firefox'],
  'css-has': ['chromium', 'webkit'],
  'web-animations': ['chromium', 'firefox', 'webkit'],
  'intersection-observer': ['chromium', 'firefox', 'webkit'],
  'resize-observer': ['chromium', 'firefox', 'webkit'],
  'custom-elements': ['chromium', 'firefox', 'webkit'],
  'shadow-dom': ['chromium', 'firefox', 'webkit'],
  'webgl': ['chromium', 'firefox', 'webkit'],
  'webgl2': ['chromium', 'firefox', 'webkit'],
  'service-worker': ['chromium', 'firefox'],
  'web-assembly': ['chromium', 'firefox', 'webkit'],
};

/**
 * Test scenarios for cross-browser testing
 */
export const testScenarios = {
  'visual-consistency': {
    description: 'Ensure components look identical across browsers',
    browsers: ['chromium', 'firefox', 'webkit'],
    viewports: ['desktop', 'tablet', 'mobile'],
  },
  'interaction-compatibility': {
    description: 'Test user interactions work consistently',
    browsers: ['chromium', 'firefox', 'webkit'],
    includes: ['click', 'hover', 'focus', 'keyboard'],
  },
  'animation-performance': {
    description: 'Verify animations perform well across browsers',
    browsers: ['chromium', 'firefox', 'webkit'],
    metrics: ['fps', 'jank', 'paint-time'],
  },
  'accessibility-compliance': {
    description: 'Ensure accessibility features work in all browsers',
    browsers: ['chromium', 'firefox', 'webkit'],
    standards: ['wcag-2.1-aa', 'aria-1.2'],
  },
};

/**
 * Browser-specific workarounds
 */
export const browserWorkarounds = {
  firefox: {
    'scroll-behavior': 'Use polyfill for smooth scrolling',
    'date-input': 'Custom date picker for better support',
    'flexbox-gap': 'Use margin fallback for older versions',
  },
  webkit: {
    'position-sticky': 'Add -webkit prefix for older Safari',
    'scrollbar-styling': 'Limited customization options',
    'input-search': 'Different default styling',
  },
  chromium: {
    'print-styles': 'May need !important for print media',
    'subpixel-rendering': 'Can cause alignment issues',
  },
};

/**
 * Complete test matrix
 */
export const testMatrix: TestMatrix = {
  browsers: browserMatrix,
  viewports: viewportConfigs,
  devices: mobileDevices,
  features: Object.keys(featureMatrix),
};

/**
 * Matrix test runner configuration
 */
export const matrixRunnerConfig = {
  parallel: true,
  maxWorkers: 4,
  retries: 2,
  timeout: 30000,
  screenshots: {
    enabled: true,
    fullPage: false,
    path: './test-results/cross-browser',
  },
  video: {
    enabled: true,
    size: { width: 1280, height: 720 },
    path: './test-results/videos',
  },
  trace: {
    enabled: true,
    screenshots: true,
    snapshots: true,
    path: './test-results/traces',
  },
};