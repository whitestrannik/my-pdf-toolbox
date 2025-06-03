import { describe, it, expect, beforeEach } from 'vitest';
import { 
  compressPDF, 
  formatFileSize, 
  calculateCompressionPercentage,
  type CompressPDFOptions 
} from './compress';

// Mock PDF files for testing
function createMockPDFFile(name: string, sizeKB: number = 100): File {
  const content = 'x'.repeat(sizeKB * 1024); // Create content of specified size
  const blob = new Blob([content], { type: 'application/pdf' });
  return new File([blob], name, { type: 'application/pdf' });
}

function createMockNonPDFFile(name: string): File {
  const blob = new Blob(['mock content'], { type: 'text/plain' });
  return new File([blob], name, { type: 'text/plain' });
}

describe('compressPDF', () => {
  let mockPDFFile: File;
  let mockNonPDFFile: File;

  beforeEach(() => {
    mockPDFFile = createMockPDFFile('test.pdf', 200);
    mockNonPDFFile = createMockNonPDFFile('test.txt');
  });

  it('should return error for missing file', async () => {
    const options: CompressPDFOptions = {
      file: null as any,
      compressionLevel: 'medium'
    };
    const result = await compressPDF(options);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('No file provided');
    }
  });

  it('should return error for non-PDF file', async () => {
    const options: CompressPDFOptions = {
      file: mockNonPDFFile,
      compressionLevel: 'medium'
    };
    const result = await compressPDF(options);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Invalid file type');
      expect(result.details).toContain("Expected 'application/pdf', got 'text/plain'");
    }
  });

  it('should validate compression level', async () => {
    const options: CompressPDFOptions = {
      file: mockPDFFile,
      compressionLevel: 'invalid' as any
    };
    const result = await compressPDF(options);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid compression level. Supported levels: low, medium, high');
    }
  });

  it('should handle all valid compression levels', async () => {
    const levels: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
    
    for (const level of levels) {
      const options: CompressPDFOptions = {
        file: mockPDFFile,
        compressionLevel: level
      };
      const result = await compressPDF(options);
      
      // Should fail on PDF processing, not level validation
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Failed to compress PDF');
      }
    }
  });

  it('should handle PDF processing errors', async () => {
    const options: CompressPDFOptions = {
      file: mockPDFFile,
      compressionLevel: 'medium'
    };
    const result = await compressPDF(options);

    // Should fail due to invalid PDF content
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Failed to compress PDF');
      expect(result.details).toBeDefined();
    }
  });

  it('should return correct structure for result', async () => {
    const options: CompressPDFOptions = {
      file: mockPDFFile,
      compressionLevel: 'high'
    };
    const result = await compressPDF(options);

    expect(result).toHaveProperty('success');
    
    if (result.success) {
      expect(result).toHaveProperty('pdfBlob');
      expect(result).toHaveProperty('originalSize');
      expect(result).toHaveProperty('compressedSize');
      expect(result).toHaveProperty('compressionRatio');
      expect(result.pdfBlob).toBeInstanceOf(Blob);
      expect(typeof result.originalSize).toBe('number');
      expect(typeof result.compressedSize).toBe('number');
      expect(typeof result.compressionRatio).toBe('number');
    } else {
      expect(result).toHaveProperty('error');
      expect(typeof result.error).toBe('string');
    }
  });
});

describe('formatFileSize', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(512)).toBe('512 Bytes');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });

  it('should handle large numbers', () => {
    expect(formatFileSize(2048)).toBe('2 KB');
    expect(formatFileSize(5242880)).toBe('5 MB');
    expect(formatFileSize(1073741824 * 2.5)).toBe('2.5 GB');
  });

  it('should round to 2 decimal places', () => {
    expect(formatFileSize(1234)).toBe('1.21 KB');
    expect(formatFileSize(1234567)).toBe('1.18 MB');
  });
});

describe('calculateCompressionPercentage', () => {
  it('should calculate compression percentage correctly', () => {
    expect(calculateCompressionPercentage(1000, 500)).toBe(50);
    expect(calculateCompressionPercentage(1000, 750)).toBe(25);
    expect(calculateCompressionPercentage(1000, 100)).toBe(90);
    expect(calculateCompressionPercentage(1000, 1000)).toBe(0);
  });

  it('should handle edge cases', () => {
    expect(calculateCompressionPercentage(0, 0)).toBe(0);
    expect(calculateCompressionPercentage(0, 100)).toBe(0);
    expect(calculateCompressionPercentage(1000, 0)).toBe(100);
  });

  it('should return non-negative values', () => {
    // When compressed size is larger than original (can happen with small files)
    expect(calculateCompressionPercentage(100, 150)).toBe(0);
    expect(calculateCompressionPercentage(100, 200)).toBe(0);
  });

  it('should round to nearest integer', () => {
    expect(calculateCompressionPercentage(1000, 666)).toBe(33); // 33.4% rounded
    expect(calculateCompressionPercentage(1000, 667)).toBe(33); // 33.3% rounded
    expect(calculateCompressionPercentage(1000, 665)).toBe(34); // 33.5% rounded
  });
}); 