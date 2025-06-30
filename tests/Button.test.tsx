import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../src/Button';

describe('Button Component', () => {
  it('renders button with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button');
    
    // Check content
    expect(button).toHaveTextContent('Click me');
    
    // Check it's not disabled
    expect(button).not.toBeDisabled();
    
    // Check it has button type by default
    expect(button).toHaveAttribute('type', 'button');
  });
  
  it('renders button with custom variant', () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    
    const button = screen.getByRole('button');
    
    // Check button renders with variant
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Secondary Button');
  });
  
  it('renders button with custom size', () => {
    render(<Button size="lg">Large Button</Button>);
    
    const button = screen.getByRole('button');
    
    // Check button renders with size
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Large Button');
  });
  
  it('renders disabled button', () => {
    render(<Button disabled>Disabled Button</Button>);
    
    const button = screen.getByRole('button');
    
    // Check it's disabled
    expect(button).toBeDisabled();
    expect(button.className).toContain('opacity-50');
    expect(button.className).toContain('cursor-not-allowed');
  });
  
  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    
    // Click the button
    fireEvent.click(button);
    
    // Check the handler was called
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    
    render(<Button disabled onClick={handleClick}>Disabled Button</Button>);
    
    const button = screen.getByRole('button');
    
    // Click the button
    fireEvent.click(button);
    
    // Check the handler was not called
    expect(handleClick).not.toHaveBeenCalled();
  });
  
  it('accepts additional className prop', () => {
    render(<Button className="custom-class">Custom Button</Button>);
    
    const button = screen.getByRole('button');
    
    // Check it has the custom class
    expect(button.className).toContain('custom-class');
  });
});