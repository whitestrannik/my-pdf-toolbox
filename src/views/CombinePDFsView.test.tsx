import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CombinePDFsView } from './CombinePDFsView';

describe('CombinePDFsView', () => {
  it('renders the combine PDFs interface', () => {
    render(<CombinePDFsView />);
    
    // Check for main heading
    expect(screen.getByText('📄 Combine PDFs')).toBeInTheDocument();
    
    // Check for description
    expect(screen.getByText(/Merge multiple PDF files into a single document/)).toBeInTheDocument();
    
    // Check for dropzone
    expect(screen.getByText('Drop PDF files here')).toBeInTheDocument();
    expect(screen.getByText('or click to browse (max 20MB each)')).toBeInTheDocument();
  });

  it('shows file size limit in description', () => {
    render(<CombinePDFsView />);
    
    expect(screen.getByText(/Maximum file size: 20MB per file/)).toBeInTheDocument();
  });

  it('initially shows no files uploaded state', () => {
    render(<CombinePDFsView />);
    
    // Should not show the files list initially
    expect(screen.queryByText(/Files to Combine/)).toBeNull();
  });
}); 