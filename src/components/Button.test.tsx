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
    expect(button).toHaveClass('bg-sky-600'); // primary variant
    expect(button).toHaveClass('px-4'); // medium size
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state correctly', () => {
    render(<Button isLoading>Click me</Button>);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveAttribute('disabled');
  });

  it('applies different variants correctly', () => {
    // Test secondary variant
    const { unmount } = render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-gray-600');
    unmount();

    // Test outline variant
    render(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border');
  });

  it('applies different sizes correctly', () => {
    // Test small size
    const { unmount } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-3');
    unmount();

    // Test large size
    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-6');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('forwards additional props to button element', () => {
    render(<Button type="submit" data-testid="submit-btn">Submit</Button>);
    const button = screen.getByTestId('submit-btn');
    expect(button).toHaveAttribute('type', 'submit');
  });
}); 