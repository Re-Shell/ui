import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { Button } from '../../src/components/Button';
import {
  PerformanceTestHarness,
  measureRenderPerformance,
  benchmark,
  stressTest,
  performanceBudget,
} from './performance-test-utils';

describe('Button Performance Tests', () => {
  it('renders within performance budget', async () => {
    const harness = new PerformanceTestHarness();
    
    harness.start();
    render(<Button>Test Button</Button>);
    harness.stop();
    
    const metrics = harness.getMetrics();
    
    performanceBudget.assert(metrics, {
      renderTime: 10, // 10ms budget for initial render
      totalTime: 20,  // 20ms total budget
      memoryDelta: 1024 * 1024, // 1MB memory budget
    });
  });

  it('measures render performance across multiple runs', async () => {
    const results = await measureRenderPerformance(
      () => render(<Button>Performance Test</Button>),
      { runs: 100, warmupRuns: 10 }
    );
    
    expect(results.average).toBeLessThan(5); // Average render time < 5ms
    expect(results.p95).toBeLessThan(10);    // 95th percentile < 10ms
    expect(results.p99).toBeLessThan(15);    // 99th percentile < 15ms
    
    console.log('Button render performance:', {
      average: `${results.average.toFixed(2)}ms`,
      median: `${results.median.toFixed(2)}ms`,
      p95: `${results.p95.toFixed(2)}ms`,
      p99: `${results.p99.toFixed(2)}ms`,
    });
  });

  it('benchmarks click handler performance', async () => {
    let counter = 0;
    const handleClick = () => { counter++; };
    
    const { container } = render(<Button onClick={handleClick}>Click Test</Button>);
    const button = container.querySelector('button')!;
    
    await benchmark('Button click handler', () => {
      button.click();
    }, { iterations: 10000 });
    
    expect(counter).toBe(10000);
  });

  it('handles stress test with many instances', async () => {
    const metrics = await stressTest(Button, {
      instances: 100,
      updates: 50,
      props: { children: 'Stress Test' },
      updateProps: (index) => ({
        children: `Button ${index}`,
        disabled: index % 2 === 0,
      }),
    });
    
    expect(metrics.totalTime).toBeLessThan(1000); // Less than 1 second for stress test
    expect(metrics.renderCount).toBeGreaterThan(0);
  });

  it('measures re-render performance with prop changes', async () => {
    const { rerender } = render(<Button variant="primary">Initial</Button>);
    
    const harness = new PerformanceTestHarness();
    harness.start();
    
    // Test different prop changes
    const propChanges = [
      { variant: 'secondary', children: 'Secondary' },
      { variant: 'outline', children: 'Outline' },
      { variant: 'ghost', children: 'Ghost' },
      { disabled: true, children: 'Disabled' },
      { loading: true, children: 'Loading' },
      { size: 'small', children: 'Small' },
      { size: 'large', children: 'Large' },
    ];
    
    for (const props of propChanges) {
      rerender(<Button {...props} />);
    }
    
    harness.stop();
    const metrics = harness.getMetrics();
    
    expect(metrics.updateTime).toBeLessThan(50); // Updates should be fast
  });

  it('measures performance with complex children', async () => {
    const ComplexChildren = () => (
      <>
        <span>Icon</span>
        <span>Text with {Math.random()}</span>
        <span>Badge</span>
      </>
    );
    
    const results = await measureRenderPerformance(
      () => render(
        <Button>
          <ComplexChildren />
        </Button>
      ),
      { runs: 50 }
    );
    
    expect(results.average).toBeLessThan(10); // Still performant with complex children
  });

  it('tests memory efficiency', () => {
    const buttons: any[] = [];
    
    const memoryBefore = process.memoryUsage().heapUsed;
    
    // Create many button instances
    for (let i = 0; i < 1000; i++) {
      buttons.push(render(<Button key={i}>Button {i}</Button>));
    }
    
    const memoryAfter = process.memoryUsage().heapUsed;
    const memoryPerButton = (memoryAfter - memoryBefore) / 1000;
    
    console.log(`Memory per button: ${(memoryPerButton / 1024).toFixed(2)}KB`);
    
    // Each button should use less than 10KB
    expect(memoryPerButton).toBeLessThan(10 * 1024);
    
    // Cleanup
    buttons.forEach(({ unmount }) => unmount());
  });

  it('benchmarks event delegation vs individual handlers', async () => {
    // Individual handlers
    const IndividualButtons = () => (
      <div>
        {Array.from({ length: 100 }, (_, i) => (
          <Button key={i} onClick={() => console.log(i)}>
            Button {i}
          </Button>
        ))}
      </div>
    );
    
    // Event delegation
    const DelegatedButtons = () => {
      const handleClick = (e: React.MouseEvent) => {
        const button = (e.target as HTMLElement).closest('button');
        if (button) {
          console.log(button.dataset.index);
        }
      };
      
      return (
        <div onClick={handleClick}>
          {Array.from({ length: 100 }, (_, i) => (
            <Button key={i} data-index={i}>
              Button {i}
            </Button>
          ))}
        </div>
      );
    };
    
    console.log('\nComparing event handling strategies:');
    
    await benchmark('Individual handlers', () => {
      const { unmount } = render(<IndividualButtons />);
      unmount();
    }, { iterations: 100 });
    
    await benchmark('Event delegation', () => {
      const { unmount } = render(<DelegatedButtons />);
      unmount();
    }, { iterations: 100 });
  });

  it('measures style calculation performance', async () => {
    const harness = new PerformanceTestHarness();
    
    // Test inline styles vs CSS classes
    harness.start();
    
    for (let i = 0; i < 100; i++) {
      render(
        <Button
          style={{
            backgroundColor: `hsl(${i}, 50%, 50%)`,
            color: i % 2 ? 'white' : 'black',
            padding: `${i % 10}px`,
          }}
        >
          Styled Button {i}
        </Button>
      );
    }
    
    harness.stop();
    const inlineMetrics = harness.getMetrics();
    
    console.log('Style performance comparison:');
    console.log(`Inline styles: ${inlineMetrics.totalTime.toFixed(2)}ms`);
    
    expect(inlineMetrics.totalTime).toBeLessThan(100);
  });
});