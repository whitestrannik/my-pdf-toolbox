import React, { useState, useCallback } from 'react';
import { Card, Dropzone, Button, Modal, Toast } from '../components';
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
  type: 'success' | 'error';
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const CombinePDFsView: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    progress: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: '',
    type: 'success'
  });

  const generatePDFThumbnail = useCallback(async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      const scale = 0.5;
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
      console.error('PDF thumbnail generation failed:', error);
      return '';
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
        thumbnail: '',
        error: error || undefined
      };
      
      if (!error) {
        try {
          fileObj.thumbnail = await generatePDFThumbnail(file);
        } catch (err) {
          console.error('Thumbnail generation failed:', err);
          fileObj.error = 'Failed to generate thumbnail';
        }
      }
      
      newFiles.push(fileObj);
    }
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, [generatePDFThumbnail]);

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  const moveFileUp = (index: number) => {
    if (index > 0) {
      setUploadedFiles(prev => {
        const newFiles = [...prev];
        [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
        return newFiles;
      });
    }
  };

  const moveFileDown = (index: number) => {
    setUploadedFiles(prev => {
      if (index < prev.length - 1) {
        const newFiles = [...prev];
        [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
        return newFiles;
      }
      return prev;
    });
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
  };

  const handleMerge = async () => {
    const validFiles = uploadedFiles.filter(file => !file.error);
    if (validFiles.length < 2) {
      setProcessing({
        isProcessing: false,
        progress: '',
        error: 'Please upload at least 2 valid PDF files to combine'
      });
      setShowModal(true);
      return;
    }

    setProcessing({
      isProcessing: true,
      progress: 'Preparing files for merging...'
    });

    try {
      setProcessing(prev => ({ ...prev, progress: 'Merging PDF files...' }));
      
      const result = await mergePDFs({
        files: validFiles.map(file => file.file)
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setProcessing(prev => ({ ...prev, progress: 'Preparing download...' }));
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `combined-pdfs-${timestamp}.pdf`;
      
      // Download the file
      saveAs(result.pdfBlob, filename);
      
      setProcessing({
        isProcessing: false,
        progress: ''
      });
      
      // Show success toast instead of modal
      setToast({
        isVisible: true,
        message: `Successfully combined ${validFiles.length} PDFs!`,
        type: 'success'
      });

    } catch (error) {
      setProcessing({
        isProcessing: false,
        progress: '',
        error: error instanceof Error ? error.message : 'Failed to combine PDFs'
      });
      setShowModal(true);
    }
  };

  const validFiles = uploadedFiles.filter(file => !file.error);
  const hasErrors = uploadedFiles.some(file => file.error);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          📄 Combine PDFs
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Merge multiple PDF files into a single document. Maximum file size: 20MB per file.
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
                  {processing.isProcessing ? processing.progress : 'or click to browse (max 20MB each)'}
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
              <div className="flex space-x-2">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={clearAllFiles}
                  disabled={processing.isProcessing}
                >
                  Clear All
                </Button>
                <Button 
                  variant="primary" 
                  disabled={validFiles.length < 2 || processing.isProcessing}
                  onClick={handleMerge}
                  isLoading={processing.isProcessing}
                >
                  {processing.isProcessing ? processing.progress : 'Combine PDFs'}
                </Button>
              </div>
            </div>
            
            {hasErrors && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                  Some files have errors:
                </h3>
                <ul className="text-sm text-red-600 dark:text-red-300 space-y-1">
                  {uploadedFiles.filter(file => file.error).map(file => (
                    <li key={file.id}>• {file.error}</li>
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
                  <div className="flex-shrink-0 w-16 h-20 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden">
                    {fileObj.thumbnail ? (
                      <img 
                        src={fileObj.thumbnail} 
                        alt={`${fileObj.file.name} thumbnail`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
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
                  
                  {/* Order Number */}
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200 rounded-full text-sm font-medium">
                      {index + 1}
                    </span>
                  </div>
                  
                  {/* Controls */}
                  <div className="flex-shrink-0 flex space-x-1">
                    <button
                      onClick={() => moveFileUp(index)}
                      disabled={index === 0 || processing.isProcessing}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveFileDown(index)}
                      disabled={index === uploadedFiles.length - 1 || processing.isProcessing}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeFile(fileObj.id)}
                      disabled={processing.isProcessing}
                      className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove file"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
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
        <div className="text-red-600 dark:text-red-400">
          {processing.error}
        </div>
      </Modal>

      {/* Success Toast */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}; 