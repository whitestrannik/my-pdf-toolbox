// import testing library common matchers
import "@testing-library/jest-dom";
import { expect, afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// Mock File.prototype.arrayBuffer globally
global.File.prototype.arrayBuffer = vi.fn().mockImplementation(function (
  this: File,
) {
  return Promise.resolve(new ArrayBuffer(this.size || 1024));
});

// Mock canvas and 2D context globally
const mockCanvas = {
  width: 800,
  height: 600,
  getContext: vi.fn().mockReturnValue({
    drawImage: vi.fn(),
    getImageData: vi.fn().mockReturnValue({
      data: new Uint8ClampedArray(4),
      width: 100,
      height: 100,
    }),
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
  toBlob: vi.fn().mockImplementation((callback, type) => {
    const blob = new Blob(["mock image data"], { type: type || "image/png" });
    callback(blob);
  }),
  toDataURL: vi.fn().mockReturnValue("data:image/png;base64,mock"),
  getBoundingClientRect: vi.fn().mockReturnValue({
    top: 0,
    left: 0,
    width: 800,
    height: 600,
    right: 800,
    bottom: 600,
  }),
};

// Mock document.createElement for canvas
const originalCreateElement = document.createElement;
document.createElement = vi.fn().mockImplementation((tagName: string) => {
  if (tagName === "canvas") {
    return mockCanvas;
  }
  return originalCreateElement.call(document, tagName);
});

// Mock HTMLCanvasElement globally
global.HTMLCanvasElement = class HTMLCanvasElement extends Element {
  width = 800;
  height = 600;
  getContext = mockCanvas.getContext;
  toBlob = mockCanvas.toBlob;
  toDataURL = mockCanvas.toDataURL;
  getBoundingClientRect = mockCanvas.getBoundingClientRect;
} as any;

// Mock browser APIs globally for all tests
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock localStorage globally
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  length: 0,
  key: () => null,
};
Object.defineProperty(window, "localStorage", {
  writable: true,
  value: localStorageMock,
});

// Mock clipboard API
Object.defineProperty(navigator, "clipboard", {
  writable: true,
  value: {
    write: vi.fn().mockResolvedValue(undefined),
    writeText: vi.fn().mockResolvedValue(undefined),
    read: vi.fn().mockResolvedValue([]),
    readText: vi.fn().mockResolvedValue(""),
  },
});

// Mock window.isSecureContext
Object.defineProperty(window, "isSecureContext", {
  writable: true,
  value: true,
});

// Mock ClipboardItem
global.ClipboardItem = class ClipboardItem {
  constructor(data: Record<string, Blob>) {
    Object.assign(this, data);
  }
} as any;

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue("mock-url");
global.URL.revokeObjectURL = vi.fn();

// Mock DOMMatrix for pdfjs-dist
(global as any).DOMMatrix = class DOMMatrix {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;
  m11 = 1;
  m12 = 0;
  m13 = 0;
  m14 = 0;
  m21 = 0;
  m22 = 1;
  m23 = 0;
  m24 = 0;
  m31 = 0;
  m32 = 0;
  m33 = 1;
  m34 = 0;
  m41 = 0;
  m42 = 0;
  m43 = 0;
  m44 = 1;
  is2D = true;
  isIdentity = true;

  constructor() {
    // Mock implementation
  }

  static fromMatrix() {
    return new DOMMatrix();
  }

  static fromFloat32Array() {
    return new DOMMatrix();
  }

  static fromFloat64Array() {
    return new DOMMatrix();
  }

  multiply() {
    return new DOMMatrix();
  }

  translate() {
    return new DOMMatrix();
  }

  scale() {
    return new DOMMatrix();
  }

  inverse() {
    return new DOMMatrix();
  }

  flipX() {
    return new DOMMatrix();
  }

  flipY() {
    return new DOMMatrix();
  }

  rotate() {
    return new DOMMatrix();
  }

  rotateAxisAngle() {
    return new DOMMatrix();
  }

  rotateFromVector() {
    return new DOMMatrix();
  }

  scaleNonUniform() {
    return new DOMMatrix();
  }

  scale3d() {
    return new DOMMatrix();
  }

  skewX() {
    return new DOMMatrix();
  }

  skewY() {
    return new DOMMatrix();
  }

  translate3d() {
    return new DOMMatrix();
  }

  transformPoint() {
    return { x: 0, y: 0, z: 0, w: 1 };
  }

  toFloat32Array() {
    return new Float32Array(16);
  }

  toFloat64Array() {
    return new Float64Array(16);
  }

  toString() {
    return "matrix(1, 0, 0, 1, 0, 0)";
  }

  toJSON() {
    return {};
  }
};

// Global cleanup after each test to prevent DOM accumulation
afterEach(() => {
  cleanup();
  // Clear any additional DOM state
  document.body.innerHTML = "";
  // Remove any classes added to document element
  document.documentElement.className = "";
});

// Ensure clean environment before each test
beforeEach(() => {
  // Reset DOM to clean state
  document.body.innerHTML = '<div id="root"></div>';

  // Reset all mocks
  vi.clearAllMocks();
});
