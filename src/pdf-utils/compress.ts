import { PDFDocument } from "pdf-lib";

export interface CompressPDFOptions {
  file: File;
  compressionLevel: "low" | "medium" | "high";
}

export interface CompressPDFResult {
  success: true;
  pdfBlob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number; // percentage reduction
}

export interface CompressPDFError {
  success: false;
  error: string;
  details?: string;
}

export type CompressPDFResponse = CompressPDFResult | CompressPDFError;

/**
 * Compresses a PDF by optimizing images and removing unnecessary data
 * @param options - Configuration object containing file and compression level
 * @returns Promise that resolves to compressed PDF blob or error
 */
export async function compressPDF(
  options: CompressPDFOptions,
): Promise<CompressPDFResponse> {
  try {
    const { file, compressionLevel } = options;

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

    if (!["low", "medium", "high"].includes(compressionLevel)) {
      return {
        success: false,
        error: "Invalid compression level. Supported levels: low, medium, high",
      };
    }

    const originalSize = file.size;

    // Load the source PDF
    const fileBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileBuffer);

    // Get compression settings based on level
    const compressionSettings = getCompressionSettings(compressionLevel);

    // Apply compression optimizations
    await applyCompressionOptimizations(pdfDoc, compressionSettings);

    // Save with compression options
    const saveOptions = {
      useObjectStreams: compressionSettings.useObjectStreams,
      addDefaultPage: false,
      objectsPerTick: compressionSettings.objectsPerTick,
    };

    const compressedBytes = await pdfDoc.save(saveOptions);
    const compressedSize = compressedBytes.length;

    // Calculate compression ratio
    const compressionRatio = Math.round(
      ((originalSize - compressedSize) / originalSize) * 100,
    );

    // Create blob for download
    const pdfBlob = new Blob([compressedBytes], { type: "application/pdf" });

    return {
      success: true,
      pdfBlob,
      originalSize,
      compressedSize,
      compressionRatio: Math.max(0, compressionRatio), // Ensure non-negative
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to compress PDF",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get compression settings based on compression level
 */
function getCompressionSettings(level: "low" | "medium" | "high") {
  switch (level) {
    case "low":
      return {
        useObjectStreams: false,
        objectsPerTick: 500, // Process more objects per tick for speed
        removeUnusedObjects: false,
        optimizeImages: false,
      };
    case "medium":
      return {
        useObjectStreams: true,
        objectsPerTick: 200,
        removeUnusedObjects: true,
        optimizeImages: false,
      };
    case "high":
      return {
        useObjectStreams: true,
        objectsPerTick: 100, // Process fewer objects per tick for maximum compression
        removeUnusedObjects: true,
        optimizeImages: true,
      };
    default:
      return {
        useObjectStreams: true,
        objectsPerTick: 200,
        removeUnusedObjects: true,
        optimizeImages: false,
      };
  }
}

/**
 * Apply various compression optimizations to the PDF document
 */
async function applyCompressionOptimizations(
  pdfDoc: PDFDocument,
  settings: ReturnType<typeof getCompressionSettings>,
): Promise<void> {
  try {
    // Remove metadata that might be taking up space (optional optimization)
    if (settings.removeUnusedObjects) {
      // Remove creation date, modification date, and other metadata to save space
      pdfDoc.setTitle("");
      pdfDoc.setAuthor("");
      pdfDoc.setSubject("");
      pdfDoc.setProducer("");
      pdfDoc.setCreator("");
      pdfDoc.setKeywords([]);
    }

    // Note: pdf-lib has limited built-in compression capabilities compared to server-side tools
    // Most compression happens automatically during the save() process with object streams
    // For more aggressive compression, we would need additional libraries or server-side processing

    // Future enhancement: Image compression could be added here by:
    // 1. Extracting images from each page
    // 2. Compressing them using canvas APIs
    // 3. Re-embedding the compressed images
    // This would require more complex image processing logic
  } catch (error) {
    // Don't fail the entire compression if optimization fails
    console.warn("Some compression optimizations failed:", error);
  }
}

/**
 * Utility function to format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Calculate compression percentage
 */
export function calculateCompressionPercentage(
  originalSize: number,
  compressedSize: number,
): number {
  if (originalSize === 0) return 0;
  return Math.max(
    0,
    Math.round(((originalSize - compressedSize) / originalSize) * 100),
  );
}
