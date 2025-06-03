import React, { useState, useCallback } from 'react';
import { Card, Dropzone, Button, Modal } from '../components';
import { mergePDFs } from '../pdf-utils';
import { saveAs } from 'file-saver';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker for offline use
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface UploadedFile {
  file: File;
  id: string;
  thumbnail?: string;
  error?: string;
}

interface ProcessingState {
  isProcessing: boolean;
  progress: string;
  error?: string;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const CombinePDFsView: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    progress: ''
  });
  const [showModal, setShowModal] = useState(false);

  const generateThumbnail = useCallback(async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1); // Get first page
      
      const scale = 0.5; // Smaller scale for thumbnail
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      // Return placeholder SVG on error
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEwMCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMCAzNkg3MFY0Nkg2MFY0Nkg0MFY0Nkg3MFY1Nkg3MFY2Nkg0MFY2Nkg2MFY2Nkg3MFY3Nkg3MFY4Nkg0MFY4Nkg2MFY4Nkg3MFY5NkgzMFYzNloiIGZpbGw9IiM2QjczODAiLz4KPC9zdmc+';
    }
  }, []);

  const validateFile = (file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return `${file.name}: Only PDF files are supported`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File size exceeds 20MB limit`;
    }
    return null;
  };

  const handleFilesDrop = useCallback(async (files: File[]) => {
    const newFiles: UploadedFile[] = [];
    
    for (const file of files) {
      const error = validateFile(file);
      const fileObj: UploadedFile = {
        file,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        error: error || undefined
      };
      
      if (!error) {
        // Generate thumbnail in real-time
        try {
          fileObj.thumbnail = await generateThumbnail(file);
        } catch (err) {
          console.error('Thumbnail generation failed:', err);
        }
      }
      
      newFiles.push(fileObj);
    }
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, [generateThumbnail]);

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const reorderFiles = (fromIndex: number, toIndex: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      const [removed] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, removed);
      return newFiles;
    });
  };

  const handleCombine = async () => {
    const validFiles = uploadedFiles.filter(f => !f.error);
    if (validFiles.length < 2) {
      setProcessing({
        isProcessing: false,
        progress: '',
        error: 'At least 2 valid PDF files are required for combining'
      });
      setShowModal(true);
      return;
    }

    setProcessing({
      isProcessing: true,
      progress: 'Preparing files for merge...'
    });

    try {
      setProcessing(prev => ({ ...prev, progress: 'Merging PDF files...' }));
      
      const result = await mergePDFs({
        files: validFiles.map(f => f.file)
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setProcessing(prev => ({ ...prev, progress: 'Preparing download...' }));
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `combined-pdf-${timestamp}.pdf`;
      
      // Download the file
      saveAs(result.pdfBlob, filename);
      
      setProcessing({
        isProcessing: false,
        progress: `Successfully combined ${validFiles.length} PDFs (${result.totalPages} pages total)`
      });
      setShowModal(true);
      
      // Clear files after successful combine
      setTimeout(() => {
        setUploadedFiles([]);
        setProcessing({ isProcessing: false, progress: '' });
      }, 2000);

    } catch (error) {
      setProcessing({
        isProcessing: false,
        progress: '',
        error: error instanceof Error ? error.message : 'Failed to combine PDFs'
      });
      setShowModal(true);
    }
  };

  const validFiles = uploadedFiles.filter(f => !f.error);
  const hasErrors = uploadedFiles.some(f => f.error);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          📄 Combine PDFs
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload multiple PDF files and merge them into a single document. Maximum file size: 20MB per file.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Upload PDF Files
          </h2>
          <Dropzone
            onFilesDrop={handleFilesDrop}
            accept=".pdf"
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
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="text-gray-600 dark:text-gray-400">
                <p className="text-lg font-medium">
                  {processing.isProcessing ? 'Processing...' : 'Drop PDF files here'}
                </p>
                <p className="text-sm">
                  {processing.isProcessing ? processing.progress : 'or click to browse (max 20MB per file)'}
                </p>
              </div>
            </div>
          </Dropzone>
        </Card>

        {uploadedFiles.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Files to Combine ({validFiles.length} valid)
              </h2>
              <Button 
                variant="primary" 
                disabled={validFiles.length < 2 || processing.isProcessing}
                onClick={handleCombine}
                isLoading={processing.isProcessing}
              >
                {processing.isProcessing ? processing.progress : 'Combine & Download'}
              </Button>
            </div>
            
            {hasErrors && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                  Some files have errors:
                </h3>
                <ul className="text-sm text-red-600 dark:text-red-300 space-y-1">
                  {uploadedFiles.filter(f => f.error).map(f => (
                    <li key={f.id}>• {f.error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="space-y-3">
              {uploadedFiles.map((fileObj, index) => (
                <div 
                  key={fileObj.id}
                  className={`flex items-center space-x-4 p-3 border rounded-lg ${
                    fileObj.error 
                      ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10' 
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    {fileObj.thumbnail ? (
                      <img 
                        src={fileObj.thumbnail} 
                        alt={`${fileObj.file.name} thumbnail`}
                        className="w-12 h-16 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-12 h-16 bg-gray-200 dark:bg-gray-600 rounded border flex items-center justify-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">PDF</span>
                      </div>
                    )}
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {fileObj.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {fileObj.error && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {fileObj.error}
                      </p>
                    )}
                  </div>
                  
                  {/* Controls */}
                  <div className="flex items-center space-x-2">
                    {!fileObj.error && index > 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => reorderFiles(index, index - 1)}
                        disabled={processing.isProcessing}
                      >
                        ↑
                      </Button>
                    )}
                    {!fileObj.error && index < validFiles.length - 1 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => reorderFiles(index, index + 1)}
                        disabled={processing.isProcessing}
                      >
                        ↓
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => removeFile(fileObj.id)}
                      disabled={processing.isProcessing}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Status Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title={processing.error ? 'Error' : 'Success'}
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
    </div>
  );
}; 