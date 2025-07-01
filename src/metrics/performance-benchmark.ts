import { performance, PerformanceObserver } from 'perf_hooks';
import type { PerformanceMetrics } from './types';

/**
 * Re-Shell UI Performance Benchmarking System
 * Measures and tracks component performance metrics
 */
export class PerformanceBenchmark {
  private observer: PerformanceObserver | null = null;
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number[]> = new Map();
  private paintTimings: any = {};
  private memoryUsage: any = {};

  constructor() {
    this.setupObserver();
  }

  /**
   * Setup performance observer
   */
  private setupObserver() {
    if (typeof window === 'undefined') return;

    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'paint') {
          this.paintTimings[entry.name] = entry.startTime;
        }
      }
    });

    this.observer.observe({ entryTypes: ['paint', 'measure', 'navigation'] });
  }

  /**
   * Start performance measurement
   */
  startMeasure(name: string) {
    this.marks.set(name, performance.now());
    
    if (typeof window !== 'undefined' && 'memory' in performance) {
      this.memoryUsage[`${name}_start`] = (performance as any).memory.usedJSHeapSize;
    }
  }

  /**
   * End performance measurement
   */
  endMeasure(name: string): number {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`No start mark found for ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    
    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }
    this.measures.get(name)!.push(duration);

    if (typeof window !== 'undefined' && 'memory' in performance) {
      this.memoryUsage[`${name}_end`] = (performance as any).memory.usedJSHeapSize;
    }

    this.marks.delete(name);
    return duration;
  }

  /**
   * Run performance benchmark
   */
  async benchmark(
    name: string,
    fn: () => void | Promise<void>,
    options: BenchmarkOptions = {}
  ): Promise<BenchmarkResult> {
    const { iterations = 100, warmup = 10 } = options;
    const results: number[] = [];

    // Warmup runs
    for (let i = 0; i < warmup; i++) {
      await fn();
    }

    // Actual benchmark runs
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      results.push(end - start);
    }

    // Calculate statistics
    const sorted = results.sort((a, b) => a - b);
    const average = results.reduce((a, b) => a + b, 0) / results.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    return {
      name,
      iterations,
      average,
      median,
      p95,
      p99,
      min,
      max,
      standardDeviation: this.calculateStandardDeviation(results, average)
    };
  }

  /**
   * Collect performance metrics
   */
  async collectMetrics(): Promise<PerformanceMetrics> {
    const navigation = this.getNavigationTiming();
    const paint = this.getPaintTiming();
    const memory = this.getMemoryUsage();

    return {
      score: this.calculatePerformanceScore(navigation, paint),
      firstContentfulPaint: paint.firstContentfulPaint || 0,
      firstPaint: paint.firstPaint || 0,
      largestContentfulPaint: await this.getLCP(),
      timeToInteractive: await this.getTTI(),
      totalBlockingTime: await this.getTBT(),
      cumulativeLayoutShift: await this.getCLS(),
      speedIndex: this.calculateSpeedIndex(),
      mainThreadWork: this.calculateMainThreadWork(),
      bootupTime: navigation.loadEventEnd - navigation.fetchStart,
      memoryUsage: memory
    };
  }

  /**
   * Get navigation timing
   */
  private getNavigationTiming(): any {
    if (typeof window === 'undefined' || !window.performance) {
      return this.createMockTiming();
    }

    const navigation = window.performance.getEntriesByType('navigation')[0] as any;
    return navigation || this.createMockTiming();
  }

  /**
   * Get paint timing
   */
  private getPaintTiming(): any {
    return {
      firstPaint: this.paintTimings['first-paint'] || 0,
      firstContentfulPaint: this.paintTimings['first-contentful-paint'] || 0
    };
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage(): any {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return { initial: 0, peak: 0, average: 0 };
    }

    const memory = (performance as any).memory;
    return {
      initial: memory.usedJSHeapSize,
      peak: memory.totalJSHeapSize,
      average: memory.usedJSHeapSize
    };
  }

  /**
   * Get Largest Contentful Paint
   */
  private async getLCP(): Promise<number> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(0);
        return;
      }

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        resolve(lastEntry.startTime);
        observer.disconnect();
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });

      // Timeout after 5 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(0);
      }, 5000);
    });
  }

  /**
   * Get Time to Interactive
   */
  private async getTTI(): Promise<number> {
    // Simplified TTI calculation
    const fcp = this.paintTimings['first-contentful-paint'] || 0;
    const longTasks = await this.getLongTasks();
    
    // Find 5 second window with no long tasks after FCP
    let tti = fcp;
    for (const task of longTasks) {
      if (task.startTime > fcp && task.startTime - tti < 5000) {
        tti = task.startTime + task.duration;
      }
    }

    return tti;
  }

  /**
   * Get Total Blocking Time
   */
  private async getTBT(): Promise<number> {
    const longTasks = await this.getLongTasks();
    const fcp = this.paintTimings['first-contentful-paint'] || 0;
    const tti = await this.getTTI();

    let tbt = 0;
    for (const task of longTasks) {
      if (task.startTime > fcp && task.startTime < tti) {
        tbt += Math.max(0, task.duration - 50);
      }
    }

    return tbt;
  }

  /**
   * Get Cumulative Layout Shift
   */
  private async getCLS(): Promise<number> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(0);
        return;
      }

      let cls = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any) {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });

      setTimeout(() => {
        observer.disconnect();
        resolve(cls);
      }, 5000);
    });
  }

  /**
   * Get long tasks
   */
  private async getLongTasks(): Promise<any[]> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve([]);
        return;
      }

      const tasks: any[] = [];
      const observer = new PerformanceObserver((list) => {
        tasks.push(...list.getEntries());
      });

      observer.observe({ entryTypes: ['longtask'] });

      setTimeout(() => {
        observer.disconnect();
        resolve(tasks);
      }, 5000);
    });
  }

  /**
   * Calculate Speed Index
   */
  private calculateSpeedIndex(): number {
    // Simplified Speed Index calculation
    const fcp = this.paintTimings['first-contentful-paint'] || 0;
    const lcp = 0; // Would need actual LCP value
    return (fcp + lcp) / 2;
  }

  /**
   * Calculate main thread work
   */
  private calculateMainThreadWork(): number {
    // Simplified calculation based on long tasks
    return 0; // Would need actual calculation
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(navigation: any, paint: any): number {
    const fcp = paint.firstContentfulPaint || 0;
    const tti = navigation.interactive || 0;
    
    // Simplified scoring based on key metrics
    let score = 100;
    
    // FCP scoring
    if (fcp > 1800) score -= 20;
    else if (fcp > 3000) score -= 40;
    
    // TTI scoring
    if (tti > 3800) score -= 20;
    else if (tti > 7300) score -= 40;
    
    return Math.max(0, score);
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[], average: number): number {
    const squaredDiffs = values.map(value => Math.pow(value - average, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Create mock timing for SSR
   */
  private createMockTiming(): any {
    return {
      fetchStart: 0,
      loadEventEnd: 100,
      interactive: 150
    };
  }

  /**
   * Cleanup
   */
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.marks.clear();
    this.measures.clear();
  }
}

export interface BenchmarkOptions {
  iterations?: number;
  warmup?: number;
}

export interface BenchmarkResult {
  name: string;
  iterations: number;
  average: number;
  median: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  standardDeviation: number;
}

/**
 * Run component performance benchmark
 */
export async function benchmarkComponent(
  componentName: string,
  renderFn: () => void,
  options: BenchmarkOptions = {}
): Promise<BenchmarkResult> {
  const benchmark = new PerformanceBenchmark();
  const result = await benchmark.benchmark(componentName, renderFn, options);
  benchmark.cleanup();
  return result;
}

/**
 * Create performance report
 */
export function createPerformanceReport(metrics: PerformanceMetrics): string {
  const lines: string[] = [
    '# Performance Report',
    '',
    `Performance Score: ${metrics.score}/100`,
    '',
    '## Key Metrics',
    `- First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(0)}ms`,
    `- Largest Contentful Paint: ${metrics.largestContentfulPaint.toFixed(0)}ms`,
    `- Time to Interactive: ${metrics.timeToInteractive.toFixed(0)}ms`,
    `- Total Blocking Time: ${metrics.totalBlockingTime.toFixed(0)}ms`,
    `- Cumulative Layout Shift: ${metrics.cumulativeLayoutShift.toFixed(3)}`,
    `- Speed Index: ${metrics.speedIndex.toFixed(0)}ms`,
    '',
    '## Resource Usage',
    `- Main Thread Work: ${metrics.mainThreadWork.toFixed(0)}ms`,
    `- Bootup Time: ${metrics.bootupTime.toFixed(0)}ms`,
    `- Memory Usage:`,
    `  - Initial: ${(metrics.memoryUsage.initial / 1024 / 1024).toFixed(2)}MB`,
    `  - Peak: ${(metrics.memoryUsage.peak / 1024 / 1024).toFixed(2)}MB`,
    `  - Average: ${(metrics.memoryUsage.average / 1024 / 1024).toFixed(2)}MB`
  ];

  return lines.join('\n');
}