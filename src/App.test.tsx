import { render, screen } from '@testing-library/react';
import App from './App';
import { describe, it, expect } from 'vitest';

describe('App', () => {
  it('renders headline', () => {
    render(<App />);
    const headline = screen.getByText(/My-PDF Toolbox/i);
    expect(headline).toBeInTheDocument();
  });

  it('renders coming soon message', () => {
    render(<App />);
    const comingSoonMessage = screen.getByText(/Coming soon!/i);
    expect(comingSoonMessage).toBeInTheDocument();
  });
}); 