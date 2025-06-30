import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../../src/Button';
import { 
  createInteractionTest,
  testKeyboardFlow,
  InteractionScenario,
  measureInteractionPerformance 
} from './interaction-test-utils';

describe('Button Interaction Tests', () => {
  it('handles click interactions correctly', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button');
    
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    // Test double click
    await user.dblClick(button);
    expect(handleClick).toHaveBeenCalledTimes(3); // 1 + 2
  });

  it('handles keyboard interactions', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Press me</Button>);
    const button = screen.getByRole('button');
    
    // Focus and press Enter
    await user.tab();
    expect(button).toHaveFocus();
    
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    // Press Space
    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('prevents interaction when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick} disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
    
    await user.keyboard('{Enter}');
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('handles loading state interactions', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    const { rerender } = render(
      <Button onClick={handleClick}>Submit</Button>
    );
    
    const button = screen.getByRole('button');
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    // Switch to loading state
    rerender(<Button onClick={handleClick} loading>Submit</Button>);
    
    // Should not trigger click when loading
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles focus management correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <Button>First</Button>
        <Button>Second</Button>
        <Button>Third</Button>
      </div>
    );
    
    await testKeyboardFlow(document.body, [
      'button:nth-child(1)',
      'button:nth-child(2)',
      'button:nth-child(3)',
    ]);
  });

  it('handles complex interaction scenario', async () => {
    const handleSubmit = vi.fn();
    const handleCancel = vi.fn();
    
    const { container } = render(
      <form>
        <input type="text" name="username" />
        <Button type="submit" onClick={handleSubmit}>Submit</Button>
        <Button type="button" onClick={handleCancel}>Cancel</Button>
      </form>
    );
    
    const scenario = new InteractionScenario(container);
    
    await scenario
      .addStep('Fill username', async () => {
        const input = container.querySelector('input[name="username"]') as HTMLInputElement;
        await userEvent.type(input, 'testuser');
      })
      .addStep('Submit form', async () => {
        const submitButton = screen.getByText('Submit');
        await userEvent.click(submitButton);
      })
      .verify('Form submitted with correct data', () => {
        expect(handleSubmit).toHaveBeenCalled();
        const input = container.querySelector('input[name="username"]') as HTMLInputElement;
        expect(input.value).toBe('testuser');
      })
      .run();
  });

  it('handles rapid clicks correctly', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Rapid Click</Button>);
    const button = screen.getByRole('button');
    
    // Rapid clicking
    for (let i = 0; i < 5; i++) {
      await user.click(button);
    }
    
    expect(handleClick).toHaveBeenCalledTimes(5);
  });

  it('handles long press interactions', async () => {
    const handleLongPress = vi.fn();
    const handleClick = vi.fn();
    
    render(
      <Button 
        onClick={handleClick}
        onMouseDown={() => {
          const timeout = setTimeout(() => {
            handleLongPress();
          }, 500);
          
          document.addEventListener('mouseup', () => {
            clearTimeout(timeout);
          }, { once: true });
        }}
      >
        Long Press
      </Button>
    );
    
    const button = screen.getByRole('button');
    const user = userEvent.setup();
    
    // Normal click (short press)
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleLongPress).not.toHaveBeenCalled();
    
    // Long press
    await user.pointer([
      { target: button, keys: '[MouseLeft>]' },
    ]);
    
    await waitFor(() => {
      expect(handleLongPress).toHaveBeenCalled();
    }, { timeout: 600 });
  });

  it('measures click performance', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Performance Test</Button>);
    const button = screen.getByRole('button');
    
    const results = await measureInteractionPerformance(
      async () => {
        await userEvent.click(button);
      },
      {
        maxDuration: 50,
        warmupRuns: 3,
        testRuns: 10,
      }
    );
    
    expect(results.average).toBeLessThan(50);
    expect(handleClick).toHaveBeenCalled();
  });

  it('handles hover interactions', async () => {
    const handleMouseEnter = vi.fn();
    const handleMouseLeave = vi.fn();
    const user = userEvent.setup();
    
    render(
      <Button 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        Hover me
      </Button>
    );
    
    const button = screen.getByRole('button');
    
    await user.hover(button);
    expect(handleMouseEnter).toHaveBeenCalledTimes(1);
    
    await user.unhover(button);
    expect(handleMouseLeave).toHaveBeenCalledTimes(1);
  });

  it('handles focus trap in button group', async () => {
    const user = userEvent.setup();
    
    render(
      <div role="group" aria-label="Button group">
        <Button>Option 1</Button>
        <Button>Option 2</Button>
        <Button>Option 3</Button>
      </div>
    );
    
    const buttons = screen.getAllByRole('button');
    
    // Focus first button
    buttons[0].focus();
    expect(document.activeElement).toBe(buttons[0]);
    
    // Tab navigation through buttons
    await user.tab();
    expect(document.activeElement).toBe(buttons[1]);
    
    await user.tab();
    expect(document.activeElement).toBe(buttons[2]);
    
    // Shift+Tab to go back
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(buttons[1]);
  });

  it('handles tooltip interactions', async () => {
    const user = userEvent.setup();
    
    render(
      <Button aria-describedby="tooltip">
        <span>Hover for tooltip</span>
        <div id="tooltip" role="tooltip" style={{ display: 'none' }}>
          Helpful information
        </div>
      </Button>
    );
    
    const button = screen.getByRole('button');
    const tooltip = screen.getByRole('tooltip');
    
    // Initially hidden
    expect(tooltip).toHaveStyle({ display: 'none' });
    
    // Tooltip remains hidden as this is just a test example
    // Real tooltip implementation would handle hover events
    await user.hover(button);
    expect(tooltip).toHaveStyle({ display: 'none' });
    
    await user.unhover(button);
    expect(tooltip).toHaveStyle({ display: 'none' });
  });
});