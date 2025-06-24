import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ThemeProvider, useTheme } from "./ThemeContext";

// Mock browser APIs that may not be available in test environment
const mockMatchMedia = vi.fn();
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

// Test component to access theme context
const TestComponent = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button data-testid="toggle-theme" onClick={toggleTheme}>
        Toggle Theme
      </button>
    </div>
  );
};

// Mock browser APIs before each test
beforeEach(() => {
  // Mock window.matchMedia
  mockMatchMedia.mockImplementation((query) => ({
    matches: query === "(prefers-color-scheme: dark)",
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: mockMatchMedia,
  });

  // Mock localStorage
  Object.defineProperty(window, "localStorage", {
    writable: true,
    value: mockLocalStorage,
  });

  // Reset mocks
  mockLocalStorage.getItem.mockReturnValue(null);
  mockLocalStorage.setItem.mockClear();
  mockLocalStorage.removeItem.mockClear();
});

// Ensure cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe.skip("ThemeContext", () => {
  it("provides default light theme when no preference stored", () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    mockMatchMedia.mockImplementation((query) => ({
      matches: false, // Not dark mode preference
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("current-theme")).toHaveTextContent("light");
  });

  it("uses stored theme preference from localStorage", () => {
    mockLocalStorage.getItem.mockReturnValue("dark");

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
  });

  it("detects system dark mode preference when no stored preference", () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    mockMatchMedia.mockImplementation((query) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
  });

  it("toggles theme from light to dark", () => {
    mockLocalStorage.getItem.mockReturnValue("light");

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("current-theme")).toHaveTextContent("light");

    fireEvent.click(screen.getByTestId("toggle-theme"));

    expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith("theme", "dark");
  });

  it("toggles theme from dark to light", () => {
    mockLocalStorage.getItem.mockReturnValue("dark");

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");

    fireEvent.click(screen.getByTestId("toggle-theme"));

    expect(screen.getByTestId("current-theme")).toHaveTextContent("light");
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith("theme", "light");
  });

  it("applies dark class to document element when theme is dark", () => {
    mockLocalStorage.getItem.mockReturnValue("dark");

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    // Check that the effect was called to add 'dark' class
    // Note: In JSDOM, document.documentElement.classList is available
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes dark class from document element when theme is light", () => {
    mockLocalStorage.getItem.mockReturnValue("light");

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("throws error when useTheme is used outside ThemeProvider", () => {
    // Suppress console.error for this test since we expect an error
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useTheme must be used within a ThemeProvider");

    consoleErrorSpy.mockRestore();
  });
});
