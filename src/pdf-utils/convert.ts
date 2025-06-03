import { PDFDocument } from "pdf-lib";

export interface ConvertImagesToPDFOptions {
  images: File[];
}

export interface ConvertImagesToPDFResult {
  success: true;
  pdfBlob: Blob;
  totalPages: number;
}

export interface ConvertImagesToPDFError {
  success: false;
  error: string;
  details?: string;
}

export type ConvertImagesToPDFResponse =
  | ConvertImagesToPDFResult
  | ConvertImagesToPDFError;

// Supported image formats
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

/**
 * Converts multiple image files into a single PDF document
 * Each image becomes one page in the PDF
 * @param options - Configuration object containing images to convert
 * @returns Promise that resolves to PDF blob or error
 */
export async function convertImagesToPDF(
  options: ConvertImagesToPDFOptions,
): Promise<ConvertImagesToPDFResponse> {
  try {
    const { images } = options;

    // Validate input
    if (!images || images.length === 0) {
      return {
        success: false,
        error: "No images provided for conversion",
      };
    }

    // Validate all files are supported images
    for (const image of images) {
      if (!SUPPORTED_IMAGE_TYPES.includes(image.type.toLowerCase())) {
        return {
          success: false,
          error: `Unsupported image type: ${image.name}`,
          details: `Supported formats: ${SUPPORTED_IMAGE_TYPES.join(", ")}`,
        };
      }
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Process each image
    for (const imageFile of images) {
      try {
        // Read image as array buffer
        const imageBuffer = await imageFile.arrayBuffer();

        let image;
        const imageType = imageFile.type.toLowerCase();

        // Embed image based on type
        if (imageType === "image/png") {
          image = await pdfDoc.embedPng(imageBuffer);
        } else if (imageType === "image/jpeg" || imageType === "image/jpg") {
          image = await pdfDoc.embedJpg(imageBuffer);
        } else {
          throw new Error(`Unsupported image type: ${imageType}`);
        }

        // Get image dimensions
        const { width: imageWidth, height: imageHeight } = image.scale(1);

        // Create a new page with the image dimensions
        // Scale to fit within reasonable page size limits (max 8.5x11 inches at 72 DPI)
        const maxWidth = 612; // 8.5 inches * 72 DPI
        const maxHeight = 792; // 11 inches * 72 DPI

        let pageWidth = imageWidth;
        let pageHeight = imageHeight;

        // Scale down if image is too large
        if (imageWidth > maxWidth || imageHeight > maxHeight) {
          const widthRatio = maxWidth / imageWidth;
          const heightRatio = maxHeight / imageHeight;
          const scaleRatio = Math.min(widthRatio, heightRatio);

          pageWidth = imageWidth * scaleRatio;
          pageHeight = imageHeight * scaleRatio;
        }

        // Add a new page
        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Draw the image to fill the entire page
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        });
      } catch (imageError) {
        return {
          success: false,
          error: `Failed to process image: ${imageFile.name}`,
          details:
            imageError instanceof Error
              ? imageError.message
              : String(imageError),
        };
      }
    }

    // Generate the final PDF bytes
    const pdfBytes = await pdfDoc.save();

    // Create blob for download
    const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

    return {
      success: true,
      pdfBlob,
      totalPages: images.length,
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to convert images to PDF",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}
