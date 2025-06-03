// import testing library common matchers
import "@testing-library/jest-dom";
import { expect, afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

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

// Mock DOMMatrix for pdfjs-dist
global.DOMMatrix = class DOMMatrix {
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
});
