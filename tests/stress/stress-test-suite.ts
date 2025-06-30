import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';

/**
 * Component stress testing suite for Re-Shell UI
 */

export interface StressTestConfig {
  component: React.ComponentType<any>;
  name: string;
  scenarios: StressScenario[];
}

export interface StressScenario {
  name: string;
  instances: number;
  updates: number;
  props: any;
  updateStrategy?: 'sequential' | 'parallel' | 'batch';
  measureMemory?: boolean;
  measureTime?: boolean;
  threshold?: {
    maxTime?: number;
    maxMemory?: number;
    maxRenderCount?: number;
  };
}

/**
 * Stress test runner
 */
export class StressTestRunner {
  private results: Map<string, StressTestResult> = new Map();

  async runScenario(scenario: StressScenario, Component: React.ComponentType<any>) {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;
    let renderCount = 0;

    try {
      // Create instances
      const instances: any[] = [];
      for (let i = 0; i < scenario.instances; i++) {
        const { container } = render(
          <Component {...scenario.props} key={`stress-${i}`} />
        );
        instances.push(container);
        renderCount++;
      }

      // Perform updates
      if (scenario.updates > 0) {
        switch (scenario.updateStrategy) {
          case 'sequential':
            await this.sequentialUpdates(instances, scenario, Component);
            break;
          case 'parallel':
            await this.parallelUpdates(instances, scenario, Component);
            break;
          case 'batch':
            await this.batchUpdates(instances, scenario, Component);
            break;
          default:
            await this.sequentialUpdates(instances, scenario, Component);
        }
        renderCount += scenario.updates * instances.length;
      }

      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;

      const result: StressTestResult = {
        scenario: scenario.name,
        instances: scenario.instances,
        updates: scenario.updates,
        totalTime: endTime - startTime,
        memoryUsed: endMemory - startMemory,
        renderCount,
        avgTimePerRender: (endTime - startTime) / renderCount,
        passed: true,
      };

      // Check thresholds
      if (scenario.threshold) {
        if (scenario.threshold.maxTime && result.totalTime > scenario.threshold.maxTime) {
          result.passed = false;
          result.failureReason = `Time exceeded: ${result.totalTime}ms > ${scenario.threshold.maxTime}ms`;
        }
        if (scenario.threshold.maxMemory && result.memoryUsed > scenario.threshold.maxMemory) {
          result.passed = false;
          result.failureReason = `Memory exceeded: ${result.memoryUsed} > ${scenario.threshold.maxMemory}`;
        }
        if (scenario.threshold.maxRenderCount && renderCount > scenario.threshold.maxRenderCount) {
          result.passed = false;
          result.failureReason = `Render count exceeded: ${renderCount} > ${scenario.threshold.maxRenderCount}`;
        }
      }

      this.results.set(scenario.name, result);
      return result;

    } finally {
      cleanup();
    }
  }

  private async sequentialUpdates(
    instances: any[],
    scenario: StressScenario,
    Component: React.ComponentType<any>
  ) {
    for (let u = 0; u < scenario.updates; u++) {
      for (let i = 0; i < instances.length; i++) {
        render(
          <Component {...scenario.props} key={`stress-${i}-${u}`} updateIndex={u} />,
          { container: instances[i] }
        );
      }
    }
  }

  private async parallelUpdates(
    instances: any[],
    scenario: StressScenario,
    Component: React.ComponentType<any>
  ) {
    const promises: Promise<void>[] = [];
    
    for (let u = 0; u < scenario.updates; u++) {
      promises.push(
        Promise.all(
          instances.map((container, i) =>
            Promise.resolve(
              render(
                <Component {...scenario.props} key={`stress-${i}-${u}`} updateIndex={u} />,
                { container }
              )
            )
          )
        ).then(() => {})
      );
    }
    
    await Promise.all(promises);
  }

  private async batchUpdates(
    instances: any[],
    scenario: StressScenario,
    Component: React.ComponentType<any>
  ) {
    const batchSize = Math.ceil(instances.length / 10);
    
    for (let u = 0; u < scenario.updates; u++) {
      for (let b = 0; b < instances.length; b += batchSize) {
        const batch = instances.slice(b, b + batchSize);
        await Promise.all(
          batch.map((container, i) =>
            Promise.resolve(
              render(
                <Component {...scenario.props} key={`stress-${b + i}-${u}`} updateIndex={u} />,
                { container }
              )
            )
          )
        );
      }
    }
  }

  getResults() {
    return Array.from(this.results.values());
  }

  generateReport() {
    const results = this.getResults();
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    return {
      summary: {
        total: results.length,
        passed,
        failed,
        passRate: (passed / results.length) * 100,
      },
      results,
      performance: {
        avgRenderTime: results.reduce((sum, r) => sum + r.avgTimePerRender, 0) / results.length,
        totalMemory: results.reduce((sum, r) => sum + r.memoryUsed, 0),
        totalRenders: results.reduce((sum, r) => sum + r.renderCount, 0),
      },
    };
  }
}

export interface StressTestResult {
  scenario: string;
  instances: number;
  updates: number;
  totalTime: number;
  memoryUsed: number;
  renderCount: number;
  avgTimePerRender: number;
  passed: boolean;
  failureReason?: string;
}

/**
 * Predefined stress test scenarios
 */
export const stressScenarios = {
  basic: {
    name: 'Basic Stress Test',
    instances: 100,
    updates: 10,
    updateStrategy: 'sequential' as const,
    threshold: {
      maxTime: 1000,
      maxMemory: 50 * 1024 * 1024, // 50MB
    },
  },
  
  heavy: {
    name: 'Heavy Load Test',
    instances: 1000,
    updates: 50,
    updateStrategy: 'batch' as const,
    threshold: {
      maxTime: 5000,
      maxMemory: 200 * 1024 * 1024, // 200MB
    },
  },
  
  rapid: {
    name: 'Rapid Update Test',
    instances: 50,
    updates: 100,
    updateStrategy: 'parallel' as const,
    threshold: {
      maxTime: 2000,
      maxRenderCount: 5000,
    },
  },
  
  memory: {
    name: 'Memory Leak Test',
    instances: 500,
    updates: 20,
    updateStrategy: 'sequential' as const,
    measureMemory: true,
    threshold: {
      maxMemory: 100 * 1024 * 1024, // 100MB
    },
  },
};

/**
 * Component-specific stress tests
 */
export function createComponentStressTest(
  Component: React.ComponentType<any>,
  componentName: string,
  defaultProps: any = {}
) {
  return describe(`${componentName} Stress Tests`, () => {
    const runner = new StressTestRunner();
    
    it('handles basic stress scenario', async () => {
      const result = await runner.runScenario(
        { ...stressScenarios.basic, props: defaultProps },
        Component
      );
      
      expect(result.passed).toBe(true);
      expect(result.avgTimePerRender).toBeLessThan(10);
    });
    
    it('handles heavy load scenario', async () => {
      const result = await runner.runScenario(
        { ...stressScenarios.heavy, props: defaultProps },
        Component
      );
      
      expect(result.passed).toBe(true);
      expect(result.totalTime).toBeLessThan(5000);
    });
    
    it('handles rapid updates', async () => {
      const result = await runner.runScenario(
        { ...stressScenarios.rapid, props: defaultProps },
        Component
      );
      
      expect(result.passed).toBe(true);
      expect(result.renderCount).toBeLessThan(5000);
    });
    
    it('does not leak memory', async () => {
      const result = await runner.runScenario(
        { ...stressScenarios.memory, props: defaultProps },
        Component
      );
      
      expect(result.passed).toBe(true);
      expect(result.memoryUsed).toBeLessThan(100 * 1024 * 1024);
    });
  });
}

/**
 * DOM manipulation stress test
 */
export async function stressTestDOMManipulation(
  operations: number,
  operationType: 'add' | 'remove' | 'update' | 'mixed'
) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  
  const startTime = performance.now();
  const elements: HTMLElement[] = [];
  
  try {
    for (let i = 0; i < operations; i++) {
      switch (operationType) {
        case 'add':
          const el = document.createElement('div');
          el.textContent = `Element ${i}`;
          container.appendChild(el);
          elements.push(el);
          break;
          
        case 'remove':
          if (elements.length > 0) {
            const toRemove = elements.shift()!;
            container.removeChild(toRemove);
          }
          break;
          
        case 'update':
          if (elements.length > 0) {
            const toUpdate = elements[Math.floor(Math.random() * elements.length)];
            toUpdate.textContent = `Updated ${i}`;
            toUpdate.style.color = `hsl(${i % 360}, 50%, 50%)`;
          }
          break;
          
        case 'mixed':
          const op = i % 3;
          if (op === 0) {
            const el = document.createElement('div');
            el.textContent = `Element ${i}`;
            container.appendChild(el);
            elements.push(el);
          } else if (op === 1 && elements.length > 0) {
            const toRemove = elements.shift()!;
            container.removeChild(toRemove);
          } else if (op === 2 && elements.length > 0) {
            const toUpdate = elements[Math.floor(Math.random() * elements.length)];
            toUpdate.textContent = `Updated ${i}`;
          }
          break;
      }
    }
    
    const endTime = performance.now();
    return {
      operations,
      totalTime: endTime - startTime,
      avgTimePerOp: (endTime - startTime) / operations,
      finalElementCount: container.children.length,
    };
    
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Event handler stress test
 */
export async function stressTestEventHandlers(
  elements: number,
  eventsPerElement: number,
  fireEvents: boolean = true
) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  
  const handlers: Function[] = [];
  let eventsFired = 0;
  
  const startTime = performance.now();
  
  try {
    // Create elements with event handlers
    for (let i = 0; i < elements; i++) {
      const el = document.createElement('button');
      el.textContent = `Button ${i}`;
      
      for (let e = 0; e < eventsPerElement; e++) {
        const handler = () => { eventsFired++; };
        handlers.push(handler);
        el.addEventListener('click', handler);
      }
      
      container.appendChild(el);
    }
    
    // Fire events if requested
    if (fireEvents) {
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        for (let i = 0; i < 10; i++) {
          button.dispatchEvent(new Event('click'));
        }
      });
    }
    
    const endTime = performance.now();
    
    return {
      elements,
      totalHandlers: handlers.length,
      eventsFired,
      setupTime: endTime - startTime,
      avgSetupTimePerHandler: (endTime - startTime) / handlers.length,
    };
    
  } finally {
    document.body.removeChild(container);
  }
}