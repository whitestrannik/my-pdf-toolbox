import { PDFDocument } from 'pdf-lib';

export interface ReorderPDFOptions {
  file: File;
  pageOrder: number[]; // Array of page numbers in desired order (1-based)
}

export interface ReorderPDFResult {
  success: true;
  pdfBlob: Blob;
  totalPages: number;
  reorderedPages: number;
}

export interface ReorderPDFError {
  success: false;
  error: string;
  details?: string;
}

export type ReorderPDFResponse = ReorderPDFResult | ReorderPDFError;

/**
 * Reorders pages in a PDF document according to the specified order
 * @param options - Configuration object containing file and desired page order
 * @returns Promise that resolves to reordered PDF blob or error
 */
export async function reorderPDF(options: ReorderPDFOptions): Promise<ReorderPDFResponse> {
  try {
    const { file, pageOrder } = options;

    // Validate input
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    if (file.type !== 'application/pdf') {
      return { 
        success: false, 
        error: 'Invalid file type. Only PDF files are supported.',
        details: `Expected 'application/pdf', got '${file.type}'`
      };
    }

    if (!pageOrder || pageOrder.length === 0) {
      return { success: false, error: 'No page order provided' };
    }

    // Load the source PDF
    const fileBuffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(fileBuffer);
    const totalPages = sourcePdf.getPageCount();

    if (totalPages === 0) {
      return { success: false, error: 'PDF file has no pages' };
    }

    // Validate page order
    const validationError = validatePageOrder(pageOrder, totalPages);
    if (validationError) {
      return { success: false, error: validationError };
    }

    // Create a new PDF document for the reordered pages
    const reorderedPdf = await PDFDocument.create();

    // Copy pages in the specified order
    for (const pageNum of pageOrder) {
      try {
        // Convert to 0-based index
        const pageIndex = pageNum - 1;
        
        // Copy the page from source to destination
        const [copiedPage] = await reorderedPdf.copyPages(sourcePdf, [pageIndex]);
        
        // Add the copied page to the reordered document
        reorderedPdf.addPage(copiedPage);
        
      } catch (pageError) {
        return {
          success: false,
          error: `Failed to reorder page ${pageNum}`,
          details: pageError instanceof Error ? pageError.message : String(pageError)
        };
      }
    }

    // Generate the final PDF bytes
    const pdfBytes = await reorderedPdf.save();
    
    // Create blob for download
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

    return {
      success: true,
      pdfBlob,
      totalPages,
      reorderedPages: pageOrder.length
    };

  } catch (error) {
    return {
      success: false,
      error: 'Failed to reorder PDF pages',
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Validates the page order array
 */
function validatePageOrder(pageOrder: number[], totalPages: number): string | null {
  // Check for empty array
  if (pageOrder.length === 0) {
    return 'Page order cannot be empty';
  }

  // Check for invalid page numbers
  for (const pageNum of pageOrder) {
    if (!Number.isInteger(pageNum) || pageNum < 1 || pageNum > totalPages) {
      return `Invalid page number: ${pageNum}. Pages must be between 1 and ${totalPages}`;
    }
  }

  // Check if all pages are included (no missing pages)
  const uniquePages = [...new Set(pageOrder)];
  if (uniquePages.length !== pageOrder.length) {
    return 'Duplicate page numbers found in page order';
  }

  // Optional: Check if all original pages are included
  // This validation can be relaxed if we want to allow excluding pages
  const expectedPages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const sortedPageOrder = [...uniquePages].sort((a, b) => a - b);
  const sortedExpected = [...expectedPages].sort((a, b) => a - b);

  if (JSON.stringify(sortedPageOrder) !== JSON.stringify(sortedExpected)) {
    return `Page order must include all pages from 1 to ${totalPages}. Missing or extra pages detected.`;
  }

  return null; // No validation errors
}

/**
 * Utility function to generate a default page order (no reordering)
 */
export function getDefaultPageOrder(totalPages: number): number[] {
  return Array.from({ length: totalPages }, (_, i) => i + 1);
}

/**
 * Utility function to reverse page order
 */
export function reversePageOrder(totalPages: number): number[] {
  return Array.from({ length: totalPages }, (_, i) => totalPages - i);
}

/**
 * Utility function to create a random page order (for testing/demo purposes)
 */
export function randomizePageOrder(totalPages: number): number[] {
  const pages = getDefaultPageOrder(totalPages);
  
  // Fisher-Yates shuffle algorithm
  for (let i = pages.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pages[i], pages[j]] = [pages[j], pages[i]];
  }
  
  return pages;
}

/**
 * Utility function to validate if a reorder operation would actually change the order
 */
export function isReorderNecessary(pageOrder: number[]): boolean {
  for (let i = 0; i < pageOrder.length; i++) {
    if (pageOrder[i] !== i + 1) {
      return true; // Order is different from default
    }
  }
  return false; // Order is the same as default (1, 2, 3, ...)
} 