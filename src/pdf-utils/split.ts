import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

export interface SplitPDFToPDFsOptions {
  file: File;
  splitMethod: "pages" | "ranges" | "extract";
  pages?: number; // For 'pages' method: split every N pages
  ranges?: string; // For 'ranges' method: e.g., "1-3,4-6,7-10"
  extractRange?: string; // For 'extract' method: e.g., "2-4" or "5"
}

export interface SplitPDFToImagesOptions {
  file: File;
  format: "jpeg" | "png";
  quality?: number; // 0.1 to 1.0 for JPEG
  extractRange?: string; // Optional: extract specific pages e.g., "2-4" or "5"
}

export interface SplitPDFToPDFsResult {
  success: true;
  pdfBlobs: Blob[];
  filenames: string[];
  totalFiles: number;
}

export interface SplitPDFToImagesResult {
  success: true;
  imageBlobs: Blob[];
  filenames: string[];
  totalImages: number;
}

export interface SplitPDFError {
  success: false;
  error: string;
  details?: string;
}

export type SplitPDFToPDFsResponse = SplitPDFToPDFsResult | SplitPDFError;
export type SplitPDFToImagesResponse = SplitPDFToImagesResult | SplitPDFError;

/**
 * Parses a range string (e.g., "1-3,5,7-9") into an array of page numbers
 */
function parsePageRanges(rangeString: string, totalPages: number): number[] {
  const pages: number[] = [];
  const ranges = rangeString.split(",").map((s) => s.trim());

  for (const range of ranges) {
    if (range.includes("-")) {
      const [startStr, endStr] = range.split("-").map((s) => s.trim());
      const start = parseInt(startStr);
      const end = parseInt(endStr);

      if (
        isNaN(start) ||
        isNaN(end) ||
        start < 1 ||
        end > totalPages ||
        start > end
      ) {
        throw new Error(
          `Invalid range: ${range}. Pages must be between 1 and ${totalPages}`,
        );
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    } else {
      const pageNum = parseInt(range);
      if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
        throw new Error(
          `Invalid page number: ${range}. Pages must be between 1 and ${totalPages}`,
        );
      }
      pages.push(pageNum);
    }
  }

  return [...new Set(pages)].sort((a, b) => a - b); // Remove duplicates and sort
}

/**
 * Splits a PDF into multiple PDF files
 */
export async function splitPDFToPDFs(
  options: SplitPDFToPDFsOptions,
): Promise<SplitPDFToPDFsResponse> {
  try {
    const { file, splitMethod, pages, ranges, extractRange } = options;

    // Validate input
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    if (file.type !== "application/pdf") {
      return {
        success: false,
        error: "Invalid file type. Only PDF files are supported.",
        details: `Expected 'application/pdf', got '${file.type}'`,
      };
    }

    // Load the source PDF
    const fileBuffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(fileBuffer);
    const totalPages = sourcePdf.getPageCount();

    if (totalPages === 0) {
      return { success: false, error: "PDF file has no pages" };
    }

    const pdfBlobs: Blob[] = [];
    const filenames: string[] = [];
    const baseName = file.name.replace(/\.pdf$/i, "");

    if (splitMethod === "extract" && extractRange) {
      // Extract specific pages into a single PDF
      const pageNumbers = parsePageRanges(extractRange, totalPages);
      const pageIndices = pageNumbers.map((p) => p - 1); // Convert to 0-based indices

      const extractedPdf = await PDFDocument.create();
      const copiedPages = await extractedPdf.copyPages(sourcePdf, pageIndices);
      copiedPages.forEach((page) => extractedPdf.addPage(page));

      const pdfBytes = await extractedPdf.save();
      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

      pdfBlobs.push(pdfBlob);
      filenames.push(`${baseName}_pages_${extractRange}.pdf`);
    } else if (splitMethod === "pages" && pages) {
      // Split every N pages
      if (pages <= 0) {
        return {
          success: false,
          error: "Pages per split must be greater than 0",
        };
      }

      for (let startPage = 0; startPage < totalPages; startPage += pages) {
        const endPage = Math.min(startPage + pages - 1, totalPages - 1);
        const pageIndices = Array.from(
          { length: endPage - startPage + 1 },
          (_, i) => startPage + i,
        );

        const splitPdf = await PDFDocument.create();
        const copiedPages = await splitPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach((page) => splitPdf.addPage(page));

        const pdfBytes = await splitPdf.save();
        const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

        pdfBlobs.push(pdfBlob);
        filenames.push(
          `${baseName}_part_${Math.floor(startPage / pages) + 1}.pdf`,
        );
      }
    } else if (splitMethod === "ranges" && ranges) {
      // Split by custom ranges
      const rangeList = ranges.split(",").map((s) => s.trim());

      for (let i = 0; i < rangeList.length; i++) {
        const range = rangeList[i];
        const pageNumbers = parsePageRanges(range, totalPages);
        const pageIndices = pageNumbers.map((p) => p - 1); // Convert to 0-based indices

        const splitPdf = await PDFDocument.create();
        const copiedPages = await splitPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach((page) => splitPdf.addPage(page));

        const pdfBytes = await splitPdf.save();
        const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

        pdfBlobs.push(pdfBlob);
        filenames.push(
          `${baseName}_pages_${range.replace(/[^\d-]/g, "_")}.pdf`,
        );
      }
    } else {
      return {
        success: false,
        error: "Invalid split method or missing required parameters",
      };
    }

    return {
      success: true,
      pdfBlobs,
      filenames,
      totalFiles: pdfBlobs.length,
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to split PDF",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Converts PDF pages to image files
 */
export async function splitPDFToImages(
  options: SplitPDFToImagesOptions,
): Promise<SplitPDFToImagesResponse> {
  try {
    const { file, format, quality = 0.9, extractRange } = options;

    // Validate input
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    if (file.type !== "application/pdf") {
      return {
        success: false,
        error: "Invalid file type. Only PDF files are supported.",
        details: `Expected 'application/pdf', got '${file.type}'`,
      };
    }

    if (format !== "jpeg" && format !== "png") {
      return {
        success: false,
        error: "Invalid format. Supported formats: jpeg, png",
      };
    }

    // Load PDF with PDF.js
    const fileBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: fileBuffer });
    const pdfDocument = await loadingTask.promise;

    const totalPages = pdfDocument.numPages;
    if (totalPages === 0) {
      return { success: false, error: "PDF file has no pages" };
    }

    // Determine which pages to extract
    let pageNumbers: number[];
    if (extractRange) {
      pageNumbers = parsePageRanges(extractRange, totalPages);
    } else {
      pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const imageBlobs: Blob[] = [];
    const filenames: string[] = [];
    const baseName = file.name.replace(/\.pdf$/i, "");

    // Convert each page to image
    for (const pageNum of pageNumbers) {
      try {
        const page = await pdfDocument.getPage(pageNum);

        // Set up rendering options
        const scale = 2.0; // Higher scale for better quality
        const viewport = page.getViewport({ scale });

        // Create canvas
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Failed to get canvas context");
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Failed to create image blob"));
              }
            },
            mimeType,
            format === "jpeg" ? quality : undefined,
          );
        });

        imageBlobs.push(blob);
        filenames.push(`${baseName}_page_${pageNum}.${format}`);
      } catch (pageError) {
        return {
          success: false,
          error: `Failed to convert page ${pageNum}`,
          details:
            pageError instanceof Error ? pageError.message : String(pageError),
        };
      }
    }

    return {
      success: true,
      imageBlobs,
      filenames,
      totalImages: imageBlobs.length,
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to convert PDF to images",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}
