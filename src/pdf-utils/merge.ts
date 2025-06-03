import { PDFDocument } from "pdf-lib";

export interface MergePDFsOptions {
  files: File[];
}

export interface MergePDFsResult {
  success: true;
  pdfBlob: Blob;
  totalPages: number;
}

export interface MergePDFsError {
  success: false;
  error: string;
  details?: string;
}

export type MergePDFsResponse = MergePDFsResult | MergePDFsError;

/**
 * Merges multiple PDF files into a single PDF document
 * @param options - Configuration object containing files to merge
 * @returns Promise that resolves to merged PDF blob or error
 */
export async function mergePDFs(
  options: MergePDFsOptions,
): Promise<MergePDFsResponse> {
  try {
    const { files } = options;

    // Validate input
    if (!files || files.length === 0) {
      return {
        success: false,
        error: "No files provided for merging",
      };
    }

    if (files.length === 1) {
      return {
        success: false,
        error: "At least 2 files are required for merging",
      };
    }

    // Validate all files are PDFs
    for (const file of files) {
      if (file.type !== "application/pdf") {
        return {
          success: false,
          error: `Invalid file type: ${file.name}. Only PDF files are supported.`,
          details: `Expected 'application/pdf', got '${file.type}'`,
        };
      }
    }

    // Create a new PDF document for merging
    const mergedPdf = await PDFDocument.create();
    let totalPages = 0;

    // Process each PDF file
    for (const file of files) {
      try {
        // Read file as array buffer
        const fileBuffer = await file.arrayBuffer();

        // Load the PDF document
        const sourcePdf = await PDFDocument.load(fileBuffer);

        // Get all page indices
        const pageIndices = sourcePdf.getPageIndices();
        totalPages += pageIndices.length;

        // Copy all pages from source to merged document
        const copiedPages = await mergedPdf.copyPages(sourcePdf, pageIndices);

        // Add all copied pages to the merged document
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      } catch (fileError) {
        return {
          success: false,
          error: `Failed to process file: ${file.name}`,
          details:
            fileError instanceof Error ? fileError.message : String(fileError),
        };
      }
    }

    // Generate the final PDF bytes
    const pdfBytes = await mergedPdf.save();

    // Create blob for download
    const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

    return {
      success: true,
      pdfBlob,
      totalPages,
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to merge PDFs",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}
