import { describe, it, beforeAll, afterAll, vi } from 'vitest';
import { performance } from 'perf_hooks';

/**
 * Test performance optimization utilities for Re-Shell UI
 */

/**
 * Test performance monitor
 */
export class TestPerformanceMonitor {
  private static instance: TestPerformanceMonitor;
  private testMetrics: Map<string, TestMetric[]> = new Map();
  private suiteStartTime: number = 0;

  static getInstance(): TestPerformanceMonitor {
    if (!this.instance) {
      this.instance = new TestPerformanceMonitor();
    }
    return this.instance;
  }

  startSuite(suiteName: string): void {
    this.suiteStartTime = performance.now();
    console.log(`Starting test suite: ${suiteName}`);
  }

  recordTest(testName: string, duration: number, memory?: number): void {
    const metrics = this.testMetrics.get(testName) || [];
    metrics.push({
      duration,
      memory: memory || process.memoryUsage().heapUsed,
      timestamp: Date.now(),
    });
    this.testMetrics.set(testName, metrics);
  }

  generateReport(): TestPerformanceReport {
    const totalDuration = performance.now() - this.suiteStartTime;
    const testReports: TestReport[] = [];

    this.testMetrics.forEach((metrics, testName) => {
      const durations = metrics.map(m => m.duration);
      const memories = metrics.map(m => m.memory);

      testReports.push({
        name: testName,
        runs: metrics.length,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        avgMemory: memories.reduce((a, b) => a + b, 0) / memories.length,
        totalDuration: durations.reduce((a, b) => a + b, 0),
      });
    });

    // Sort by total duration (slowest first)
    testReports.sort((a, b) => b.totalDuration - a.totalDuration);

    return {
      totalDuration,
      totalTests: testReports.length,
      totalRuns: testReports.reduce((sum, t) => sum + t.runs, 0),
      slowestTests: testReports.slice(0, 10),
      testReports,
    };
  }

  identifyBottlenecks(threshold: number = 100): string[] {
    const bottlenecks: string[] = [];

    this.testMetrics.forEach((metrics, testName) => {
      const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
      if (avgDuration > threshold) {
        bottlenecks.push(`${testName}: ${avgDuration.toFixed(2)}ms average`);
      }
    });

    return bottlenecks;
  }
}

interface TestMetric {
  duration: number;
  memory: number;
  timestamp: number;
}

interface TestReport {
  name: string;
  runs: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  avgMemory: number;
  totalDuration: number;
}

interface TestPerformanceReport {
  totalDuration: number;
  totalTests: number;
  totalRuns: number;
  slowestTests: TestReport[];
  testReports: TestReport[];
}

/**
 * Test parallelization utilities
 */
export class TestParallelizer {
  static async runInParallel<T>(
    tasks: Array<() => Promise<T>>,
    maxConcurrency: number = 4
  ): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];

    for (const task of tasks) {
      const promise = task().then(result => {
        results.push(result);
      });

      executing.push(promise);

      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }

    await Promise.all(executing);
    return results;
  }

  static createTestBatches<T>(
    items: T[],
    batchSize: number
  ): T[][] {
    const batches: T[][] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    return batches;
  }
}

/**
 * Test caching system
 */
export class TestCache {
  private static cache = new Map<string, any>();
  private static timestamps = new Map<string, number>();
  private static ttl = 5 * 60 * 1000; // 5 minutes default

  static set(key: string, value: any, ttl?: number): void {
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now() + (ttl || this.ttl));
  }

  static get<T>(key: string): T | undefined {
    const timestamp = this.timestamps.get(key);
    
    if (!timestamp || Date.now() > timestamp) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return undefined;
    }
    
    return this.cache.get(key);
  }

  static clear(): void {
    this.cache.clear();
    this.timestamps.clear();
  }

  static memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      const cached = this.get(key);
      
      if (cached !== undefined) {
        return cached;
      }
      
      const result = fn(...args);
      this.set(key, result);
      return result;
    }) as T;
  }
}

/**
 * Test setup optimization
 */
export class TestSetupOptimizer {
  private static sharedSetups = new Map<string, any>();

  static async setupOnce<T>(
    key: string,
    setupFn: () => Promise<T>
  ): Promise<T> {
    if (!this.sharedSetups.has(key)) {
      const setup = await setupFn();
      this.sharedSetups.set(key, setup);
    }
    
    return this.sharedSetups.get(key);
  }

  static async withSharedContext<T>(
    contextKey: string,
    setupFn: () => Promise<T>,
    testFn: (context: T) => Promise<void>
  ): Promise<void> {
    const context = await this.setupOnce(contextKey, setupFn);
    await testFn(context);
  }

  static cleanup(): void {
    this.sharedSetups.clear();
  }
}

/**
 * Lazy loading for test dependencies
 */
export class TestLazyLoader {
  private static loaders = new Map<string, () => Promise<any>>();
  private static loaded = new Map<string, any>();

  static register(name: string, loader: () => Promise<any>): void {
    this.loaders.set(name, loader);
  }

  static async load<T>(name: string): Promise<T> {
    if (!this.loaded.has(name)) {
      const loader = this.loaders.get(name);
      if (!loader) {
        throw new Error(`No loader registered for: ${name}`);
      }
      
      const module = await loader();
      this.loaded.set(name, module);
    }
    
    return this.loaded.get(name);
  }

  static preload(names: string[]): Promise<void[]> {
    return Promise.all(names.map(name => this.load(name)));
  }
}

/**
 * Test timeout optimizer
 */
export class TestTimeoutOptimizer {
  private static timeoutHistory = new Map<string, number[]>();

  static recordTimeout(testName: string, duration: number): void {
    const history = this.timeoutHistory.get(testName) || [];
    history.push(duration);
    
    // Keep only last 10 runs
    if (history.length > 10) {
      history.shift();
    }
    
    this.timeoutHistory.set(testName, history);
  }

  static getOptimalTimeout(testName: string, defaultTimeout: number = 5000): number {
    const history = this.timeoutHistory.get(testName);
    
    if (!history || history.length === 0) {
      return defaultTimeout;
    }
    
    // Calculate 95th percentile
    const sorted = [...history].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95Duration = sorted[p95Index];
    
    // Add 20% buffer
    return Math.ceil(p95Duration * 1.2);
  }

  static async withOptimalTimeout<T>(
    testName: string,
    testFn: () => Promise<T>,
    defaultTimeout?: number
  ): Promise<T> {
    const timeout = this.getOptimalTimeout(testName, defaultTimeout);
    const startTime = performance.now();
    
    try {
      const result = await Promise.race([
        testFn(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), timeout)
        ),
      ]);
      
      const duration = performance.now() - startTime;
      this.recordTimeout(testName, duration);
      
      return result;
    } catch (error) {
      if (error.message === 'Test timeout') {
        // Record timeout as double the limit for next run
        this.recordTimeout(testName, timeout * 2);
      }
      throw error;
    }
  }
}

/**
 * Performance decorators for test optimization
 */
export function measurePerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const monitor = TestPerformanceMonitor.getInstance();

  descriptor.value = async function (...args: any[]) {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      const result = await originalMethod.apply(this, args);
      
      const duration = performance.now() - startTime;
      const memoryDelta = process.memoryUsage().heapUsed - startMemory;
      
      monitor.recordTest(`${target.constructor.name}.${propertyKey}`, duration, memoryDelta);
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      monitor.recordTest(`${target.constructor.name}.${propertyKey}`, duration);
      throw error;
    }
  };

  return descriptor;
}

export function cached(ttl?: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = TestCache.memoize(originalMethod, (...args) => 
      `${target.constructor.name}.${propertyKey}:${JSON.stringify(args)}`
    );
    
    return descriptor;
  };
}

/**
 * Test performance configuration
 */
export const testPerformanceConfig = {
  // Parallel execution
  parallel: {
    enabled: true,
    maxWorkers: 4,
    threshold: 10, // Min tests to parallelize
  },
  
  // Caching
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100 * 1024 * 1024, // 100MB
  },
  
  // Timeouts
  timeouts: {
    unit: 5000,
    integration: 10000,
    e2e: 30000,
    stress: 60000,
  },
  
  // Memory limits
  memory: {
    maxHeap: 512 * 1024 * 1024, // 512MB
    gcThreshold: 100 * 1024 * 1024, // 100MB
  },
  
  // Reporting
  reporting: {
    enabled: true,
    verbose: false,
    slowTestThreshold: 100, // ms
  },
};