import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { Dropzone } from "./Dropzone";

// Ensure cleanup after each test
afterEach(() => {
  cleanup();
});

describe("Dropzone", () => {
  it("renders with default state", () => {
    render(<Dropzone onFilesDrop={vi.fn()} />);

    // Use more specific selectors to avoid multiple element issues
    const dropzone = screen.getByTestId("dropzone-container");
    expect(dropzone).toBeInTheDocument();

    // Check for the upload icon and text (matching actual component text)
    expect(screen.getByText("Drop files here")).toBeInTheDocument();
    expect(screen.getByText("or click to browse")).toBeInTheDocument();
  });

  it("calls onFilesDrop when files are selected via input", () => {
    const mockOnFilesDrop = vi.fn();
    render(<Dropzone onFilesDrop={mockOnFilesDrop} />);

    const fileInput = screen.getByTestId("file-input");
    const testFile = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    expect(mockOnFilesDrop).toHaveBeenCalledWith([testFile]);
  });

  it("shows drag over state correctly", () => {
    render(<Dropzone onFilesDrop={vi.fn()} />);

    const dropzone = screen.getByTestId("dropzone-container");

    // Simulate proper drag event sequence - dragOver is what triggers the state change
    fireEvent.dragOver(dropzone, {
      dataTransfer: { items: [{ kind: "file", type: "application/pdf" }] },
    });

    // Should show border change (checking for drag over styling)
    expect(dropzone).toHaveClass("border-sky-500");
  });

  it("handles drag and drop", () => {
    const mockOnFilesDrop = vi.fn();
    render(<Dropzone onFilesDrop={mockOnFilesDrop} />);

    const dropzone = screen.getByTestId("dropzone-container");
    const testFile = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });

    // Simulate drop event
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [testFile] },
    });

    expect(mockOnFilesDrop).toHaveBeenCalledWith([testFile]);
  });

  it("filters files by accept prop", () => {
    const mockOnFilesDrop = vi.fn();
    render(<Dropzone onFilesDrop={mockOnFilesDrop} accept=".pdf" />);

    const fileInput = screen.getByTestId("file-input");
    expect(fileInput).toHaveAttribute("accept", ".pdf");
  });

  it("handles multiple files when multiple prop is true", () => {
    const mockOnFilesDrop = vi.fn();
    render(<Dropzone onFilesDrop={mockOnFilesDrop} multiple />);

    const fileInput = screen.getByTestId("file-input");
    expect(fileInput).toHaveAttribute("multiple");

    const file1 = new File(["content1"], "test1.pdf", {
      type: "application/pdf",
    });
    const file2 = new File(["content2"], "test2.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(fileInput, { target: { files: [file1, file2] } });

    expect(mockOnFilesDrop).toHaveBeenCalledWith([file1, file2]);
  });

  it("shows custom children when provided", () => {
    const customContent = <div>Custom dropzone content</div>;
    render(<Dropzone onFilesDrop={vi.fn()}>{customContent}</Dropzone>);

    expect(screen.getByText("Custom dropzone content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Dropzone onFilesDrop={vi.fn()} className="custom-dropzone" />);

    const dropzone = screen.getByTestId("dropzone-container");
    expect(dropzone).toHaveClass("custom-dropzone");
  });
});
