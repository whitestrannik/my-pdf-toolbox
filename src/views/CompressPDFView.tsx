import React, { useState, useCallback } from "react";
import { Dropzone, Button, Modal, Toast } from "../components";
import { compressPDF } from "../pdf-utils";
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
  thumbnail: string;
  error?: string;
}

interface ProcessingState {
  isProcessing: boolean;
  progress: string;
  error?: string;
}

interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
}

interface ToastState {
  isVisible: boolean;
  message: string;
  type: "success" | "error";
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const CompressPDFView: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    progress: "",
  });
  const [compressionLevel, setCompressionLevel] = useState<
    "low" | "medium" | "high"
  >("medium");
  const [compressionResult, setCompressionResult] =
    useState<CompressionResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: "",
    type: "success",
  });

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

      // Only take the first file for compression
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
        setCompressionResult(null); // Reset previous results
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
    setCompressionResult(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getCompressionDescription = (level: "low" | "medium" | "high") => {
    switch (level) {
      case "low":
        return "Minimal compression - Keeps high quality, smaller file size reduction";
      case "medium":
        return "Balanced compression - Good quality with moderate file size reduction";
      case "high":
        return "Maximum compression - Significant file size reduction, may reduce quality";
      default:
        return "";
    }
  };

  const handleCompress = async () => {
    if (!uploadedFile || uploadedFile.error) {
      setProcessing({
        isProcessing: false,
        progress: "",
        error: "Please upload a valid PDF file",
      });
      setShowModal(true);
      return;
    }

    setProcessing({
      isProcessing: true,
      progress: "Analyzing PDF structure...",
    });

    try {
      setProcessing((prev) => ({ ...prev, progress: "Compressing PDF..." }));

      const result = await compressPDF({
        file: uploadedFile.file,
        compressionLevel: compressionLevel,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setProcessing((prev) => ({ ...prev, progress: "Preparing download..." }));

      // Calculate compression stats
      const originalSize = uploadedFile.file.size;
      const compressedSize = result.pdfBlob.size;
      const reductionPercentage = Math.round(
        ((originalSize - compressedSize) / originalSize) * 100,
      );

      setCompressionResult({
        originalSize,
        compressedSize,
        reductionPercentage,
      });

      // Generate filename with timestamp and compression level
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const baseFilename = uploadedFile.file.name.replace(".pdf", "");
      const filename = `${baseFilename}-compressed-${compressionLevel}-${timestamp}.pdf`;

      // Download the file
      saveAs(result.pdfBlob, filename);

      setProcessing({
        isProcessing: false,
        progress: "",
      });

      // Show success toast with compression details
      setToast({
        isVisible: true,
        message: `PDF compressed successfully! ${reductionPercentage}% size reduction`,
        type: "success",
      });
    } catch (error) {
      setProcessing({
        isProcessing: false,
        progress: "",
        error:
          error instanceof Error ? error.message : "Failed to compress PDF",
      });
      setShowModal(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
      <div className="text-center mb-16 bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
        <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight drop-shadow-sm">
          🗜️{" "}
          <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Compress PDF
          </span>
        </h1>
        <p className="text-lg text-slate-700 leading-relaxed">
          Reduce PDF file size while maintaining optimal quality for faster
          sharing and storage.
        </p>
      </div>

      <div className="space-y-8">
        {/* Upload Section - Full width like header/footer */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center">
            <span className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-3 shadow-lg mr-4">
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
                <span className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-3 shadow-lg mr-4">
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
                    {formatFileSize(uploadedFile.file.size)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {compressionResult && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 mt-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center">
              <span className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-3 shadow-lg mr-4">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
              Compression Results
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Original Size
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatFileSize(compressionResult.originalSize)}
                </p>
              </div>

              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Compressed Size
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatFileSize(compressionResult.compressedSize)}
                </p>
              </div>

              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">
                  Size Reduction
                </p>
                <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                  {compressionResult.reductionPercentage}%
                </p>
              </div>
            </div>
          </div>
        )}

        {uploadedFile && !uploadedFile.error && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 mt-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Compression Settings
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Compression Level
                </label>
                <div className="space-y-3">
                  {(["low", "medium", "high"] as const).map((level) => (
                    <label
                      key={level}
                      className="flex items-start space-x-3 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="compressionLevel"
                        value={level}
                        checked={compressionLevel === level}
                        onChange={(e) =>
                          setCompressionLevel(
                            e.target.value as "low" | "medium" | "high",
                          )
                        }
                        className="mt-1"
                      />
                      <div className="flex-grow">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {level} Compression
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {getCompressionDescription(level)}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  variant="primary"
                  disabled={processing.isProcessing}
                  onClick={handleCompress}
                  isLoading={processing.isProcessing}
                >
                  {processing.isProcessing
                    ? processing.progress
                    : "Compress & Download"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Error"
      >
        <div className="text-red-600 dark:text-red-400">{processing.error}</div>
      </Modal>

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
