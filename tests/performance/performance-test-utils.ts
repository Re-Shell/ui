import { performance, PerformanceObserver } from 'perf_hooks';
import { vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

/**
 * Re-Shell UI Performance Testing Utilities
 */

export interface PerformanceMetrics {
  renderTime: number;
  updateTime: number;
  layoutTime: number;
  paintTime: number;
  totalTime: number;
  memoryUsage: {
    before: number;
    after: number;
    delta: number;
  };
  renderCount: number;
}

/**
 * Performance test harness
 */
export class PerformanceTestHarness {
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    updateTime: 0,
    layoutTime: 0,
    paintTime: 0,
    totalTime: 0,
    memoryUsage: {
      before: 0,
      after: 0,
      delta: 0,
    },
    renderCount: 0,
  };
  
  private observers: PerformanceObserver[] = [];
  private startTime: number = 0;
  private renderCount: number = 0;

  constructor() {
    this.setupObservers();
  }

  private setupObservers() {
    // Measure React render performance
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const measureObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes('render')) {
            this.metrics.renderTime += entry.duration;
            this.renderCount++;
          } else if (entry.name.includes('update')) {
            this.metrics.updateTime += entry.duration;
          }
        }
      });
      
      measureObserver.observe({ entryTypes: ['measure'] });
      this.observers.push(measureObserver);
    }
  }

  start() {
    this.startTime = performance.now();
    this.metrics.memoryUsage.before = process.memoryUsage().heapUsed;
    this.renderCount = 0;
  }

  stop() {
    const endTime = performance.now();
    this.metrics.totalTime = endTime - this.startTime;
    this.metrics.memoryUsage.after = process.memoryUsage().heapUsed;
    this.metrics.memoryUsage.delta = this.metrics.memoryUsage.after - this.metrics.memoryUsage.before;
    this.metrics.renderCount = this.renderCount;

    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  trackRender() {
    this.renderCount++;
  }

  assertPerformance(thresholds: Partial<PerformanceMetrics>) {
    const metrics = this.getMetrics();
    
    if (thresholds.renderTime !== undefined) {
      expect(metrics.renderTime).toBeLessThan(thresholds.renderTime);
    }
    
    if (thresholds.updateTime !== undefined) {
      expect(metrics.updateTime).toBeLessThan(thresholds.updateTime);
    }
    
    if (thresholds.totalTime !== undefined) {
      expect(metrics.totalTime).toBeLessThan(thresholds.totalTime);
    }
    
    if (thresholds.memoryUsage?.delta !== undefined) {
      expect(metrics.memoryUsage.delta).toBeLessThan(thresholds.memoryUsage.delta);
    }
    
    if (thresholds.renderCount !== undefined) {
      expect(metrics.renderCount).toBeLessThanOrEqual(thresholds.renderCount);
    }
  }
}

/**
 * Measure component render performance
 */
export async function measureRenderPerformance<T>(
  renderFn: () => T,
  options: {
    runs?: number;
    warmupRuns?: number;
  } = {}
): Promise<{
  average: number;
  median: number;
  min: number;
  max: number;
  p95: number;
  p99: number;
}> {
  const { runs = 100, warmupRuns = 10 } = options;
  const measurements: number[] = [];

  // Warmup runs
  for (let i = 0; i < warmupRuns; i++) {
    renderFn();
  }

  // Actual measurements
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    measurements.push(end - start);
  }

  // Calculate statistics
  measurements.sort((a, b) => a - b);
  const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
  const median = measurements[Math.floor(measurements.length / 2)];
  const min = measurements[0];
  const max = measurements[measurements.length - 1];
  const p95 = measurements[Math.floor(measurements.length * 0.95)];
  const p99 = measurements[Math.floor(measurements.length * 0.99)];

  return { average, median, min, max, p95, p99 };
}

/**
 * Profile component memory usage
 */
export function profileMemoryUsage(
  setupFn: () => void,
  teardownFn: () => void,
  iterations: number = 1000
): {
  baseline: number;
  peak: number;
  leaked: number;
} {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  const baseline = process.memoryUsage().heapUsed;
  let peak = baseline;

  for (let i = 0; i < iterations; i++) {
    setupFn();
    const current = process.memoryUsage().heapUsed;
    peak = Math.max(peak, current);
    teardownFn();
  }

  // Force garbage collection again
  if (global.gc) {
    global.gc();
  }

  const final = process.memoryUsage().heapUsed;
  const leaked = final - baseline;

  return { baseline, peak, leaked };
}

/**
 * Benchmark function execution
 */
export async function benchmark(
  name: string,
  fn: () => void | Promise<void>,
  options: {
    iterations?: number;
    async?: boolean;
  } = {}
): Promise<void> {
  const { iterations = 1000, async = false } = options;
  
  console.log(`Benchmarking: ${name}`);
  
  const start = performance.now();
  
  if (async) {
    for (let i = 0; i < iterations; i++) {
      await fn();
    }
  } else {
    for (let i = 0; i < iterations; i++) {
      fn();
    }
  }
  
  const end = performance.now();
  const totalTime = end - start;
  const averageTime = totalTime / iterations;
  
  console.log(`  Total time: ${totalTime.toFixed(2)}ms`);
  console.log(`  Average time: ${averageTime.toFixed(4)}ms`);
  console.log(`  Operations/sec: ${(1000 / averageTime).toFixed(0)}`);
}

/**
 * Component stress test
 */
export async function stressTest(
  component: React.ComponentType<any>,
  options: {
    instances: number;
    updates: number;
    props?: any;
    updateProps?: (index: number) => any;
  }
): Promise<PerformanceMetrics> {
  const harness = new PerformanceTestHarness();
  harness.start();

  const Component = component;
  
  // Initial render
  harness.trackRender();
  const { container } = render(
    React.createElement('div', {},
      Array.from({ length: options.instances }, (_, i) =>
        React.createElement(Component, { 
          key: i, 
          ...(options.props || {}) 
        })
      )
    )
  );

  // Perform updates by re-rendering
  for (let u = 0; u < options.updates; u++) {
    harness.trackRender();
    render(
      React.createElement('div', {},
        Array.from({ length: options.instances }, (_, i) =>
          React.createElement(Component, { 
            key: i, 
            ...(options.updateProps ? options.updateProps(i) : { ...options.props, updateKey: u })
          })
        )
      ),
      { container }
    );
  }

  harness.stop();
  return harness.getMetrics();
}

/**
 * Animation performance test
 */
export function testAnimationPerformance(
  element: HTMLElement,
  duration: number
): Promise<{
  fps: number;
  droppedFrames: number;
  jank: number;
}> {
  return new Promise((resolve) => {
    let frameCount = 0;
    let lastTime = performance.now();
    let droppedFrames = 0;
    let totalJank = 0;
    const targetFrameTime = 16.67; // 60 FPS

    const measureFrame = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      
      frameCount++;
      
      if (deltaTime > targetFrameTime * 1.5) {
        droppedFrames++;
        totalJank += deltaTime - targetFrameTime;
      }
      
      lastTime = currentTime;
      
      if (currentTime - startTime < duration) {
        requestAnimationFrame(measureFrame);
      } else {
        const totalTime = currentTime - startTime;
        const fps = (frameCount / totalTime) * 1000;
        const jank = totalJank / frameCount;
        
        resolve({ fps, droppedFrames, jank });
      }
    };

    const startTime = performance.now();
    requestAnimationFrame(measureFrame);
  });
}

/**
 * Bundle size analyzer
 */
export function analyzeBundleSize(
  componentPath: string
): {
  raw: number;
  gzipped: number;
  dependencies: string[];
} {
  // This would integrate with webpack-bundle-analyzer or similar
  // For now, return mock data
  return {
    raw: 0,
    gzipped: 0,
    dependencies: [],
  };
}

/**
 * Performance budget assertions
 */
export const performanceBudget = {
  assert(metrics: PerformanceMetrics, budget: {
    renderTime?: number;
    updateTime?: number;
    totalTime?: number;
    memoryDelta?: number;
    renderCount?: number;
  }) {
    if (budget.renderTime && metrics.renderTime > budget.renderTime) {
      throw new Error(`Render time ${metrics.renderTime}ms exceeds budget ${budget.renderTime}ms`);
    }
    
    if (budget.updateTime && metrics.updateTime > budget.updateTime) {
      throw new Error(`Update time ${metrics.updateTime}ms exceeds budget ${budget.updateTime}ms`);
    }
    
    if (budget.totalTime && metrics.totalTime > budget.totalTime) {
      throw new Error(`Total time ${metrics.totalTime}ms exceeds budget ${budget.totalTime}ms`);
    }
    
    if (budget.memoryDelta && metrics.memoryUsage.delta > budget.memoryDelta) {
      throw new Error(`Memory delta ${metrics.memoryUsage.delta} exceeds budget ${budget.memoryDelta}`);
    }
    
    if (budget.renderCount && metrics.renderCount > budget.renderCount) {
      throw new Error(`Render count ${metrics.renderCount} exceeds budget ${budget.renderCount}`);
    }
  },
};