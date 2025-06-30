import React from 'react';
import { render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

/**
 * Re-Shell UI Component Interaction Testing Utilities
 */

export interface InteractionTestContext {
  user: ReturnType<typeof userEvent.setup>;
  container: HTMLElement;
  debug: () => void;
  rerender: (ui: React.ReactElement) => void;
}

/**
 * Create an interaction test harness
 */
export function createInteractionTest(
  Component: React.ComponentType<any>,
  defaultProps: any = {}
): InteractionTestContext {
  const user = userEvent.setup();
  const result = render(<Component {...defaultProps} />);
  
  return {
    user,
    container: result.container,
    debug: result.debug,
    rerender: result.rerender,
  };
}

/**
 * Test keyboard navigation flow
 */
export async function testKeyboardFlow(
  container: HTMLElement,
  expectedSequence: string[]
) {
  const user = userEvent.setup();
  
  for (let i = 0; i < expectedSequence.length; i++) {
    await user.tab();
    
    const activeElement = document.activeElement;
    const expectedSelector = expectedSequence[i];
    
    if (expectedSelector.startsWith('[aria-label=')) {
      expect(activeElement?.getAttribute('aria-label')).toBe(
        expectedSelector.match(/\[aria-label="(.+)"\]/)?.[1]
      );
    } else {
      expect(activeElement?.matches(expectedSelector)).toBe(true);
    }
  }
}

/**
 * Test form interaction flow
 */
export async function testFormFlow(
  container: HTMLElement,
  interactions: Array<{
    type: 'type' | 'select' | 'check' | 'upload' | 'clear';
    selector: string;
    value?: string | string[] | File;
    expectedValue?: string;
    expectError?: boolean;
  }>
) {
  const user = userEvent.setup();
  
  for (const interaction of interactions) {
    const element = container.querySelector(interaction.selector) as HTMLElement;
    expect(element).toBeTruthy();
    
    switch (interaction.type) {
      case 'type':
        await user.clear(element);
        await user.type(element, interaction.value as string);
        break;
        
      case 'select':
        await user.selectOptions(element, interaction.value as string | string[]);
        break;
        
      case 'check':
        await user.click(element);
        break;
        
      case 'upload':
        await user.upload(element, interaction.value as File);
        break;
        
      case 'clear':
        await user.clear(element);
        break;
    }
    
    // Verify expected value
    if (interaction.expectedValue !== undefined) {
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        expect(element.value).toBe(interaction.expectedValue);
      } else if (element instanceof HTMLSelectElement) {
        expect(element.value).toBe(interaction.expectedValue);
      }
    }
    
    // Check for error state
    if (interaction.expectError !== undefined) {
      const errorMessage = container.querySelector(`[id="${element.getAttribute('aria-describedby')}"]`);
      expect(!!errorMessage).toBe(interaction.expectError);
    }
  }
}

/**
 * Test drag and drop interaction
 */
export async function testDragAndDrop(
  source: HTMLElement,
  target: HTMLElement,
  options?: {
    onDragStart?: () => void;
    onDragEnd?: () => void;
    expectSuccess?: boolean;
  }
) {
  const user = userEvent.setup();
  
  // Fire drag events
  await user.pointer([
    { target: source, keys: '[MouseLeft>]' },
    { coords: { x: 100, y: 100 } },
    { target: target },
    { keys: '[/MouseLeft]' }
  ]);
  
  if (options?.expectSuccess) {
    // Verify drop was successful
    await waitFor(() => {
      expect(target.querySelector('[data-dropped="true"]')).toBeTruthy();
    });
  }
}

/**
 * Test component state transitions
 */
export async function testStateTransitions<T extends Record<string, any>>(
  getComponent: () => T,
  transitions: Array<{
    action: (component: T) => Promise<void>;
    expectedState: Partial<T>;
    wait?: number;
  }>
) {
  for (const transition of transitions) {
    const component = getComponent();
    await transition.action(component);
    
    if (transition.wait) {
      await waitFor(() => {}, { timeout: transition.wait });
    }
    
    for (const [key, value] of Object.entries(transition.expectedState)) {
      expect(component[key]).toEqual(value);
    }
  }
}

/**
 * Test gesture interactions
 */
export async function testGestures(
  element: HTMLElement,
  gestures: Array<{
    type: 'swipe' | 'pinch' | 'rotate' | 'longPress';
    direction?: 'left' | 'right' | 'up' | 'down';
    distance?: number;
    scale?: number;
    angle?: number;
    duration?: number;
    onComplete?: () => void;
  }>
) {
  const user = userEvent.setup();
  
  for (const gesture of gestures) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    switch (gesture.type) {
      case 'swipe':
        const distance = gesture.distance || 100;
        let endX = centerX;
        let endY = centerY;
        
        switch (gesture.direction) {
          case 'left': endX -= distance; break;
          case 'right': endX += distance; break;
          case 'up': endY -= distance; break;
          case 'down': endY += distance; break;
        }
        
        await user.pointer([
          { target: element, coords: { x: centerX, y: centerY }, keys: '[TouchA>]' },
          { coords: { x: endX, y: endY } },
          { keys: '[/TouchA]' }
        ]);
        break;
        
      case 'pinch':
        const scale = gesture.scale || 0.5;
        await user.pointer([
          { target: element, coords: { x: centerX - 50, y: centerY }, keys: '[TouchA>]' },
          { target: element, coords: { x: centerX + 50, y: centerY }, keys: '[TouchB>]' },
          { coords: { x: centerX - 50 * scale, y: centerY } },
          { coords: { x: centerX + 50 * scale, y: centerY } },
          { keys: '[/TouchA][/TouchB]' }
        ]);
        break;
        
      case 'longPress':
        await user.pointer([
          { target: element, keys: '[TouchA>]' },
          { keys: '[TouchA]' }
        ]);
        await waitFor(() => {}, { timeout: gesture.duration || 500 });
        await user.pointer([{ keys: '[/TouchA]' }]);
        break;
    }
    
    if (gesture.onComplete) {
      gesture.onComplete();
    }
  }
}

/**
 * Test complex interaction scenarios
 */
export class InteractionScenario {
  private steps: Array<() => Promise<void>> = [];
  private verifications: Array<() => void> = [];
  
  constructor(private container: HTMLElement) {}
  
  addStep(description: string, action: () => Promise<void>) {
    this.steps.push(async () => {
      console.log(`Step: ${description}`);
      await action();
    });
    return this;
  }
  
  verify(description: string, check: () => void) {
    this.verifications.push(() => {
      console.log(`Verify: ${description}`);
      check();
    });
    return this;
  }
  
  async run() {
    for (const step of this.steps) {
      await step();
    }
    
    for (const verification of this.verifications) {
      verification();
    }
  }
}

/**
 * Test timing-sensitive interactions
 */
export async function testTimingInteraction(
  setup: () => Promise<void>,
  actions: Array<{
    delay: number;
    action: () => Promise<void>;
    expectation?: () => void;
  }>
) {
  await setup();
  
  for (const { delay, action, expectation } of actions) {
    await waitFor(() => {}, { timeout: delay });
    await action();
    
    if (expectation) {
      await waitFor(expectation);
    }
  }
}

/**
 * Test multi-user interactions (for collaborative features)
 */
export async function testMultiUserInteraction(
  users: Array<{
    id: string;
    actions: Array<() => Promise<void>>;
  }>,
  expectations: Array<() => void>
) {
  // Simulate concurrent actions
  const promises = users.map(async (user) => {
    for (const action of user.actions) {
      console.log(`User ${user.id} performing action`);
      await action();
    }
  });
  
  await Promise.all(promises);
  
  // Verify expectations
  for (const expectation of expectations) {
    expectation();
  }
}

/**
 * Test interaction performance
 */
export async function measureInteractionPerformance(
  interaction: () => Promise<void>,
  options: {
    maxDuration?: number;
    warmupRuns?: number;
    testRuns?: number;
  } = {}
) {
  const { maxDuration = 100, warmupRuns = 3, testRuns = 10 } = options;
  
  // Warmup runs
  for (let i = 0; i < warmupRuns; i++) {
    await interaction();
  }
  
  // Test runs
  const durations: number[] = [];
  for (let i = 0; i < testRuns; i++) {
    const start = performance.now();
    await interaction();
    const end = performance.now();
    durations.push(end - start);
  }
  
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const maxRecorded = Math.max(...durations);
  
  console.log(`Average interaction duration: ${avgDuration.toFixed(2)}ms`);
  console.log(`Max interaction duration: ${maxRecorded.toFixed(2)}ms`);
  
  expect(avgDuration).toBeLessThan(maxDuration);
  
  return {
    average: avgDuration,
    max: maxRecorded,
    all: durations,
  };
}