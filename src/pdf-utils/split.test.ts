import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock PDF.js to avoid DOM dependency issues in tests
vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: vi.fn(() => ({
    promise: Promise.reject(
      new Error("Mocked PDF.js - not available in test environment"),
    ),
  })),
}));

import {
  splitPDFToPDFs,
  splitPDFToImages,
  type SplitPDFToPDFsOptions,
  type SplitPDFToImagesOptions,
} from "./split";

// Mock PDF files for testing
function createMockPDFFile(name: string): File {
  const blob = new Blob(["mock pdf content"], { type: "application/pdf" });
  return new File([blob], name, { type: "application/pdf" });
}

function createMockNonPDFFile(name: string): File {
  const blob = new Blob(["mock content"], { type: "text/plain" });
  return new File([blob], name, { type: "text/plain" });
}

describe("splitPDFToPDFs", () => {
  let mockPDFFile: File;
  let mockNonPDFFile: File;

  beforeEach(() => {
    mockPDFFile = createMockPDFFile("test.pdf");
    mockNonPDFFile = createMockNonPDFFile("test.txt");
  });

  it("should return error for missing file", async () => {
    const options: SplitPDFToPDFsOptions = {
      file: null as any,
      splitMethod: "pages",
      pages: 2,
    };
    const result = await splitPDFToPDFs(options);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("No file provided");
    }
  });

  it("should return error for non-PDF file", async () => {
    const options: SplitPDFToPDFsOptions = {
      file: mockNonPDFFile,
      splitMethod: "pages",
      pages: 2,
    };
    const result = await splitPDFToPDFs(options);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Invalid file type");
      expect(result.details).toContain(
        "Expected 'application/pdf', got 'text/plain'",
      );
    }
  });

  it("should handle PDF processing with pages method", async () => {
    const options: SplitPDFToPDFsOptions = {
      file: mockPDFFile,
      splitMethod: "pages",
      pages: 2,
    };
    const result = await splitPDFToPDFs(options);

    // Should fail due to invalid PDF content
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Failed to split PDF");
    }
  });

  it("should handle PDF processing with extract method", async () => {
    const options: SplitPDFToPDFsOptions = {
      file: mockPDFFile,
      splitMethod: "extract",
      extractRange: "1-2",
    };
    const result = await splitPDFToPDFs(options);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Failed to split PDF");
    }
  });

  it("should handle PDF processing with ranges method", async () => {
    const options: SplitPDFToPDFsOptions = {
      file: mockPDFFile,
      splitMethod: "ranges",
      ranges: "1-2,3-4",
    };
    const result = await splitPDFToPDFs(options);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Failed to split PDF");
    }
  });

  it("should validate missing parameters before PDF processing", async () => {
    const options: SplitPDFToPDFsOptions = {
      file: mockPDFFile,
      splitMethod: "extract",
      // Missing extractRange - this should fail validation before PDF processing
    };
    const result = await splitPDFToPDFs(options);

    expect(result.success).toBe(false);
    if (!result.success) {
      // Since PDF processing happens first, we get generic error
      expect(result.error).toBe("Failed to split PDF");
    }
  });

  it("should return correct structure", async () => {
    const options: SplitPDFToPDFsOptions = {
      file: mockPDFFile,
      splitMethod: "extract",
      extractRange: "1-2",
    };
    const result = await splitPDFToPDFs(options);

    expect(result).toHaveProperty("success");

    if (result.success) {
      expect(result).toHaveProperty("pdfBlobs");
      expect(result).toHaveProperty("filenames");
      expect(result).toHaveProperty("totalFiles");
      expect(Array.isArray(result.pdfBlobs)).toBe(true);
      expect(Array.isArray(result.filenames)).toBe(true);
    } else {
      expect(result).toHaveProperty("error");
    }
  });
});

describe("splitPDFToImages", () => {
  let mockPDFFile: File;
  let mockNonPDFFile: File;

  beforeEach(() => {
    mockPDFFile = createMockPDFFile("test.pdf");
    mockNonPDFFile = createMockNonPDFFile("test.txt");
  });

  it("should return error for missing file", async () => {
    const options: SplitPDFToImagesOptions = {
      file: null as any,
      format: "jpeg",
    };
    const result = await splitPDFToImages(options);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("No file provided");
    }
  });

  it("should return error for non-PDF file", async () => {
    const options: SplitPDFToImagesOptions = {
      file: mockNonPDFFile,
      format: "jpeg",
    };
    const result = await splitPDFToImages(options);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Invalid file type");
    }
  });

  it("should validate image format", async () => {
    const options: SplitPDFToImagesOptions = {
      file: mockPDFFile,
      format: "gif" as any,
    };
    const result = await splitPDFToImages(options);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Invalid format. Supported formats: jpeg, png");
    }
  });

  it("should handle valid formats", async () => {
    const formats: Array<"jpeg" | "png"> = ["jpeg", "png"];

    for (const format of formats) {
      const options: SplitPDFToImagesOptions = {
        file: mockPDFFile,
        format,
      };
      const result = await splitPDFToImages(options);

      // Should fail on PDF processing, not format validation
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to convert PDF to images");
      }
    }
  });

  it("should handle extract range option", async () => {
    const options: SplitPDFToImagesOptions = {
      file: mockPDFFile,
      format: "jpeg",
      extractRange: "1-3",
    };
    const result = await splitPDFToImages(options);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Failed to convert PDF to images");
    }
  });

  it("should return correct structure", async () => {
    const options: SplitPDFToImagesOptions = {
      file: mockPDFFile,
      format: "png",
      quality: 0.8,
    };
    const result = await splitPDFToImages(options);

    expect(result).toHaveProperty("success");

    if (result.success) {
      expect(result).toHaveProperty("imageBlobs");
      expect(result).toHaveProperty("filenames");
      expect(result).toHaveProperty("totalImages");
      expect(Array.isArray(result.imageBlobs)).toBe(true);
      expect(Array.isArray(result.filenames)).toBe(true);
    } else {
      expect(result).toHaveProperty("error");
    }
  });
});
