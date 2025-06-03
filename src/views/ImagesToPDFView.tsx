import React, { useState, useCallback } from "react";
import { Card, Dropzone, Button, Modal, Toast } from "../components";
import { convertImagesToPDF } from "../pdf-utils";
import { saveAs } from "file-saver";

interface UploadedImage {
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

interface ConversionSettings {
  pageSize: "a4" | "letter" | "auto";
  orientation: "portrait" | "landscape";
  margin: number; // in mm
  quality: number; // 0.1 to 1.0
}

interface ToastState {
  isVisible: boolean;
  message: string;
  type: "success" | "error";
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB per image
const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/bmp",
  "image/webp",
];

export const ImagesToPDFView: React.FC = () => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    progress: "",
  });
  const [conversionSettings, setConversionSettings] =
    useState<ConversionSettings>({
      pageSize: "a4",
      orientation: "portrait",
      margin: 10,
      quality: 0.9,
    });
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: "",
    type: "success",
  });

  const generateImageThumbnail = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d")!;

          // Calculate thumbnail size (max 150x200, maintain aspect ratio)
          const maxWidth = 150;
          const maxHeight = 200;
          let { width, height } = img;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return `${file.name}: Unsupported format. Supported: JPEG, PNG, GIF, BMP, WebP`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File size exceeds 20MB limit`;
    }
    return null;
  };

  const handleFilesDrop = useCallback(
    async (files: File[]) => {
      const newImages: UploadedImage[] = [];

      for (const file of files) {
        const error = validateFile(file);
        const imageObj: UploadedImage = {
          file,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          thumbnail: "",
          error: error || undefined,
        };

        if (!error) {
          try {
            imageObj.thumbnail = await generateImageThumbnail(file);
          } catch (err) {
            console.error("Thumbnail generation failed:", err);
            imageObj.error = "Failed to generate thumbnail";
          }
        }

        newImages.push(imageObj);
      }

      setUploadedImages((prev) => [...prev, ...newImages]);
    },
    [generateImageThumbnail],
  );

  const removeImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    setUploadedImages((prev) => {
      const newImages = [...prev];
      const [removed] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, removed);
      return newImages;
    });
  };

  const clearAllImages = () => {
    setUploadedImages([]);
  };

  const handleConvert = async () => {
    const validImages = uploadedImages.filter((img) => !img.error);
    if (validImages.length === 0) {
      setProcessing({
        isProcessing: false,
        progress: "",
        error: "Please upload at least one valid image file",
      });
      setShowModal(true);
      return;
    }

    setProcessing({
      isProcessing: true,
      progress: "Preparing images for conversion...",
    });

    try {
      setProcessing((prev) => ({
        ...prev,
        progress: "Converting images to PDF...",
      }));

      const result = await convertImagesToPDF({
        images: validImages.map((img) => img.file),
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
      const filename = `images-to-pdf-${timestamp}.pdf`;

      // Download the file
      saveAs(result.pdfBlob, filename);

      setProcessing({
        isProcessing: false,
        progress: "",
      });

      // Show success toast instead of modal
      setToast({
        isVisible: true,
        message: `Successfully converted ${validImages.length} images to PDF!`,
        type: "success",
      });
    } catch (error) {
      setProcessing({
        isProcessing: false,
        progress: "",
        error:
          error instanceof Error
            ? error.message
            : "Failed to convert images to PDF",
      });
      setShowModal(true);
    }
  };

  const validImages = uploadedImages.filter((img) => !img.error);
  const hasErrors = uploadedImages.some((img) => img.error);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🖼️ Images to PDF
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Convert multiple images into a single PDF document. Supported formats:
          JPEG, PNG, GIF, BMP, WebP. Maximum file size: 20MB per image.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Upload Image Files
          </h2>
          <Dropzone
            onFilesDrop={handleFilesDrop}
            accept="image/*"
            multiple={true}
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
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h36v16a2 2 0 01-2 2H8a2 2 0 01-2-2V20zM6 12a2 2 0 012-2h32a2 2 0 012 2v8H6v-8z"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="text-gray-600 dark:text-gray-400">
                <p className="text-lg font-medium">
                  {processing.isProcessing
                    ? "Processing..."
                    : "Drop image files here"}
                </p>
                <p className="text-sm">
                  {processing.isProcessing
                    ? processing.progress
                    : "or click to browse (JPEG, PNG, GIF, BMP, WebP - max 20MB each)"}
                </p>
              </div>
            </div>
          </Dropzone>
        </Card>

        {uploadedImages.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Images to Convert ({validImages.length} valid)
              </h2>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={clearAllImages}
                  disabled={processing.isProcessing}
                >
                  Clear All
                </Button>
                <Button
                  variant="primary"
                  disabled={validImages.length === 0 || processing.isProcessing}
                  onClick={handleConvert}
                  isLoading={processing.isProcessing}
                >
                  {processing.isProcessing
                    ? processing.progress
                    : "Convert to PDF"}
                </Button>
              </div>
            </div>

            {hasErrors && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                  Some files have errors:
                </h3>
                <ul className="text-sm text-red-600 dark:text-red-300 space-y-1">
                  {uploadedImages
                    .filter((img) => img.error)
                    .map((img) => (
                      <li key={img.id}>• {img.error}</li>
                    ))}
                </ul>
              </div>
            )}

            {/* Image Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {uploadedImages.map((imageObj, index) => (
                <div
                  key={imageObj.id}
                  className={`relative group border-2 rounded-lg overflow-hidden ${
                    imageObj.error
                      ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                  }`}
                >
                  {/* Image Thumbnail */}
                  <div className="aspect-w-3 aspect-h-4">
                    {imageObj.thumbnail ? (
                      <img
                        src={imageObj.thumbnail}
                        alt={`${imageObj.file.name} thumbnail`}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          IMG
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Image Info */}
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {imageObj.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(imageObj.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {imageObj.error && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {imageObj.error}
                      </p>
                    )}
                  </div>

                  {/* Controls Overlay */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex space-x-1">
                      {!imageObj.error && index > 0 && (
                        <button
                          onClick={() => reorderImages(index, index - 1)}
                          disabled={processing.isProcessing}
                          className="w-6 h-6 bg-black bg-opacity-50 text-white rounded text-xs hover:bg-opacity-70"
                        >
                          ↑
                        </button>
                      )}
                      {!imageObj.error && index < validImages.length - 1 && (
                        <button
                          onClick={() => reorderImages(index, index + 1)}
                          disabled={processing.isProcessing}
                          className="w-6 h-6 bg-black bg-opacity-50 text-white rounded text-xs hover:bg-opacity-70"
                        >
                          ↓
                        </button>
                      )}
                      <button
                        onClick={() => removeImage(imageObj.id)}
                        disabled={processing.isProcessing}
                        className="w-6 h-6 bg-red-500 bg-opacity-70 text-white rounded text-xs hover:bg-opacity-90"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Page Number */}
                  {!imageObj.error && (
                    <div className="absolute bottom-1 left-1">
                      <span className="bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                        {validImages.findIndex((v) => v.id === imageObj.id) + 1}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {validImages.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              PDF Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Page Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Page Size
                </label>
                <select
                  value={conversionSettings.pageSize}
                  onChange={(e) =>
                    setConversionSettings((prev) => ({
                      ...prev,
                      pageSize: e.target.value as "a4" | "letter" | "auto",
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="a4">A4 (210 × 297 mm)</option>
                  <option value="letter">Letter (216 × 279 mm)</option>
                  <option value="auto">Auto (fit to image)</option>
                </select>
              </div>

              {/* Orientation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Orientation
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="orientation"
                      value="portrait"
                      checked={conversionSettings.orientation === "portrait"}
                      onChange={(e) =>
                        setConversionSettings((prev) => ({
                          ...prev,
                          orientation: e.target.value as
                            | "portrait"
                            | "landscape",
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Portrait
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="orientation"
                      value="landscape"
                      checked={conversionSettings.orientation === "landscape"}
                      onChange={(e) =>
                        setConversionSettings((prev) => ({
                          ...prev,
                          orientation: e.target.value as
                            | "portrait"
                            | "landscape",
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Landscape
                    </span>
                  </label>
                </div>
              </div>

              {/* Margin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Margin: {conversionSettings.margin}mm
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={conversionSettings.margin}
                  onChange={(e) =>
                    setConversionSettings((prev) => ({
                      ...prev,
                      margin: parseInt(e.target.value),
                    }))
                  }
                  className="w-full"
                />
              </div>

              {/* Quality */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image Quality: {Math.round(conversionSettings.quality * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={conversionSettings.quality}
                  onChange={(e) =>
                    setConversionSettings((prev) => ({
                      ...prev,
                      quality: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full"
                />
              </div>
            </div>
          </Card>
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
