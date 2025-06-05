import React, { useState, useCallback, useEffect } from "react";
import { Dropzone, Button, Toast } from "../components";
import { splitPDFToPDFs, splitPDFToImages } from "../pdf-utils";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker for offline use
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface UploadedFile {
  file: File;
  id: string;
  thumbnail: string;
  error?: string;
}

interface ProcessingState {
  isProcessing: boolean;
  progress: string;
  error?: string;
}

interface SplitSettings {
  outputType: "pdfs" | "images" | "single-pdf";
  pageRange: string;
  imageFormat: "jpeg" | "png";
  imageQuality: number;
}

interface ToastState {
  isVisible: boolean;
  message: string;
  type: "success" | "error";
}

interface PageRangeValidation {
  isValid: boolean;
  error?: string;
  parsedPages?: number[];
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const SplitPDFsView: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    progress: "",
  });
  const [splitSettings, setSplitSettings] = useState<SplitSettings>({
    outputType: "pdfs",
    pageRange: "all",
    imageFormat: "jpeg",
    imageQuality: 0.9,
  });

  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: "",
    type: "success",
  });
  const [pageRangeValidation, setPageRangeValidation] = useState<PageRangeValidation>({
    isValid: true,
  });

  // Debounced validation for page range
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [validationTimeout]);

  const generatePDFThumbnail = useCallback(
    async (file: File): Promise<string> => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const scale = 0.5;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        return canvas.toDataURL("image/jpeg", 0.8);
      } catch (error) {
        console.error("PDF thumbnail generation failed:", error);
        return "";
      }
    },
    [],
  );

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

      // Only take the first file for splitting
      const file = files[0];
      const error = validateFile(file);

      if (error) {
        setUploadedFile({
          file,
          id: `${file.name}-${Date.now()}`,
          thumbnail: "",
          error,
        });
        return;
      }

      try {
        const thumbnail = await generatePDFThumbnail(file);
        setUploadedFile({
          file,
          id: `${file.name}-${Date.now()}`,
          thumbnail,
          error: undefined,
        });
      } catch (err) {
        console.error("Failed to process PDF:", err);
        setUploadedFile({
          file,
          id: `${file.name}-${Date.now()}`,
          thumbnail: "",
          error: "Failed to process PDF file",
        });
      }
    },
    [generatePDFThumbnail],
  );

  const removeFile = () => {
    setUploadedFile(null);
  };

  const validatePageRange = async (range: string): Promise<PageRangeValidation> => {
    if (!range.trim()) {
      return {
        isValid: false,
        error: "Page range cannot be empty",
      };
    }

    if (range.toLowerCase() === "all") {
      return {
        isValid: true,
        parsedPages: [],
      };
    }

    // Basic format validation
    const validPattern = /^(\d+(-\d+)?)(,\s*\d+(-\d+)?)*$/;
    if (!validPattern.test(range.trim())) {
      return {
        isValid: false,
        error: "Invalid format. Use numbers, ranges (1-5), or comma-separated values (1,2,3)",
      };
    }

    // If we have an uploaded file, validate against actual page count
    if (uploadedFile && !uploadedFile.error) {
      try {
        const arrayBuffer = await uploadedFile.file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;
        
        const parsedPages = parsePageRange(range, totalPages);
        
        if (parsedPages.length === 0) {
          return {
            isValid: false,
            error: `No valid pages found. Document has ${totalPages} pages`,
          };
        }

        return {
          isValid: true,
          parsedPages,
        };
      } catch (error) {
        return {
          isValid: false,
          error: "Unable to validate against document",
        };
      }
    }

    return {
      isValid: true,
      parsedPages: [],
    };
  };

  const parsePageRange = (range: string, totalPages: number): number[] => {
    if (range.toLowerCase() === "all") {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: number[] = [];
    const parts = range.split(",").map((part) => part.trim());

    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map((num) => parseInt(num.trim()));
        if (
          !isNaN(start) &&
          !isNaN(end) &&
          start >= 1 &&
          end <= totalPages &&
          start <= end
        ) {
          for (let i = start; i <= end; i++) {
            if (!pages.includes(i)) pages.push(i);
          }
        }
      } else {
        const pageNum = parseInt(part);
        if (
          !isNaN(pageNum) &&
          pageNum >= 1 &&
          pageNum <= totalPages &&
          !pages.includes(pageNum)
        ) {
          pages.push(pageNum);
        }
      }
    }

    return pages.sort((a, b) => a - b);
  };

  const handlePageRangeChange = (value: string) => {
    setSplitSettings((prev) => ({
      ...prev,
      pageRange: value,
    }));

    // Clear existing timeout
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    // Set new timeout for validation
    const timeout = setTimeout(async () => {
      const validation = await validatePageRange(value);
      setPageRangeValidation(validation);
    }, 500);

    setValidationTimeout(timeout);
  };

  const handleSplit = async () => {
    if (!uploadedFile || uploadedFile.error) {
      setToast({
        isVisible: true,
        message: "Please upload a valid PDF file",
        type: "error",
      });
      return;
    }

    if (!pageRangeValidation.isValid) {
      setToast({
        isVisible: true,
        message: pageRangeValidation.error || "Invalid page range",
        type: "error",
      });
      return;
    }

    setProcessing({
      isProcessing: true,
      progress: "Analyzing PDF...",
    });

    try {
      // First, get the total number of pages
      const arrayBuffer = await uploadedFile.file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      // Parse page range
      const pagesToSplit = parsePageRange(splitSettings.pageRange, totalPages);

      if (pagesToSplit.length === 0) {
        setToast({
          isVisible: true,
          message: `Invalid page range: ${splitSettings.pageRange}. Please use format like "1-5, 7, 10-12" or "all"`,
          type: "error",
        });
        setProcessing({
          isProcessing: false,
          progress: "",
        });
        return;
      }

      if (splitSettings.outputType === "pdfs") {
        setProcessing((prev) => ({
          ...prev,
          progress: `Splitting into ${pagesToSplit.length} PDF files...`,
        }));

        const result = await splitPDFToPDFs({
          file: uploadedFile.file,
          splitMethod: "ranges",
          ranges: pagesToSplit.join(","),
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        setProcessing((prev) => ({
          ...prev,
          progress: "Creating ZIP archive...",
        }));

        // Create ZIP file for multiple PDFs
        const zip = new JSZip();
        const baseFilename = uploadedFile.file.name.replace(".pdf", "");

        result.pdfBlobs.forEach((blob, index) => {
          const pageNum = pagesToSplit[index];
          zip.file(`${baseFilename}-page-${pageNum}.pdf`, blob);
        });

        const zipBlob = await zip.generateAsync({ type: "blob" });

        setProcessing((prev) => ({
          ...prev,
          progress: "Preparing download...",
        }));

        // Generate filename with timestamp
        const timestamp = new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/:/g, "-");
        const filename = `${baseFilename}-split-pdfs-${timestamp}.zip`;

        // Download the ZIP file
        saveAs(zipBlob, filename);

        setProcessing({
          isProcessing: false,
          progress: "",
        });

        // Show success toast
        setToast({
          isVisible: true,
          message: `Successfully split into ${pagesToSplit.length} PDF files!`,
          type: "success",
        });
      } else if (splitSettings.outputType === "single-pdf") {
        setProcessing((prev) => ({
          ...prev,
          progress: `Extracting ${pagesToSplit.length} pages to single PDF...`,
        }));

        const result = await splitPDFToPDFs({
          file: uploadedFile.file,
          splitMethod: "extract",
          extractRange: pagesToSplit.join(","),
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        setProcessing((prev) => ({
          ...prev,
          progress: "Preparing download...",
        }));

        // Download the single PDF file
        const baseFilename = uploadedFile.file.name.replace(".pdf", "");
        const timestamp = new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/:/g, "-");
        const filename = `${baseFilename}-extracted-pages-${timestamp}.pdf`;

        // Download the single PDF file
        saveAs(result.pdfBlobs[0], filename);

        setProcessing({
          isProcessing: false,
          progress: "",
        });

        // Show success toast
        setToast({
          isVisible: true,
          message: `Successfully extracted ${pagesToSplit.length} pages to single PDF!`,
          type: "success",
        });
      } else {
        setProcessing((prev) => ({
          ...prev,
          progress: `Converting ${pagesToSplit.length} pages to images...`,
        }));

        const result = await splitPDFToImages({
          file: uploadedFile.file,
          format: splitSettings.imageFormat,
          quality: splitSettings.imageQuality,
          extractRange: pagesToSplit.join(","),
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        setProcessing((prev) => ({
          ...prev,
          progress: "Creating ZIP archive...",
        }));

        // Create ZIP file for images
        const zip = new JSZip();
        const baseFilename = uploadedFile.file.name.replace(".pdf", "");

        result.imageBlobs.forEach((blob, index) => {
          const pageNum = pagesToSplit[index];
          const extension =
            splitSettings.imageFormat === "jpeg" ? "jpg" : "png";
          zip.file(`${baseFilename}-page-${pageNum}.${extension}`, blob);
        });

        const zipBlob = await zip.generateAsync({ type: "blob" });

        setProcessing((prev) => ({
          ...prev,
          progress: "Preparing download...",
        }));

        // Generate filename with timestamp
        const timestamp = new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/:/g, "-");
        const filename = `${baseFilename}-split-images-${timestamp}.zip`;

        // Download the ZIP file
        saveAs(zipBlob, filename);

        setProcessing({
          isProcessing: false,
          progress: "",
        });

        // Show success toast
        setToast({
          isVisible: true,
          message: `Successfully converted ${pagesToSplit.length} pages to ${splitSettings.imageFormat.toUpperCase()} images!`,
          type: "success",
        });
      }
    } catch (error) {
      setProcessing({
        isProcessing: false,
        progress: "",
      });
      setToast({
        isVisible: true,
        message: error instanceof Error ? error.message : "Failed to split PDF",
        type: "error",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
      <div className="text-center mb-16 bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
        <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight drop-shadow-sm">
          ✂️{" "}
          <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Split & Extract PDFs
          </span>
        </h1>
        <p className="text-lg text-slate-700 leading-relaxed">
          Split PDF documents into separate files or extract specific pages into
          a single PDF with professional quality output.
        </p>
      </div>

      <div className="space-y-8">
        {/* Upload Section - Full width like header/footer */}
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
          <Dropzone
            onFilesDrop={handleFilesDrop}
            accept=".pdf"
            multiple={false}
            disabled={processing.isProcessing}
            className="w-full min-h-[200px]"
          >
            <div className="space-y-2">
              <div className="text-gray-600 dark:text-gray-400">
                <p className="text-lg font-medium">
                  {processing.isProcessing
                    ? "Processing..."
                    : "Drop PDF file here"}
                </p>
                <p className="text-sm">
                  {processing.isProcessing
                    ? processing.progress
                    : "or click to browse (max 20MB)"}
                </p>
              </div>
            </div>
          </Dropzone>
        </div>

        {/* File Info Section - Full width like header/footer */}
        {uploadedFile && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center">
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
                PDF File
              </h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={removeFile}
                disabled={processing.isProcessing}
                className="hover:shadow-md hover:scale-105 transition-all duration-200"
              >
                Remove
              </Button>
            </div>

            {uploadedFile.error ? (
              <div className="p-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {uploadedFile.error}
                </p>
              </div>
            ) : (
              <div className="flex items-center space-x-4 p-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-16 h-20 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden">
                  {uploadedFile.thumbnail ? (
                    <img
                      src={uploadedFile.thumbnail}
                      alt={`${uploadedFile.file.name} thumbnail`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        PDF
                      </span>
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {uploadedFile && !uploadedFile.error && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 mt-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center">
              <span className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-3 shadow-lg mr-4">
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
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>
              </span>
              Split Settings
            </h2>

            <div className="space-y-6">
              {/* Output Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Output Type
                </label>
                <div className="space-y-3">
                  <label className="flex items-start p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                    <input
                      type="radio"
                      name="outputType"
                      value="pdfs"
                      checked={splitSettings.outputType === "pdfs"}
                      onChange={(e) =>
                        setSplitSettings((prev) => ({
                          ...prev,
                          outputType: e.target.value as
                            | "pdfs"
                            | "images"
                            | "single-pdf",
                        }))
                      }
                      className="mr-3 mt-1"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Split to separate PDF documents
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Creates individual PDF files for each specified page (e.g., page 1, page 2, etc.)
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                    <input
                      type="radio"
                      name="outputType"
                      value="images"
                      checked={splitSettings.outputType === "images"}
                      onChange={(e) =>
                        setSplitSettings((prev) => ({
                          ...prev,
                          outputType: e.target.value as
                            | "pdfs"
                            | "images"
                            | "single-pdf",
                        }))
                      }
                      className="mr-3 mt-1"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Convert to image files
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Converts each page to JPEG or PNG images with customizable quality
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                    <input
                      type="radio"
                      name="outputType"
                      value="single-pdf"
                      checked={splitSettings.outputType === "single-pdf"}
                      onChange={(e) =>
                        setSplitSettings((prev) => ({
                          ...prev,
                          outputType: e.target.value as
                            | "pdfs"
                            | "images"
                            | "single-pdf",
                        }))
                      }
                      className="mr-3 mt-1"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Extract to single PDF document
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Extracts specified pages and combines them into one new PDF document
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Page Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Page Range
                </label>
                <input
                  type="text"
                  value={splitSettings.pageRange}
                  onChange={(e) => handlePageRangeChange(e.target.value)}
                  placeholder="e.g., all, 1,2,3, 2-5, 7"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white ${
                    pageRangeValidation.isValid
                      ? "border-gray-300 dark:border-gray-600 focus:ring-sky-500"
                      : "border-red-300 dark:border-red-600 focus:ring-red-500"
                  }`}
                />
                {pageRangeValidation.error && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {pageRangeValidation.error}
                  </p>
                )}
                <div className="mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Valid examples:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["all", "1,2,3", "2-5", "7", "1-3,5,8-10"].map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => handlePageRangeChange(example)}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Image Settings (when outputType is 'images') */}
              {splitSettings.outputType === "images" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Image Format
                    </label>
                    <select
                      value={splitSettings.imageFormat}
                      onChange={(e) =>
                        setSplitSettings((prev) => ({
                          ...prev,
                          imageFormat: e.target.value as "jpeg" | "png",
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="jpeg">JPEG (smaller files)</option>
                      <option value="png">PNG (lossless)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Image Quality:{" "}
                      {Math.round(splitSettings.imageQuality * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={splitSettings.imageQuality}
                      onChange={(e) =>
                        setSplitSettings((prev) => ({
                          ...prev,
                          imageQuality: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {/* Split Button */}
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  disabled={processing.isProcessing || !pageRangeValidation.isValid}
                  onClick={handleSplit}
                  isLoading={processing.isProcessing}
                >
                  {processing.isProcessing
                    ? processing.progress
                    : `Split to ${splitSettings.outputType === "pdfs" ? "PDFs" : splitSettings.outputType === "images" ? "Images" : "Single PDF"}`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>



      {/* Success Toast */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
};
