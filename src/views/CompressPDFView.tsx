import React, { useState, useCallback } from "react";
import { Card, Dropzone, Button, Modal, Toast } from "../components";
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
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🗜️ Compress PDF
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Reduce PDF file size while maintaining quality. Maximum file size:
          20MB.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Upload PDF File
          </h2>
          <Dropzone
            onFilesDrop={handleFilesDrop}
            accept=".pdf"
            multiple={false}
            disabled={processing.isProcessing}
          >
            <div className="space-y-2">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
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
        </Card>

        {uploadedFile && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                PDF File
              </h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={removeFile}
                disabled={processing.isProcessing}
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
          </Card>
        )}

        {compressionResult && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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
          </Card>
        )}

        {uploadedFile && !uploadedFile.error && (
          <Card>
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
          </Card>
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
