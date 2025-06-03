import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Button } from './Button';

// Ensure cleanup after each test
afterEach(() => {
  cleanup();
});

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-gradient-primary'); // primary variant
    expect(button).toHaveClass('px-6'); // medium size
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state correctly', () => {
    render(<Button isLoading>Loading button</Button>);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveAttribute('disabled');
  });

  it('applies different variants correctly', () => {
    // Test primary variant (default)
    const { unmount: unmount1 } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-gradient-primary');
    unmount1();

    // Test secondary variant
    const { unmount } = render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-slate-100');
    unmount();

    // Test outline variant
    const { unmount: unmount2 } = render(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-2');
    unmount2();

    // Test ghost variant
    const { unmount: unmount3 } = render(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-slate-600');
    unmount3();
  });

  it('applies different sizes correctly', () => {
    // Test small size
    const { unmount } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-4');
    unmount();

    // Test medium size (default)
    const { unmount: unmount2 } = render(<Button size="md">Medium</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-6');
    unmount2();

    // Test large size
    const { unmount: unmount3 } = render(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-8');
    unmount3();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('forwards additional props to button element', () => {
    render(<Button data-testid="test-button">Test</Button>);
    const button = screen.getByTestId('test-button');
    expect(button).toBeInTheDocument();
  });
}); 