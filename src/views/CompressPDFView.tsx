import React, { useState, useCallback } from 'react';
import { Card, Dropzone, Button, Modal } from '../components';
import { compressPDF } from '../pdf-utils';
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
  pageCount?: number;
}

interface ProcessingState {
  isProcessing: boolean;
  progress: string;
  error?: string;
  result?: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  };
}

type CompressionLevel = 'low' | 'medium' | 'high';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const CompressPDFView: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    progress: ''
  });
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('medium');
  const [showModal, setShowModal] = useState(false);

  const generateThumbnail = useCallback(async (file: File): Promise<{ thumbnail: string; pageCount: number }> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pageCount = pdf.numPages;
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
      
      const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
      return { thumbnail, pageCount };
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return { 
        thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEwMCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMCAzNkg3MFY0Nkg2MFY0Nkg0MFY0Nkg3MFY1Nkg3MFY2Nkg0MFY2Nkg2MFY2Nkg3MFY3Nkg3MFY4Nkg0MFY4Nkg2MFY4Nkg3MFY5NkgzMFYzNloiIGZpbGw9IiM2QjczODAiLz4KPC9zdmc+',
        pageCount: 0
      };
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
    if (files.length === 0) return;
    
    // Only take the first file for compression
    const file = files[0];
    const error = validateFile(file);
    
    if (error) {
      setUploadedFile({
        file,
        id: `${file.name}-${Date.now()}`,
        error
      });
      return;
    }
    
    setProcessing({ isProcessing: true, progress: 'Analyzing PDF...' });
    
    try {
      const { thumbnail, pageCount } = await generateThumbnail(file);
      setUploadedFile({
        file,
        id: `${file.name}-${Date.now()}`,
        thumbnail,
        pageCount
      });
    } catch (err) {
      console.error('Failed to process PDF:', err);
      setUploadedFile({
        file,
        id: `${file.name}-${Date.now()}`,
        error: 'Failed to process PDF file'
      });
    }
    
    setProcessing({ isProcessing: false, progress: '' });
  }, [generateThumbnail]);

  const removeFile = () => {
    setUploadedFile(null);
    setProcessing({ isProcessing: false, progress: '' });
  };

  const handleCompress = async () => {
    if (!uploadedFile || uploadedFile.error) {
      setProcessing({
        isProcessing: false,
        progress: '',
        error: 'Please upload a valid PDF file'
      });
      setShowModal(true);
      return;
    }

    setProcessing({
      isProcessing: true,
      progress: 'Preparing to compress PDF...'
    });

    try {
      setProcessing(prev => ({ ...prev, progress: 'Compressing PDF...' }));
      
      const result = await compressPDF({
        file: uploadedFile.file,
        compressionLevel: compressionLevel
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setProcessing(prev => ({ ...prev, progress: 'Preparing download...' }));
      
      // Generate filename with compression level and timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const baseFilename = uploadedFile.file.name.replace('.pdf', '');
      const filename = `${baseFilename}-compressed-${compressionLevel}-${timestamp}.pdf`;
      
      // Download the file
      saveAs(result.pdfBlob, filename);
      
      const compressionRatio = ((uploadedFile.file.size - result.compressedSize) / uploadedFile.file.size) * 100;
      
      setProcessing({
        isProcessing: false,
        progress: `Successfully compressed PDF`,
        result: {
          originalSize: uploadedFile.file.size,
          compressedSize: result.compressedSize,
          compressionRatio
        }
      });
      setShowModal(true);
      
      // Clear file after successful compression
      setTimeout(() => {
        setUploadedFile(null);
        setProcessing({ isProcessing: false, progress: '' });
      }, 3000);

    } catch (error) {
      setProcessing({
        isProcessing: false,
        progress: '',
        error: error instanceof Error ? error.message : 'Failed to compress PDF'
      });
      setShowModal(true);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canCompress = uploadedFile && !uploadedFile.error;

  const compressionDescriptions = {
    low: 'Small file size reduction, highest quality',
    medium: 'Balanced compression and quality',
    high: 'Maximum compression, lower quality'
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🗜️ Compress PDF
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Reduce PDF file size while maintaining quality. Maximum file size: 20MB.
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
                  {processing.isProcessing ? 'Processing...' : 'Drop PDF file here'}
                </p>
                <p className="text-sm">
                  {processing.isProcessing ? processing.progress : 'or click to browse (max 20MB)'}
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
            
            <div className={`flex items-center space-x-4 p-3 border rounded-lg ${
              uploadedFile.error 
                ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10' 
                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
            }`}>
              {/* Thumbnail */}
              <div className="flex-shrink-0">
                {uploadedFile.thumbnail ? (
                  <img 
                    src={uploadedFile.thumbnail} 
                    alt={`${uploadedFile.file.name} thumbnail`}
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
                  {uploadedFile.file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(uploadedFile.file.size)}
                  {uploadedFile.pageCount && ` • ${uploadedFile.pageCount} pages`}
                </p>
                {uploadedFile.error && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {uploadedFile.error}
                  </p>
                )}
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
                  {(['low', 'medium', 'high'] as CompressionLevel[]).map(level => (
                    <label key={level} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="compressionLevel"
                        value={level}
                        checked={compressionLevel === level}
                        onChange={(e) => setCompressionLevel(e.target.value as CompressionLevel)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                            {level} Compression
                          </span>
                          {level === 'medium' && (
                            <span className="text-xs bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200 px-2 py-1 rounded">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {compressionDescriptions[level]}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button 
                variant="primary" 
                disabled={!canCompress || processing.isProcessing}
                onClick={handleCompress}
                isLoading={processing.isProcessing}
              >
                {processing.isProcessing ? processing.progress : 'Compress & Download'}
              </Button>
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
            <div className="space-y-2">
              <p>{processing.progress}</p>
              {processing.result && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                    Compression Results:
                  </h4>
                  <div className="text-sm text-green-600 dark:text-green-300 space-y-1">
                    <p>Original size: {formatFileSize(processing.result.originalSize)}</p>
                    <p>Compressed size: {formatFileSize(processing.result.compressedSize)}</p>
                    <p>Size reduction: {processing.result.compressionRatio.toFixed(1)}%</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}; 