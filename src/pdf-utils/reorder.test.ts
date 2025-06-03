import { describe, it, expect, beforeEach } from 'vitest';
import { 
  reorderPDF,
  getDefaultPageOrder,
  reversePageOrder,
  randomizePageOrder,
  isReorderNecessary,
  type ReorderPDFOptions 
} from './reorder';

// Mock PDF files for testing
function createMockPDFFile(name: string): File {
  const blob = new Blob(['mock pdf content'], { type: 'application/pdf' });
  return new File([blob], name, { type: 'application/pdf' });
}

function createMockNonPDFFile(name: string): File {
  const blob = new Blob(['mock content'], { type: 'text/plain' });
  return new File([blob], name, { type: 'text/plain' });
}

describe('reorderPDF', () => {
  let mockPDFFile: File;
  let mockNonPDFFile: File;

  beforeEach(() => {
    mockPDFFile = createMockPDFFile('test.pdf');
    mockNonPDFFile = createMockNonPDFFile('test.txt');
  });

  it('should return error for missing file', async () => {
    const options: ReorderPDFOptions = {
      file: null as any,
      pageOrder: [1, 2]
    };
    const result = await reorderPDF(options);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('No file provided');
    }
  });

  it('should return error for non-PDF file', async () => {
    const options: ReorderPDFOptions = {
      file: mockNonPDFFile,
      pageOrder: [1, 2]
    };
    const result = await reorderPDF(options);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Invalid file type');
      expect(result.details).toContain("Expected 'application/pdf', got 'text/plain'");
    }
  });

  it('should return error for empty page order', async () => {
    const options: ReorderPDFOptions = {
      file: mockPDFFile,
      pageOrder: []
    };
    const result = await reorderPDF(options);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('No page order provided');
    }
  });

  it('should handle PDF processing errors', async () => {
    const options: ReorderPDFOptions = {
      file: mockPDFFile,
      pageOrder: [1, 2, 3]
    };
    const result = await reorderPDF(options);

    // Should fail due to invalid PDF content
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Failed to reorder PDF pages');
    }
  });

  it('should return correct structure', async () => {
    const options: ReorderPDFOptions = {
      file: mockPDFFile,
      pageOrder: [2, 1, 3]
    };
    const result = await reorderPDF(options);

    expect(result).toHaveProperty('success');
    
    if (result.success) {
      expect(result).toHaveProperty('pdfBlob');
      expect(result).toHaveProperty('totalPages');
      expect(result).toHaveProperty('reorderedPages');
      expect(result.pdfBlob).toBeInstanceOf(Blob);
      expect(typeof result.totalPages).toBe('number');
      expect(typeof result.reorderedPages).toBe('number');
    } else {
      expect(result).toHaveProperty('error');
    }
  });
});

describe('getDefaultPageOrder', () => {
  it('should generate correct default order', () => {
    expect(getDefaultPageOrder(3)).toEqual([1, 2, 3]);
    expect(getDefaultPageOrder(5)).toEqual([1, 2, 3, 4, 5]);
    expect(getDefaultPageOrder(1)).toEqual([1]);
  });

  it('should handle zero pages', () => {
    expect(getDefaultPageOrder(0)).toEqual([]);
  });

  it('should handle large page counts', () => {
    const result = getDefaultPageOrder(100);
    expect(result).toHaveLength(100);
    expect(result[0]).toBe(1);
    expect(result[99]).toBe(100);
  });
});

describe('reversePageOrder', () => {
  it('should reverse page order correctly', () => {
    expect(reversePageOrder(3)).toEqual([3, 2, 1]);
    expect(reversePageOrder(5)).toEqual([5, 4, 3, 2, 1]);
    expect(reversePageOrder(1)).toEqual([1]);
  });

  it('should handle zero pages', () => {
    expect(reversePageOrder(0)).toEqual([]);
  });

  it('should handle large page counts', () => {
    const result = reversePageOrder(100);
    expect(result).toHaveLength(100);
    expect(result[0]).toBe(100);
    expect(result[99]).toBe(1);
  });
});

describe('randomizePageOrder', () => {
  it('should contain all original pages', () => {
    const pageCount = 5;
    const randomized = randomizePageOrder(pageCount);
    const original = getDefaultPageOrder(pageCount);
    
    expect(randomized).toHaveLength(pageCount);
    expect(randomized.sort()).toEqual(original);
  });

  it('should handle single page', () => {
    expect(randomizePageOrder(1)).toEqual([1]);
  });

  it('should handle zero pages', () => {
    expect(randomizePageOrder(0)).toEqual([]);
  });

  it('should produce different results on multiple calls (probabilistic)', () => {
    const pageCount = 10;
    const results = Array.from({ length: 5 }, () => randomizePageOrder(pageCount));
    
    // Check that at least some results are different (very high probability)
    const allIdentical = results.every(result => 
      JSON.stringify(result) === JSON.stringify(results[0])
    );
    
    // With 10 pages, it's extremely unlikely all 5 results would be identical
    expect(allIdentical).toBe(false);
  });
});

describe('isReorderNecessary', () => {
  it('should return false for default order', () => {
    expect(isReorderNecessary([1, 2, 3])).toBe(false);
    expect(isReorderNecessary([1, 2, 3, 4, 5])).toBe(false);
    expect(isReorderNecessary([1])).toBe(false);
  });

  it('should return true for reordered pages', () => {
    expect(isReorderNecessary([2, 1, 3])).toBe(true);
    expect(isReorderNecessary([3, 2, 1])).toBe(true);
    expect(isReorderNecessary([1, 3, 2])).toBe(true);
    expect(isReorderNecessary([5, 4, 3, 2, 1])).toBe(true);
  });

  it('should handle empty array', () => {
    expect(isReorderNecessary([])).toBe(false);
  });

  it('should handle partial orders', () => {
    expect(isReorderNecessary([1, 2])).toBe(false);
    expect(isReorderNecessary([2, 1])).toBe(true);
  });
}); 