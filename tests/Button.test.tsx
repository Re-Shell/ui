import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../src/Button';

describe('Button Component', () => {
  it('renders button with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByTestId('re-shell-button');
    
    // Check content
    expect(button).toHaveTextContent('Click me');
    
    // Check it has primary variant class
    expect(button.className).toContain('bg-blue-600');
    
    // Check it has medium size class
    expect(button.className).toContain('py-2 px-4');
    
    // Check it's not disabled
    expect(button).not.toBeDisabled();
  });
  
  it('renders button with custom variant', () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    
    const button = screen.getByTestId('re-shell-button');
    
    // Check it has secondary variant class
    expect(button.className).toContain('bg-gray-200');
  });
  
  it('renders button with custom size', () => {
    render(<Button size="large">Large Button</Button>);
    
    const button = screen.getByTestId('re-shell-button');
    
    // Check it has large size class
    expect(button.className).toContain('py-3 px-6');
  });
  
  it('renders disabled button', () => {
    render(<Button disabled>Disabled Button</Button>);
    
    const button = screen.getByTestId('re-shell-button');
    
    // Check it's disabled
    expect(button).toBeDisabled();
    expect(button.className).toContain('opacity-50');
    expect(button.className).toContain('cursor-not-allowed');
  });
  
  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByTestId('re-shell-button');
    
    // Click the button
    fireEvent.click(button);
    
    // Check the handler was called
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    
    render(<Button disabled onClick={handleClick}>Disabled Button</Button>);
    
    const button = screen.getByTestId('re-shell-button');
    
    // Click the button
    fireEvent.click(button);
    
    // Check the handler was not called
    expect(handleClick).not.toHaveBeenCalled();
  });
  
  it('accepts additional className prop', () => {
    render(<Button className="custom-class">Custom Button</Button>);
    
    const button = screen.getByTestId('re-shell-button');
    
    // Check it has the custom class
    expect(button.className).toContain('custom-class');
  });
});