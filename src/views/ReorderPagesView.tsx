import React, { useState, useCallback } from "react";
import { Card, Dropzone, Button, Modal, Toast } from "../components";
import { reorderPDF } from "../pdf-utils";
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

interface PageInfo {
  index: number;
  thumbnail: string;
  originalIndex: number;
}

interface ProcessingState {
  isProcessing: boolean;
  progress: string;
  error?: string;
}

interface DragState {
  isDragging: boolean;
  draggedIndex: number | null;
  dropTargetIndex: number | null;
}

interface ToastState {
  isVisible: boolean;
  message: string;
  type: "success" | "error";
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const ReorderPagesView: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    progress: "",
  });
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedIndex: null,
    dropTargetIndex: null,
  });
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: "",
    type: "success",
  });

  const generatePageThumbnails = useCallback(
    async (file: File): Promise<PageInfo[]> => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pageCount = pdf.numPages;
        const pageInfos: PageInfo[] = [];

        for (let i = 1; i <= pageCount; i++) {
          const page = await pdf.getPage(i);
          const scale = 0.3; // Smaller scale for thumbnails in grid
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
            index: i - 1, // 0-based index for our UI
            originalIndex: i - 1, // Remember original position
            thumbnail: canvas.toDataURL("image/jpeg", 0.8),
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

      // Only take the first file for reordering
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
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.currentTarget.outerHTML);
    e.dataTransfer.setDragImage(e.currentTarget as Element, 0, 0);

    setDragState({
      isDragging: true,
      draggedIndex: index,
      dropTargetIndex: null,
    });
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    setDragState((prev) => ({
      ...prev,
      dropTargetIndex: index,
    }));
  };

  const handleDragLeave = () => {
    setDragState((prev) => ({
      ...prev,
      dropTargetIndex: null,
    }));
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    const { draggedIndex } = dragState;
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDragState({
        isDragging: false,
        draggedIndex: null,
        dropTargetIndex: null,
      });
      return;
    }

    // Reorder pages
    setPages((prev) => {
      const newPages = [...prev];
      const [draggedPage] = newPages.splice(draggedIndex, 1);
      newPages.splice(dropIndex, 0, draggedPage);

      // Update indices
      return newPages.map((page, idx) => ({
        ...page,
        index: idx,
      }));
    });

    setDragState({
      isDragging: false,
      draggedIndex: null,
      dropTargetIndex: null,
    });
  };

  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      draggedIndex: null,
      dropTargetIndex: null,
    });
  };

  const resetOrder = () => {
    setPages((prev) =>
      [...prev]
        .sort((a, b) => a.originalIndex - b.originalIndex)
        .map((page, idx) => ({ ...page, index: idx })),
    );
  };

  const reverseOrder = () => {
    setPages((prev) =>
      [...prev].reverse().map((page, idx) => ({ ...page, index: idx })),
    );
  };

  const handleReorder = async () => {
    if (!uploadedFile || uploadedFile.error || pages.length === 0) {
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
      progress: "Preparing to reorder pages...",
    });

    try {
      setProcessing((prev) => ({
        ...prev,
        progress: "Reordering PDF pages...",
      }));

      // Get the new page order (convert from 0-based to 1-based for the utility)
      const newOrder = pages.map((page) => page.originalIndex + 1);

      const result = await reorderPDF({
        file: uploadedFile.file,
        pageOrder: newOrder,
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
      const baseFilename = uploadedFile.file.name.replace(".pdf", "");
      const filename = `${baseFilename}-reordered-${timestamp}.pdf`;

      // Download the file
      saveAs(result.pdfBlob, filename);

      setProcessing({
        isProcessing: false,
        progress: "",
      });

      // Show success toast
      setToast({
        isVisible: true,
        message: `Successfully reordered ${pages.length} pages!`,
        type: "success",
      });
    } catch (error) {
      setProcessing({
        isProcessing: false,
        progress: "",
        error:
          error instanceof Error ? error.message : "Failed to reorder pages",
      });
      setShowModal(true);
    }
  };

  const hasChanges = pages.some((page, index) => page.originalIndex !== index);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
      <div className="text-center mb-16 bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
        <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight drop-shadow-sm">
          🔄 <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Reorder Pages</span>
        </h1>
        <p className="text-lg text-slate-700 leading-relaxed">
          Rearrange PDF pages using intuitive drag and drop functionality with real-time preview.
        </p>
      </div>

      <div className="space-y-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center">
            <span className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl p-3 shadow-lg mr-4">
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
        </div>

        {uploadedFile && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center">
                <span className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl p-3 shadow-lg mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                PDF File ({pages.length} pages)
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
              <div className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/60 rounded-2xl shadow-sm">
                <p className="text-sm font-medium text-red-700 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {uploadedFile.error}
                </p>
              </div>
            ) : (
              <div className="flex items-center space-x-4 p-4 bg-slate-50/60 border border-slate-200/60 backdrop-blur-sm rounded-2xl transition-all duration-200">
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate mb-1">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-slate-600">
                    {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB • {pages.length} pages
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {pages.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center">
                <span className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-3 shadow-lg mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </span>
                Page Order
              </h2>
              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={resetOrder}
                  disabled={processing.isProcessing}
                  className="hover:shadow-md hover:scale-105 transition-all duration-200"
                >
                  Reset Order
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={reverseOrder}
                  disabled={processing.isProcessing}
                  className="hover:shadow-md hover:scale-105 transition-all duration-200"
                >
                  Reverse Order
                </Button>
                <Button
                  variant="primary"
                  disabled={!hasChanges || processing.isProcessing}
                  onClick={handleReorder}
                  isLoading={processing.isProcessing}
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  {processing.isProcessing
                    ? processing.progress
                    : "Apply Reorder & Download"}
                </Button>
              </div>
            </div>

            <div className="mb-6 p-4 bg-blue-50/80 backdrop-blur-sm border border-blue-200/60 rounded-2xl shadow-sm">
              <p className="text-sm text-blue-800 flex items-start">
                <span className="text-blue-600 mr-2">💡</span>
                <span>
                  <strong>Tip:</strong> Drag and drop pages to reorder them. The page number shows the current position.
                  {hasChanges
                    ? " Changes detected - click 'Apply Reorder' to save."
                    : " No changes made yet."}
                </span>
              </p>
            </div>

            {/* Page Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {pages.map((page, index) => (
                <div
                  key={`${page.originalIndex}-${index}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`relative group cursor-grab active:cursor-grabbing border-2 rounded-lg overflow-hidden transition-all ${
                    dragState.draggedIndex === index
                      ? "opacity-50 scale-95"
                      : dragState.dropTargetIndex === index
                        ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20 scale-105"
                        : page.originalIndex !== index
                          ? "border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20"
                          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  {/* Page Thumbnail */}
                  <div className="aspect-w-3 aspect-h-4">
                    <img
                      src={page.thumbnail}
                      alt={`Page ${index + 1} thumbnail`}
                      className="w-full h-32 object-cover pointer-events-none"
                      draggable={false}
                    />
                  </div>

                  {/* Page Info */}
                  <div className="p-2 text-center">
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      Page {index + 1}
                    </p>
                    {page.originalIndex !== index && (
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        (was {page.originalIndex + 1})
                      </p>
                    )}
                  </div>

                  {/* Drag Handle Indicator */}
                  <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-6 h-6 bg-black bg-opacity-50 text-white rounded text-xs flex items-center justify-center">
                      ⋮⋮
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={processing.error ? "Error" : "Success"}
      >
        <div className="text-gray-600 dark:text-gray-400">
          {processing.error ? (
            <div className="text-red-600 dark:text-red-400">
              {processing.error}
            </div>
          ) : (
            processing.progress
          )}
        </div>
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
