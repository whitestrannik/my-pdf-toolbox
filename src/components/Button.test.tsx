import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import Button from "./Button";

// Ensure cleanup after each test
afterEach(() => {
  cleanup();
});

describe("Button", () => {
  it("renders with default props", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-white"); // primary variant
    expect(button).toHaveClass("px-4"); // medium size
  });

  it("renders children correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("applies variant classes correctly", () => {
    render(<Button variant="primary">Primary Button</Button>);
    const button = screen.getByText("Primary Button");
    expect(button).toHaveClass("bg-white");
  });

  it("applies size classes correctly", () => {
    render(<Button size="lg">Large Button</Button>);
    const button = screen.getByText("Large Button");
    expect(button).toHaveClass("px-6", "py-3", "text-base");
  });

  it("shows loading state correctly", () => {
    render(<Button loading>Loading Button</Button>);
    expect(screen.getByText("Loading Button")).toBeInTheDocument();
    // Should have loader icon
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it("handles disabled state", () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByText("Disabled Button");
    expect(button).toBeDisabled();
  });

  it("renders with icons correctly", () => {
    const leftIcon = <span data-testid="left-icon">←</span>;
    const rightIcon = <span data-testid="right-icon">→</span>;
    
    render(
      <Button leftIcon={leftIcon} rightIcon={rightIcon}>
        Icon Button
      </Button>
    );
    
    expect(screen.getByTestId("left-icon")).toBeInTheDocument();
    expect(screen.getByTestId("right-icon")).toBeInTheDocument();
  });

  it("handles click events", () => {
    let clicked = false;
    render(<Button onClick={() => { clicked = true; }}>Click me</Button>);
    
    fireEvent.click(screen.getByText("Click me"));
    expect(clicked).toBe(true);
  });

  it("applies fullWidth correctly", () => {
    render(<Button fullWidth>Full Width Button</Button>);
    const button = screen.getByText("Full Width Button");
    expect(button).toHaveClass("w-full");
  });

  it("applies different variants correctly", () => {
    // Test primary variant (default)
    const { unmount: unmount1 } = render(
      <Button variant="primary">Primary</Button>,
    );
    expect(screen.getByRole("button")).toHaveClass("bg-white");
    unmount1();

    // Test secondary variant
    const { unmount } = render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-slate-50");
    unmount();

    // Test elegant variant
    const { unmount: unmount2 } = render(
      <Button variant="elegant">Elegant</Button>,
    );
    expect(screen.getByRole("button")).toHaveClass("bg-gradient-to-r");
    unmount2();

    // Test ghost variant
    const { unmount: unmount3 } = render(
      <Button variant="ghost">Ghost</Button>,
    );
    expect(screen.getByRole("button")).toHaveClass("bg-transparent");
    unmount3();
  });

  it("applies different sizes correctly", () => {
    // Test small size
    const { unmount } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button")).toHaveClass("px-3");
    unmount();

    // Test medium size (default)
    const { unmount: unmount2 } = render(<Button size="md">Medium</Button>);
    expect(screen.getByRole("button")).toHaveClass("px-4");
    unmount2();

    // Test large size
    const { unmount: unmount3 } = render(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button")).toHaveClass("px-6");
    unmount3();
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled button</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:opacity-50");
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });

  it("forwards additional props to button element", () => {
    render(<Button data-testid="test-button">Test</Button>);
    const button = screen.getByTestId("test-button");
    expect(button).toBeInTheDocument();
  });
});
