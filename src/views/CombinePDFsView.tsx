import React, { useState, useCallback } from "react";
import { Dropzone, Button, Modal, Toast } from "../components";
import { mergePDFs } from "../pdf-utils";
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

interface ToastState {
  isVisible: boolean;
  message: string;
  type: "success" | "error";
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const CombinePDFsView: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    progress: "",
  });
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
      const newFiles: UploadedFile[] = [];

      for (const file of files) {
        const error = validateFile(file);
        const fileObj: UploadedFile = {
          file,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          thumbnail: "",
          error: error || undefined,
        };

        if (!error) {
          try {
            fileObj.thumbnail = await generatePDFThumbnail(file);
          } catch (err) {
            console.error("Thumbnail generation failed:", err);
            fileObj.error = "Failed to generate thumbnail";
          }
        }

        newFiles.push(fileObj);
      }

      setUploadedFiles((prev) => [...prev, ...newFiles]);
    },
    [generatePDFThumbnail],
  );

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const moveFileUp = (index: number) => {
    if (index > 0) {
      setUploadedFiles((prev) => {
        const newFiles = [...prev];
        [newFiles[index - 1], newFiles[index]] = [
          newFiles[index],
          newFiles[index - 1],
        ];
        return newFiles;
      });
    }
  };

  const moveFileDown = (index: number) => {
    setUploadedFiles((prev) => {
      if (index < prev.length - 1) {
        const newFiles = [...prev];
        [newFiles[index], newFiles[index + 1]] = [
          newFiles[index + 1],
          newFiles[index],
        ];
        return newFiles;
      }
      return prev;
    });
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
  };

  const handleMerge = async () => {
    const validFiles = uploadedFiles.filter((file) => !file.error);
    if (validFiles.length < 2) {
      setProcessing({
        isProcessing: false,
        progress: "",
        error: "Please upload at least 2 valid PDF files to combine",
      });
      setShowModal(true);
      return;
    }

    setProcessing({
      isProcessing: true,
      progress: "Preparing files for merging...",
    });

    try {
      setProcessing((prev) => ({ ...prev, progress: "Merging PDF files..." }));

      const result = await mergePDFs({
        files: validFiles.map((file) => file.file),
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
      const filename = `combined-pdfs-${timestamp}.pdf`;

      // Download the file
      saveAs(result.pdfBlob, filename);

      setProcessing({
        isProcessing: false,
        progress: "",
      });

      // Show success toast instead of modal
      setToast({
        isVisible: true,
        message: `Successfully combined ${validFiles.length} PDFs!`,
        type: "success",
      });
    } catch (error) {
      setProcessing({
        isProcessing: false,
        progress: "",
        error:
          error instanceof Error ? error.message : "Failed to combine PDFs",
      });
      setShowModal(true);
    }
  };

  const validFiles = uploadedFiles.filter((file) => !file.error);
  const hasErrors = uploadedFiles.some((file) => file.error);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
      <div className="text-center mb-16 bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
        <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight drop-shadow-sm">
          📄{" "}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Combine PDFs
          </span>
        </h1>
        <p className="text-lg text-slate-700 leading-relaxed">
          Merge multiple PDF files into a single document with professional
          quality. Maximum file size: 20MB per file.
        </p>
      </div>

      <div className="space-y-8">
        {/* Upload Section - Full width like header/footer */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center">
            <span className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-3 shadow-lg mr-4">
              <svg
                className="w-6 h-6 text-white"
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
            </span>
            Upload PDF Files
          </h2>
          <Dropzone
            onFilesDrop={handleFilesDrop}
            accept=".pdf"
            multiple={true}
            disabled={processing.isProcessing}
            className="w-full min-h-[200px]"
          >
            <div className="space-y-2">
              <div className="text-gray-600 dark:text-gray-400">
                <p className="text-lg font-medium">
                  {processing.isProcessing
                    ? "Processing..."
                    : "Drop PDF files here"}
                </p>
                <p className="text-sm">
                  {processing.isProcessing
                    ? processing.progress
                    : "or click to browse (max 20MB each)"}
                </p>
              </div>
            </div>
          </Dropzone>
        </div>

        {/* Files Management Section - Full width like header/footer */}
        {uploadedFiles.length > 0 && (
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
                Files to Combine ({validFiles.length} valid)
              </h2>
              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={clearAllFiles}
                  disabled={processing.isProcessing}
                  className="hover:shadow-md hover:scale-105 transition-all duration-200"
                >
                  Clear All
                </Button>
                <Button
                  variant="primary"
                  disabled={validFiles.length < 2 || processing.isProcessing}
                  onClick={handleMerge}
                  isLoading={processing.isProcessing}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  {processing.isProcessing
                    ? processing.progress
                    : "Combine PDFs"}
                </Button>
              </div>
            </div>

            {hasErrors && (
              <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/60 rounded-2xl shadow-sm">
                <h3 className="text-sm font-semibold text-red-800 mb-2 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Some files have errors:
                </h3>
                <ul className="text-sm text-red-700 space-y-1 ml-6">
                  {uploadedFiles
                    .filter((file) => file.error)
                    .map((file) => (
                      <li key={file.id} className="list-disc">
                        {file.error}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            <div className="space-y-4">
              {uploadedFiles.map((fileObj, index) => (
                <div
                  key={fileObj.id}
                  className={`flex items-center space-x-4 p-4 rounded-2xl transition-all duration-200 hover:shadow-md ${
                    fileObj.error
                      ? "bg-red-50/60 border border-red-200/60 backdrop-blur-sm"
                      : "bg-slate-50/60 border border-slate-200/60 backdrop-blur-sm hover:bg-slate-50/80"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="flex-shrink-0 w-16 h-20 bg-slate-100 rounded-xl overflow-hidden shadow-sm">
                    {fileObj.thumbnail ? (
                      <img
                        src={fileObj.thumbnail}
                        alt={`${fileObj.file.name} thumbnail`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs font-medium text-slate-500">
                          PDF
                        </span>
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate mb-1">
                      {fileObj.file.name}
                    </p>
                    <p className="text-xs text-slate-600">
                      {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {fileObj.error && (
                      <p className="text-xs text-red-600 mt-1 font-medium">
                        {fileObj.error}
                      </p>
                    )}
                  </div>

                  {/* Order Number */}
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-full text-sm font-semibold shadow-lg">
                      {index + 1}
                    </span>
                  </div>

                  {/* Controls */}
                  <div className="flex-shrink-0 flex space-x-1">
                    <button
                      onClick={() => moveFileUp(index)}
                      disabled={index === 0 || processing.isProcessing}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-sm"
                      title="Move up"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveFileDown(index)}
                      disabled={
                        index === uploadedFiles.length - 1 ||
                        processing.isProcessing
                      }
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-sm"
                      title="Move down"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeFile(fileObj.id)}
                      disabled={processing.isProcessing}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-sm"
                      title="Remove file"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
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
