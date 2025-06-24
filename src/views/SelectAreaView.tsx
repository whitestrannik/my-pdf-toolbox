import React, { useState, useCallback, useRef, useEffect } from "react";
import { Dropzone, Button, Modal, Toast } from "../components";
import { selectPDFArea } from "../pdf-utils";
import { saveAs } from "file-saver";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker for offline use
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface UploadedFile {
  file: File;
  id: string;
  error?: string;
}

interface ProcessingState {
  isProcessing: boolean;
  progress: string;
  error?: string;
}

interface PageInfo {
  pageNumber: number;
  thumbnail: string;
  width: number;
  height: number;
}

interface SelectionState {
  isSelecting: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  selection: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

interface ExportSettings {
  outputFormat: "jpeg" | "png";
  quality: number;
  filename: string;
}

interface ToastState {
  isVisible: boolean;
  message: string;
  type: "success" | "error";
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const CANVAS_SCALE = 2; // High-DPI rendering

export const SelectAreaView: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    progress: "",
  });
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectionState, setSelectionState] = useState<SelectionState>({
    isSelecting: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    selection: null,
  });
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    outputFormat: "jpeg",
    quality: 0.92,
    filename: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: "",
    type: "success",
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generatePageThumbnails = useCallback(
    async (file: File): Promise<PageInfo[]> => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pageCount = pdf.numPages;
        const pageInfos: PageInfo[] = [];

        for (let i = 1; i <= pageCount; i++) {
          const page = await pdf.getPage(i);
          const scale = 0.2; // Small scale for thumbnails
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d")!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;

          pageInfos.push({
            pageNumber: i,
            thumbnail: canvas.toDataURL("image/jpeg", 0.8),
            width: viewport.width / scale, // Original dimensions
            height: viewport.height / scale,
          });
        }

        return pageInfos;
      } catch (error) {
        console.error("Failed to generate page thumbnails:", error);
        throw error;
      }
    },
    [],
  );

  const renderCurrentPage = useCallback(async () => {
    if (!uploadedFile || !canvasRef.current) return;

    try {
      const arrayBuffer = await uploadedFile.file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(currentPage);
      const scale = CANVAS_SCALE;
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d")!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Clear any previous selection
      setSelectionState((prev) => ({ ...prev, selection: null }));
    } catch (error) {
      console.error("Failed to render page:", error);
    }
  }, [uploadedFile, currentPage]);

  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);

  const validateFile = (file: File): string | null => {
    if (file.type !== "application/pdf") {
      return `${file.name}: Only PDF files are supported`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File size exceeds 20MB limit`;
    }
    return null;
  };

  const handleFilesDrop = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const file = files[0];
      const error = validateFile(file);

      if (error) {
        setUploadedFile({
          file,
          id: `${file.name}-${Date.now()}`,
          error,
        });
        return;
      }

      setProcessing({ isProcessing: true, progress: "Analyzing PDF pages..." });

      try {
        const pageInfos = await generatePageThumbnails(file);
        setUploadedFile({
          file,
          id: `${file.name}-${Date.now()}`,
        });
        setPages(pageInfos);
        setCurrentPage(1);

        // Set default filename
        const baseName = file.name.replace(".pdf", "");
        setExportSettings((prev) => ({
          ...prev,
          filename: `${baseName}-page1-selection`,
        }));
      } catch (err) {
        console.error("Failed to process PDF:", err);
        setUploadedFile({
          file,
          id: `${file.name}-${Date.now()}`,
          error: "Failed to process PDF file",
        });
        setPages([]);
      }

      setProcessing({ isProcessing: false, progress: "" });
    },
    [generatePageThumbnails],
  );

  const removeFile = () => {
    setUploadedFile(null);
    setPages([]);
    setCurrentPage(1);
    setSelectionState((prev) => ({ ...prev, selection: null }));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setSelectionState({
      isSelecting: true,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      selection: null,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectionState.isSelecting || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setSelectionState((prev) => ({
      ...prev,
      currentX: x,
      currentY: y,
    }));
  };

  const handleMouseUp = () => {
    if (!selectionState.isSelecting) return;

    const { startX, startY, currentX, currentY } = selectionState;

    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    if (width > 10 && height > 10) {
      setSelectionState((prev) => ({
        ...prev,
        isSelecting: false,
        selection: { x, y, width, height },
      }));
    } else {
      setSelectionState((prev) => ({
        ...prev,
        isSelecting: false,
        selection: null,
      }));
    }
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);

    // Update filename
    if (uploadedFile) {
      const baseName = uploadedFile.file.name.replace(".pdf", "");
      setExportSettings((prev) => ({
        ...prev,
        filename: `${baseName}-page${pageNumber}-selection`,
      }));
    }
  };

  const handleExportArea = async () => {
    if (!uploadedFile || !selectionState.selection) {
      setProcessing({
        isProcessing: false,
        progress: "",
        error: "Please select an area first",
      });
      setShowModal(true);
      return;
    }

    setProcessing({
      isProcessing: true,
      progress: "Extracting selected area...",
    });

    try {
      const result = await selectPDFArea({
        file: uploadedFile.file,
        pageNumber: currentPage,
        selection: selectionState.selection,
        outputFormat: exportSettings.outputFormat,
        quality: exportSettings.quality,
        scale: CANVAS_SCALE,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setProcessing((prev) => ({ ...prev, progress: "Preparing download..." }));

      // Generate filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const extension = exportSettings.outputFormat;
      const filename = `${exportSettings.filename}-${timestamp}.${extension}`;

      // Download the file
      saveAs(result.imageBlob!, filename);

      setToast({
        isVisible: true,
        message: `Area saved to file successfully!`,
        type: "success",
      });

      setProcessing({
        isProcessing: false,
        progress: "",
      });
    } catch (error) {
      setProcessing({
        isProcessing: false,
        progress: "",
        error: error instanceof Error ? error.message : "Failed to export area",
      });
      setShowModal(true);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!uploadedFile || !selectionState.selection) {
      setProcessing({
        isProcessing: false,
        progress: "",
        error: "Please select an area first",
      });
      setShowModal(true);
      return;
    }

    // Check if clipboard API is supported
    if (!navigator.clipboard || !window.isSecureContext) {
      setProcessing({
        isProcessing: false,
        progress: "",
        error:
          "Clipboard API not supported. Please use the 'Save to File' button instead.",
      });
      setShowModal(true);
      return;
    }

    setProcessing({
      isProcessing: true,
      progress: "Copying to clipboard...",
    });

    try {
      // For clipboard, always use PNG format as it's more widely supported
      const result = await selectPDFArea({
        file: uploadedFile.file,
        pageNumber: currentPage,
        selection: selectionState.selection,
        outputFormat: "png", // Force PNG for clipboard compatibility
        quality: exportSettings.quality,
        scale: CANVAS_SCALE,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Copy to clipboard with PNG format
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": result.imageBlob!,
        }),
      ]);

      setToast({
        isVisible: true,
        message: `Area copied to clipboard as PNG!`,
        type: "success",
      });

      setProcessing({
        isProcessing: false,
        progress: "",
      });
    } catch (error) {
      setProcessing({
        isProcessing: false,
        progress: "",
        error:
          error instanceof Error
            ? error.message
            : "Failed to copy to clipboard",
      });
      setShowModal(true);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getSelectionInfo = () => {
    if (!selectionState.selection) return null;

    const { x, y, width, height } = selectionState.selection;
    return {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-4 relative z-10">
      <div className="text-center mb-5 bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
        <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight drop-shadow-sm">
          🎯{" "}
          <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Select Area
          </span>
        </h1>
        <p className="text-lg text-slate-700 leading-relaxed max-w-2xl mx-auto">
          Select any area from PDF pages and export as high-quality images with
          automatic clipboard copying.
        </p>
      </div>

      <div className="space-y-5">
        {/* Upload Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center">
            <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-3 shadow-lg mr-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </span>
            Upload PDF File
          </h2>

          {!uploadedFile ? (
            <Dropzone
              onFilesDrop={handleFilesDrop}
              accept="application/pdf"
              multiple={false}
              disabled={processing.isProcessing}
            />
          ) : (
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-sm text-slate-600">
                      {formatFileSize(uploadedFile.file.size)} • {pages.length}{" "}
                      pages
                    </p>
                    {uploadedFile.error && (
                      <p className="text-sm text-red-600 mt-1">
                        {uploadedFile.error}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={removeFile}
                  disabled={processing.isProcessing}
                >
                  Remove
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        {uploadedFile && !uploadedFile.error && pages.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Page Navigation Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20 sticky top-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Pages ({pages.length})
                </h3>

                {/* Page Navigation Controls */}
                <div className="flex items-center space-x-2 mb-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    ←
                  </Button>
                  <div className="flex items-center space-x-2 flex-1">
                    <input
                      type="number"
                      min={1}
                      max={pages.length}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= pages.length) {
                          handlePageChange(page);
                        }
                      }}
                      className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-center text-sm"
                    />
                    <span className="text-sm text-slate-600">
                      of {pages.length}
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      handlePageChange(Math.min(pages.length, currentPage + 1))
                    }
                    disabled={currentPage === pages.length}
                  >
                    →
                  </Button>
                </div>

                {/* Thumbnail Grid */}
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {pages.map((page) => (
                    <button
                      key={page.pageNumber}
                      onClick={() => handlePageChange(page.pageNumber)}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        currentPage === page.pageNumber
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <img
                        src={page.thumbnail}
                        alt={`Page ${page.pageNumber}`}
                        className="w-full h-auto rounded"
                      />
                      <p className="text-xs text-slate-600 mt-1">
                        Page {page.pageNumber}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Canvas Area */}
            <div className="lg:col-span-3">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Page {currentPage} - Select Area
                  </h3>
                  {selectionState.selection && (
                    <div className="text-sm text-slate-600">
                      Selection: {getSelectionInfo()?.width} ×{" "}
                      {getSelectionInfo()?.height}px
                      {getSelectionInfo() && (
                        <span className="ml-2">
                          at ({getSelectionInfo()?.x}, {getSelectionInfo()?.y})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Canvas Container */}
                <div className="relative bg-slate-100 rounded-xl overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    className="block max-w-full h-auto cursor-crosshair"
                    style={{
                      width: "100%",
                      height: "auto",
                    }}
                  />

                  {/* Selection Overlay */}
                  {selectionState.isSelecting &&
                    (() => {
                      if (!canvasRef.current) return null;
                      const rect = canvasRef.current.getBoundingClientRect();
                      const scaleX = rect.width / canvasRef.current.width;
                      const scaleY = rect.height / canvasRef.current.height;

                      return (
                        <div
                          className="absolute border-2 border-emerald-500 bg-emerald-500/20 pointer-events-none"
                          style={{
                            left: `${Math.min(selectionState.startX, selectionState.currentX) * scaleX}px`,
                            top: `${Math.min(selectionState.startY, selectionState.currentY) * scaleY}px`,
                            width: `${Math.abs(selectionState.currentX - selectionState.startX) * scaleX}px`,
                            height: `${Math.abs(selectionState.currentY - selectionState.startY) * scaleY}px`,
                          }}
                        />
                      );
                    })()}

                  {/* Final Selection Overlay */}
                  {selectionState.selection &&
                    (() => {
                      if (!canvasRef.current) return null;
                      const rect = canvasRef.current.getBoundingClientRect();
                      const scaleX = rect.width / canvasRef.current.width;
                      const scaleY = rect.height / canvasRef.current.height;

                      return (
                        <div
                          className="absolute border-2 border-emerald-600 bg-emerald-600/20 pointer-events-none"
                          style={{
                            left: `${selectionState.selection.x * scaleX}px`,
                            top: `${selectionState.selection.y * scaleY}px`,
                            width: `${selectionState.selection.width * scaleX}px`,
                            height: `${selectionState.selection.height * scaleY}px`,
                          }}
                        />
                      );
                    })()}
                </div>

                {/* Instructions */}
                <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-600">
                    <strong>Instructions:</strong> Click and drag on the PDF to
                    select an area. The selected area will be highlighted and
                    can be exported as an image.
                    {selectionState.selection && (
                      <span className="block mt-2 text-emerald-600 font-medium">
                        ✓ Area selected! Scroll down to export settings.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Settings */}
        {uploadedFile && !uploadedFile.error && selectionState.selection && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
              <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-3 shadow-lg mr-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </span>
              Export Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Output Format */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Output Format
                </label>
                <div className="flex space-x-4">
                  {[
                    { value: "jpeg", label: "JPEG" },
                    { value: "png", label: "PNG" },
                  ].map((format) => (
                    <label key={format.value} className="flex items-center">
                      <input
                        type="radio"
                        name="outputFormat"
                        value={format.value}
                        checked={exportSettings.outputFormat === format.value}
                        onChange={(e) =>
                          setExportSettings((prev) => ({
                            ...prev,
                            outputFormat: e.target.value as "jpeg" | "png",
                          }))
                        }
                        className="mr-2"
                      />
                      {format.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Quality Slider (JPEG only) */}
              {exportSettings.outputFormat === "jpeg" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Quality: {Math.round(exportSettings.quality * 100)}%
                  </label>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.1}
                    value={exportSettings.quality}
                    onChange={(e) =>
                      setExportSettings((prev) => ({
                        ...prev,
                        quality: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </div>
              )}

              {/* Filename */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Filename
                </label>
                <input
                  type="text"
                  value={exportSettings.filename}
                  onChange={(e) =>
                    setExportSettings((prev) => ({
                      ...prev,
                      filename: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter filename"
                />
              </div>
            </div>

            {/* Export Buttons */}
            <div className="mt-6 flex justify-center space-x-4">
              <Button
                onClick={handleCopyToClipboard}
                disabled={processing.isProcessing || !selectionState.selection}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 text-lg"
                size="lg"
              >
                {processing.isProcessing &&
                processing.progress.includes("clipboard") ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    Copying...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy to Clipboard
                  </>
                )}
              </Button>

              <Button
                onClick={handleExportArea}
                disabled={processing.isProcessing || !selectionState.selection}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 text-lg"
                size="lg"
              >
                {processing.isProcessing &&
                !processing.progress.includes("clipboard") ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Save to File
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Processing Indicator */}
      {processing.isProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-lg font-medium text-slate-900 mb-2">
              Processing...
            </p>
            <p className="text-slate-600">{processing.progress}</p>
          </div>
        </div>
      )}

      {/* Error Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Error"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-slate-700 mb-6">
            {processing.error || "An error occurred"}
          </p>
          <Button onClick={() => setShowModal(false)}>Close</Button>
        </div>
      </Modal>

      {/* Toast Notification */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
};
