import { describe, it, expect, beforeEach } from "vitest";
import { convertImagesToPDF, type ConvertImagesToPDFOptions } from "./convert";

// Mock image files for testing
function createMockImageFile(name: string, type: string): File {
  const blob = new Blob(["mock image content"], { type });
  return new File([blob], name, { type });
}

function createMockNonImageFile(name: string): File {
  const blob = new Blob(["mock content"], { type: "text/plain" });
  return new File([blob], name, { type: "text/plain" });
}

describe("convertImagesToPDF", () => {
  let mockJPEGFile: File;
  let mockPNGFile: File;
  let mockNonImageFile: File;

  beforeEach(() => {
    mockJPEGFile = createMockImageFile("test.jpg", "image/jpeg");
    mockPNGFile = createMockImageFile("test.png", "image/png");
    mockNonImageFile = createMockNonImageFile("test.txt");
  });

  it("should return error for empty images array", async () => {
    const options: ConvertImagesToPDFOptions = { images: [] };
    const result = await convertImagesToPDF(options);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("No images provided for conversion");
    }
  });

  it("should return error for unsupported image types", async () => {
    const options: ConvertImagesToPDFOptions = { images: [mockNonImageFile] };
    const result = await convertImagesToPDF(options);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Unsupported image type");
      expect(result.error).toContain("test.txt");
      expect(result.details).toContain("image/jpeg, image/jpg, image/png");
    }
  });

  it("should validate supported image formats", async () => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];

    for (const type of validTypes) {
      const imageFile = createMockImageFile(`test.${type.split("/")[1]}`, type);
      const options: ConvertImagesToPDFOptions = { images: [imageFile] };

      // This will fail due to invalid image content, but should pass validation
      const result = await convertImagesToPDF(options);

      expect(result.success).toBe(false);
      if (!result.success) {
        // Should fail on image processing, not type validation
        expect(result.error.includes("Unsupported image type")).toBe(false);
      }
    }
  });

  it("should handle single image file", async () => {
    const options: ConvertImagesToPDFOptions = { images: [mockJPEGFile] };
    const result = await convertImagesToPDF(options);

    // Will fail due to invalid image content, but structure should be correct
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Failed to process image");
    }
  });

  it("should handle multiple image files", async () => {
    const options: ConvertImagesToPDFOptions = {
      images: [mockJPEGFile, mockPNGFile],
    };
    const result = await convertImagesToPDF(options);

    // Will fail due to invalid image content, but should attempt to process both
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Failed to process image");
    }
  });

  it("should return correct structure for result", async () => {
    const options: ConvertImagesToPDFOptions = { images: [mockJPEGFile] };
    const result = await convertImagesToPDF(options);

    expect(result).toHaveProperty("success");

    if (result.success) {
      expect(result).toHaveProperty("pdfBlob");
      expect(result).toHaveProperty("totalPages");
      expect(result.pdfBlob).toBeInstanceOf(Blob);
      expect(typeof result.totalPages).toBe("number");
    } else {
      expect(result).toHaveProperty("error");
      expect(typeof result.error).toBe("string");
    }
  });

  it("should handle mixed valid and invalid file types", async () => {
    const webpFile = createMockImageFile("test.webp", "image/webp");
    const options: ConvertImagesToPDFOptions = {
      images: [mockJPEGFile, webpFile],
    };
    const result = await convertImagesToPDF(options);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Unsupported image type");
      expect(result.error).toContain("test.webp");
    }
  });

  it("should validate image file extensions match types", async () => {
    // Test case sensitivity
    const jpgFile = createMockImageFile("test.JPG", "image/jpeg");
    const options: ConvertImagesToPDFOptions = { images: [jpgFile] };
    const result = await convertImagesToPDF(options);

    // Should not fail on type validation (case insensitive)
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.includes("Unsupported image type")).toBe(false);
    }
  });
});
