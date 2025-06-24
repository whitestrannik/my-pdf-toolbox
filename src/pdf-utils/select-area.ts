import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker for offline use
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export interface SelectAreaOptions {
  file: File;
  pageNumber: number; // 1-based page number
  selection: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  outputFormat: "jpeg" | "png";
  quality?: number; // 0.1 to 1.0 for JPEG
  scale?: number; // Rendering scale (default: 2 for high quality)
}

export interface SelectAreaResult {
  success: boolean;
  imageBlob?: Blob;
  error?: string;
  metadata?: {
    originalWidth: number;
    originalHeight: number;
    selectedArea: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    outputFormat: "jpeg" | "png";
    fileSize: number;
  };
}

export const selectPDFArea = async (
  options: SelectAreaOptions,
): Promise<SelectAreaResult> => {
  try {
    const { file, pageNumber, selection, outputFormat, quality = 0.92, scale = 2 } = options;

    // Validate inputs
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    if (file.type !== "application/pdf") {
      return { success: false, error: "File must be a PDF" };
    }

    if (pageNumber < 1) {
      return { success: false, error: "Page number must be at least 1" };
    }

    if (selection.width <= 0 || selection.height <= 0) {
      return { success: false, error: "Selection area must have positive dimensions" };
    }

    // Load PDF
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    if (pageNumber > pdf.numPages) {
      return {
        success: false,
        error: `Page ${pageNumber} not found. PDF has ${pdf.numPages} pages.`,
      };
    }

    // Get the specified page
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    // Create canvas for rendering
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      return { success: false, error: "Failed to create canvas context" };
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Render page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // Validate selection bounds
    const maxX = viewport.width - selection.width;
    const maxY = viewport.height - selection.height;

    if (selection.x < 0 || selection.y < 0 || selection.x > maxX || selection.y > maxY) {
      return {
        success: false,
        error: "Selection area is outside page boundaries",
      };
    }

    // Extract selected area
    const selectedImageData = context.getImageData(
      selection.x,
      selection.y,
      selection.width,
      selection.height,
    );

    // Create new canvas with selected area
    const outputCanvas = document.createElement("canvas");
    const outputContext = outputCanvas.getContext("2d");
    if (!outputContext) {
      return { success: false, error: "Failed to create output canvas context" };
    }

    outputCanvas.width = selection.width;
    outputCanvas.height = selection.height;
    outputContext.putImageData(selectedImageData, 0, 0);

    // Convert to blob
    const mimeType = outputFormat === "jpeg" ? "image/jpeg" : "image/png";
    const imageBlob = await new Promise<Blob | null>((resolve) => {
      outputCanvas.toBlob(resolve, mimeType, quality);
    });

    if (!imageBlob) {
      return { success: false, error: "Failed to create image blob" };
    }

    return {
      success: true,
      imageBlob,
      metadata: {
        originalWidth: viewport.width,
        originalHeight: viewport.height,
        selectedArea: selection,
        outputFormat,
        fileSize: imageBlob.size,
      },
    };
  } catch (error) {
    console.error("PDF area selection failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}; 