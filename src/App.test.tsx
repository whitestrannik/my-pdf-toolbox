import { render, screen } from '@testing-library/react';
import App from './App';
import { describe, it, expect } from 'vitest';

describe('App', () => {
  it('renders app title in header', () => {
    render(<App />);
    const headline = screen.getByText(/My-PDF Toolbox/i);
    expect(headline).toBeInTheDocument();
  });

  it('renders homepage with privacy section', () => {
    render(<App />);
    const privacySections = screen.getAllByText(/Privacy First/i);
    expect(privacySections.length).toBeGreaterThan(0);
  });

  it('renders navigation', () => {
    render(<App />);
    const navigations = screen.getAllByRole('navigation');
    expect(navigations.length).toBeGreaterThan(0);
  });
}); 