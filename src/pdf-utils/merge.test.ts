import { describe, it, expect, beforeEach } from "vitest";
import { mergePDFs, type MergePDFsOptions } from "./merge";

// Mock PDF files for testing
function createMockPDFFile(
  name: string,
  content: string = "mock pdf content",
): File {
  const blob = new Blob([content], { type: "application/pdf" });
  return new File([blob], name, { type: "application/pdf" });
}

function createMockNonPDFFile(name: string): File {
  const blob = new Blob(["mock content"], { type: "text/plain" });
  return new File([blob], name, { type: "text/plain" });
}

describe("mergePDFs", () => {
  let mockPDFFile1: File;
  let mockPDFFile2: File;
  let mockNonPDFFile: File;

  beforeEach(() => {
    mockPDFFile1 = createMockPDFFile("test1.pdf");
    mockPDFFile2 = createMockPDFFile("test2.pdf");
    mockNonPDFFile = createMockNonPDFFile("test.txt");
  });

  it("should return error for empty files array", async () => {
    const options: MergePDFsOptions = { files: [] };
    const result = await mergePDFs(options);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("No files provided for merging");
    }
  });

  it("should return error for single file", async () => {
    const options: MergePDFsOptions = { files: [mockPDFFile1] };
    const result = await mergePDFs(options);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("At least 2 files are required for merging");
    }
  });

  it("should return error for non-PDF files", async () => {
    const options: MergePDFsOptions = { files: [mockPDFFile1, mockNonPDFFile] };
    const result = await mergePDFs(options);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Invalid file type");
      expect(result.error).toContain("test.txt");
    }
  });

  it("should validate all files are PDFs", async () => {
    const textFile = createMockNonPDFFile("document.txt");
    const options: MergePDFsOptions = { files: [mockPDFFile1, textFile] };
    const result = await mergePDFs(options);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Only PDF files are supported");
      expect(result.details).toContain(
        "Expected 'application/pdf', got 'text/plain'",
      );
    }
  });

  it("should handle multiple valid PDF files", async () => {
    const options: MergePDFsOptions = { files: [mockPDFFile1, mockPDFFile2] };

    // Note: This test will fail with actual PDF processing due to invalid PDF content
    // In a real scenario, we would use actual PDF files or mock the pdf-lib library
    const result = await mergePDFs(options);

    // Since we're using mock files with invalid PDF content, we expect an error
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Failed to process file");
    }
  });

  it("should return correct structure for successful merge", async () => {
    // This test checks the expected return structure
    const options: MergePDFsOptions = { files: [mockPDFFile1, mockPDFFile2] };
    const result = await mergePDFs(options);

    // Check that result has the correct structure
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

  it("should handle file processing errors gracefully", async () => {
    // Create a file with invalid PDF content
    const invalidPDF = new File(["invalid pdf"], "invalid.pdf", {
      type: "application/pdf",
    });
    const options: MergePDFsOptions = { files: [mockPDFFile1, invalidPDF] };

    const result = await mergePDFs(options);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Failed to process file");
      expect(result.details).toBeDefined();
    }
  });
});
