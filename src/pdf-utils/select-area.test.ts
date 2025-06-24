import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { selectPDFArea } from "./select-area";

// Mock PDF.js
vi.mock("pdfjs-dist", () => ({
  getDocument: vi.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 3,
      getPage: vi.fn().mockImplementation((pageNum) => {
        if (pageNum > 3) {
          throw new Error("Page not found");
        }
        return Promise.resolve({
          getViewport: vi.fn().mockImplementation(({ scale = 1 }) => ({
            width: 800 * scale,
            height: 600 * scale,
          })),
          render: vi.fn().mockReturnValue({
            promise: Promise.resolve(),
          }),
        });
      }),
    }),
  }),
  GlobalWorkerOptions: {
    workerSrc: "",
  },
}));

// Mock canvas and context
const mockCanvas = {
  width: 800,
  height: 600,
  getContext: vi.fn().mockReturnValue({
    drawImage: vi.fn(),
    getImageData: vi.fn().mockImplementation((_x, _y, width, height) => ({
      data: new Uint8ClampedArray(width * height * 4), // RGBA = 4 bytes per pixel
      width,
      height,
    })),
    putImageData: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
  }),
  toBlob: vi.fn().mockImplementation((callback, type, _quality) => {
    const blob = new Blob(["mock image data"], { type });
    callback(blob);
  }),
};

const mockOutputCanvas = {
  width: 100,
  height: 100,
  getContext: vi.fn().mockReturnValue({
    putImageData: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn().mockImplementation((_x, _y, width, height) => ({
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height,
    })),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
  }),
  toBlob: vi.fn().mockImplementation((callback, type, _quality) => {
    const blob = new Blob(["mock selected area"], { type });
    callback(blob);
  }),
};

// Mock createElement
Object.defineProperty(document, "createElement", {
  value: vi.fn().mockImplementation((tagName) => {
    if (tagName === "canvas") {
      return mockCanvas;
    }
    return {};
  }),
  writable: true,
});

// Create a mock PDF file
const createMockPDFFile = (name = "test.pdf", size = 1024) => {
  const buffer = new ArrayBuffer(size);
  const file = new File([buffer], name, { type: "application/pdf" });
  return file;
};

const createMockNonPDFFile = (name = "test.txt", size = 1024) => {
  const buffer = new ArrayBuffer(size);
  const file = new File([buffer], name, { type: "text/plain" });
  return file;
};

describe("selectPDFArea", () => {
  let defaultCreateElement: any;
  
  beforeAll(() => {
    // Store the default createElement mock
    defaultCreateElement = vi.fn().mockImplementation((tagName) => {
      if (tagName === "canvas") {
        // Reset counter for each test
        const canvasCallCount = (defaultCreateElement._canvasCallCount || 0) + 1;
        defaultCreateElement._canvasCallCount = canvasCallCount;
        
        if (canvasCallCount === 1) {
          // Main canvas - dynamically adjust size based on scale
          return {
            ...mockCanvas,
            get width() { return this._width || 800; },
            set width(value) { this._width = value; },
            get height() { return this._height || 600; },
            set height(value) { this._height = value; },
          };
        } else {
          // Output canvas
          return mockOutputCanvas;
        }
      }
      return {};
    });
    
    document.createElement = defaultCreateElement;
  });
  
  beforeEach(() => {
    // Reset canvas call counter for each test
    if (defaultCreateElement) {
      defaultCreateElement._canvasCallCount = 0;
    }
  });
  
  afterEach(() => {
    // Reset to default mock after each test (in case a test overrode it)
    document.createElement = defaultCreateElement;
    if (defaultCreateElement) {
      defaultCreateElement._canvasCallCount = 0;
    }
  });

  describe("Input Validation", () => {
    it("should return error for no file", async () => {
      const result = await selectPDFArea({
        file: null as any,
        pageNumber: 1,
        selection: { x: 0, y: 0, width: 100, height: 100 },
        outputFormat: "jpeg",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("No file provided");
    });

    it("should return error for non-PDF file", async () => {
      const file = createMockNonPDFFile();
      const result = await selectPDFArea({
        file,
        pageNumber: 1,
        selection: { x: 0, y: 0, width: 100, height: 100 },
        outputFormat: "jpeg",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("File must be a PDF");
    });

    it("should return error for invalid page number", async () => {
      const file = createMockPDFFile();
      const result = await selectPDFArea({
        file,
        pageNumber: 0,
        selection: { x: 0, y: 0, width: 100, height: 100 },
        outputFormat: "jpeg",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Page number must be at least 1");
    });

    it("should return error for zero width selection", async () => {
      const file = createMockPDFFile();
      const result = await selectPDFArea({
        file,
        pageNumber: 1,
        selection: { x: 0, y: 0, width: 0, height: 100 },
        outputFormat: "jpeg",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Selection area must have positive dimensions");
    });

    it("should return error for zero height selection", async () => {
      const file = createMockPDFFile();
      const result = await selectPDFArea({
        file,
        pageNumber: 1,
        selection: { x: 0, y: 0, width: 100, height: 0 },
        outputFormat: "jpeg",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Selection area must have positive dimensions");
    });

    it("should return error for negative dimensions", async () => {
      const file = createMockPDFFile();
      const result = await selectPDFArea({
        file,
        pageNumber: 1,
        selection: { x: 0, y: 0, width: -10, height: 100 },
        outputFormat: "jpeg",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Selection area must have positive dimensions");
    });

    it("should return error for page number exceeding PDF pages", async () => {
      const file = createMockPDFFile();
      const result = await selectPDFArea({
        file,
        pageNumber: 5, // PDF has only 3 pages
        selection: { x: 0, y: 0, width: 100, height: 100 },
        outputFormat: "jpeg",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Page 5 not found. PDF has 3 pages.");
    });
  });

  describe("Selection Bounds Validation", () => {
    it("should return error for selection outside page bounds - negative x", async () => {
      const file = createMockPDFFile();
      const result = await selectPDFArea({
        file,
        pageNumber: 1,
        selection: { x: -10, y: 0, width: 100, height: 100 },
        outputFormat: "jpeg",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Selection area is outside page boundaries");
    });

    it("should return error for selection outside page bounds - negative y", async () => {
      const file = createMockPDFFile();
      const result = await selectPDFArea({
        file,
        pageNumber: 1,
        selection: { x: 0, y: -10, width: 100, height: 100 },
        outputFormat: "jpeg",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Selection area is outside page boundaries");
    });

    it("should return error for selection extending beyond page width", async () => {
      const file = createMockPDFFile();
      const result = await selectPDFArea({
        file,
        pageNumber: 1,
        selection: { x: 1550, y: 0, width: 100, height: 100 }, // x + width > 1600 (at scale 2)
        outputFormat: "jpeg",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Selection area is outside page boundaries");
    });

    it("should return error for selection extending beyond page height", async () => {
      const file = createMockPDFFile();
      const result = await selectPDFArea({
        file,
        pageNumber: 1,
        selection: { x: 0, y: 1150, width: 100, height: 100 }, // y + height > 1200 (at scale 2)
        outputFormat: "jpeg",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Selection area is outside page boundaries");
    });
  });

  describe("Successful Selection", () => {
    it("should successfully select area and return JPEG blob", async () => {
      const file = createMockPDFFile();
      const result = await selectPDFArea({
        file,
        pageNumber: 1,
        selection: { x: 100, y: 100, width: 200, height: 150 },
        outputFormat: "jpeg",
        quality: 0.8,
      });

      expect(result.success).toBe(true);
      expect(result.imageBlob).toBeDefined();
      expect(result.imageBlob?.type).toBe("image/jpeg");
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.originalWidth).toBe(1600); // 800 * scale(2)
      expect(result.metadata?.originalHeight).toBe(1200); // 600 * scale(2)
      expect(result.metadata?.selectedArea).toEqual({
        x: 100,
        y: 100,
        width: 200,
        height: 150,
      });
      expect(result.metadata?.outputFormat).toBe("jpeg");
      expect(result.metadata?.fileSize).toBeGreaterThan(0);
    });

    it("should successfully select area and return PNG blob", async () => {
      const file = createMockPDFFile();
      const result = await selectPDFArea({
        file,
        pageNumber: 2,
        selection: { x: 50, y: 50, width: 300, height: 200 },
        outputFormat: "png",
      });

      expect(result.success).toBe(true);
      expect(result.imageBlob).toBeDefined();
      expect(result.imageBlob?.type).toBe("image/png");
      expect(result.metadata?.outputFormat).toBe("png");
    });

    it("should use default quality for JPEG when not specified", async () => {
      const file = createMockPDFFile();
      const result = await selectPDFArea({
        file,
        pageNumber: 1,
        selection: { x: 0, y: 0, width: 100, height: 100 },
        outputFormat: "jpeg",
        // quality not specified, should default to 0.92
      });

      expect(result.success).toBe(true);
      expect(result.imageBlob).toBeDefined();
    });

    it("should use custom scale when specified", async () => {
      const file = createMockPDFFile();
      const result = await selectPDFArea({
        file,
        pageNumber: 1,
        selection: { x: 0, y: 0, width: 100, height: 100 },
        outputFormat: "png",
        scale: 3,
      });

      expect(result.success).toBe(true);
      expect(result.metadata?.originalWidth).toBe(2400); // 800 * scale(3)
      expect(result.metadata?.originalHeight).toBe(1800); // 600 * scale(3)
    });

    it("should handle edge case - maximum selection area", async () => {
      const file = createMockPDFFile();
      const result = await selectPDFArea({
        file,
        pageNumber: 1,
        selection: { x: 0, y: 0, width: 1600, height: 1200 }, // Full page at scale 2
        outputFormat: "jpeg",
        scale: 2,
      });

      expect(result.success).toBe(true);
      expect(result.metadata?.selectedArea.width).toBe(1600);
      expect(result.metadata?.selectedArea.height).toBe(1200);
    });

    it("should handle minimum selection area", async () => {
      const file = createMockPDFFile();
      const result = await selectPDFArea({
        file,
        pageNumber: 1,
        selection: { x: 0, y: 0, width: 1, height: 1 },
        outputFormat: "png",
      });

      expect(result.success).toBe(true);
      expect(result.metadata?.selectedArea.width).toBe(1);
      expect(result.metadata?.selectedArea.height).toBe(1);
    });
  });

  describe("Error Handling", () => {
    it("should handle canvas context creation failure", async () => {
      // Mock createElement to return canvas without context
      const mockFailingCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(null),
      };

      document.createElement = vi.fn().mockReturnValue(mockFailingCanvas);

      const file = createMockPDFFile();
      const result = await selectPDFArea({
        file,
        pageNumber: 1,
        selection: { x: 0, y: 0, width: 100, height: 100 },
        outputFormat: "jpeg",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to create canvas context");
    });

    it("should handle blob creation failure", async () => {
      // Mock toBlob to return null
      const mockFailingOutputCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue({
          putImageData: vi.fn(),
        }),
        toBlob: vi.fn().mockImplementation((callback) => {
          callback(null);
        }),
      };

      let canvasCallCount = 0;
      document.createElement = vi.fn().mockImplementation((tagName) => {
        if (tagName === "canvas") {
          canvasCallCount++;
          return canvasCallCount === 1 ? mockCanvas : mockFailingOutputCanvas;
        }
        return {};
      });

      const file = createMockPDFFile();
      const result = await selectPDFArea({
        file,
        pageNumber: 1,
        selection: { x: 0, y: 0, width: 100, height: 100 },
        outputFormat: "jpeg",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to create image blob");
    });

    it("should handle file reading errors", async () => {
      const file = createMockPDFFile();
      // Mock file.arrayBuffer to throw an error
      vi.spyOn(file, "arrayBuffer").mockRejectedValue(
        new Error("File read error"),
      );

      const result = await selectPDFArea({
        file,
        pageNumber: 1,
        selection: { x: 0, y: 0, width: 100, height: 100 },
        outputFormat: "jpeg",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("File read error");
    });
  });

  describe("Return Structure", () => {
    it("should return proper structure for successful operation", async () => {
      const file = createMockPDFFile();
      const result = await selectPDFArea({
        file,
        pageNumber: 1,
        selection: { x: 10, y: 20, width: 100, height: 80 },
        outputFormat: "jpeg",
        quality: 0.9,
      });

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("imageBlob");
      expect(result).toHaveProperty("metadata");
      expect(result.success).toBe(true);
      expect(result.imageBlob).toBeInstanceOf(Blob);
      expect(result.metadata).toEqual({
        originalWidth: 1600,
        originalHeight: 1200,
        selectedArea: { x: 10, y: 20, width: 100, height: 80 },
        outputFormat: "jpeg",
        fileSize: expect.any(Number),
      });
    });

    it("should return proper structure for failed operation", async () => {
      const file = createMockNonPDFFile();
      const result = await selectPDFArea({
        file,
        pageNumber: 1,
        selection: { x: 0, y: 0, width: 100, height: 100 },
        outputFormat: "jpeg",
      });

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("error");
      expect(result.success).toBe(false);
      expect(result.error).toBe("File must be a PDF");
      expect(result.imageBlob).toBeUndefined();
      expect(result.metadata).toBeUndefined();
    });
  });
});
