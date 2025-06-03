import React, { useState, useCallback } from 'react';
import { Card, Dropzone, Button, Modal } from '../components';
import { splitPDFToPDFs, splitPDFToImages } from '../pdf-utils';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
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
}

interface SplitSettings {
  mode: 'pages' | 'ranges';
  pageRanges: string;
  outputFormat: 'pdf' | 'images';
  imageFormat: 'jpg' | 'png';
  imageQuality: number;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const SplitPDFsView: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    progress: ''
  });
  const [splitSettings, setSplitSettings] = useState<SplitSettings>({
    mode: 'pages',
    pageRanges: '1-',
    outputFormat: 'pdf',
    imageFormat: 'jpg',
    imageQuality: 0.9
  });
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
      // Return placeholder SVG on error
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
    
    // Only take the first file for splitting
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
      
      // Update default page range to include all pages
      setSplitSettings(prev => ({
        ...prev,
        pageRanges: `1-${pageCount}`
      }));
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
    setSplitSettings(prev => ({ ...prev, pageRanges: '1-' }));
  };

  const handleSplit = async () => {
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
      progress: 'Preparing to split PDF...'
    });

    try {
      if (splitSettings.outputFormat === 'pdf') {
        // Split to multiple PDFs
        setProcessing(prev => ({ ...prev, progress: 'Splitting PDF into documents...' }));
        
        const result = await splitPDFToPDFs({
          file: uploadedFile.file,
          splitMethod: 'ranges',
          ranges: splitSettings.pageRanges
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        if (result.pdfBlobs.length === 1) {
          // Single file output
          const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
          const filename = `split-${uploadedFile.file.name.replace('.pdf', '')}-${timestamp}.pdf`;
          saveAs(result.pdfBlobs[0], filename);
        } else {
          // Multiple files - create ZIP
          setProcessing(prev => ({ ...prev, progress: 'Creating ZIP archive...' }));
          
          const zip = new JSZip();
          const baseFilename = uploadedFile.file.name.replace('.pdf', '');
          
          result.pdfBlobs.forEach((fileBlob: Blob, index: number) => {
            const filename = `${baseFilename}-part-${index + 1}.pdf`;
            zip.file(filename, fileBlob);
          });

          const zipBlob = await zip.generateAsync({ type: 'blob' });
          const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
          saveAs(zipBlob, `split-${baseFilename}-${timestamp}.zip`);
        }

        setProcessing({
          isProcessing: false,
          progress: `Successfully split PDF into ${result.pdfBlobs.length} file(s)`
        });
        
      } else {
        // Split to images
        setProcessing(prev => ({ ...prev, progress: 'Converting PDF pages to images...' }));
        
        const result = await splitPDFToImages({
          file: uploadedFile.file,
          format: splitSettings.imageFormat === 'jpg' ? 'jpeg' : 'png',
          quality: splitSettings.imageQuality,
          extractRange: splitSettings.pageRanges
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        setProcessing(prev => ({ ...prev, progress: 'Creating ZIP archive...' }));
        
        // Create ZIP with images
        const zip = new JSZip();
        const baseFilename = uploadedFile.file.name.replace('.pdf', '');
        
        result.imageBlobs.forEach((imageBlob: Blob, index: number) => {
          const extension = splitSettings.imageFormat;
          const filename = `${baseFilename}-page-${index + 1}.${extension}`;
          zip.file(filename, imageBlob);
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        saveAs(zipBlob, `${baseFilename}-images-${timestamp}.zip`);

        setProcessing({
          isProcessing: false,
          progress: `Successfully converted ${result.imageBlobs.length} pages to images`
        });
      }

      setShowModal(true);
      
      // Clear file after successful split
      setTimeout(() => {
        setUploadedFile(null);
        setProcessing({ isProcessing: false, progress: '' });
      }, 2000);

    } catch (error) {
      setProcessing({
        isProcessing: false,
        progress: '',
        error: error instanceof Error ? error.message : 'Failed to split PDF'
      });
      setShowModal(true);
    }
  };

  const canSplit = uploadedFile && !uploadedFile.error && splitSettings.pageRanges.trim();

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          ✂️ Split PDF
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Split a PDF into multiple documents or convert pages to images. Maximum file size: 20MB.
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
                  {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
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
              Split Settings
            </h2>
            
            <div className="space-y-4">
              {/* Output Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Output Format
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="outputFormat"
                      value="pdf"
                      checked={splitSettings.outputFormat === 'pdf'}
                      onChange={(e) => setSplitSettings(prev => ({ ...prev, outputFormat: e.target.value as 'pdf' | 'images' }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">PDF Documents</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="outputFormat"
                      value="images"
                      checked={splitSettings.outputFormat === 'images'}
                      onChange={(e) => setSplitSettings(prev => ({ ...prev, outputFormat: e.target.value as 'pdf' | 'images' }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Image Files</span>
                  </label>
                </div>
              </div>

              {/* Page Ranges */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Page Ranges
                </label>
                <input
                  type="text"
                  value={splitSettings.pageRanges}
                  onChange={(e) => setSplitSettings(prev => ({ ...prev, pageRanges: e.target.value }))}
                  placeholder="e.g. 1-5, 7, 10-12"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Examples: "1-5" (pages 1 to 5), "1,3,5" (pages 1, 3, and 5), "1-" (all pages from 1)
                  {uploadedFile.pageCount && ` • Total pages: ${uploadedFile.pageCount}`}
                </p>
              </div>

              {/* Image Settings (only for images output) */}
              {splitSettings.outputFormat === 'images' && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Image Format
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="imageFormat"
                          value="jpg"
                          checked={splitSettings.imageFormat === 'jpg'}
                          onChange={(e) => setSplitSettings(prev => ({ ...prev, imageFormat: e.target.value as 'jpg' | 'png' }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">JPEG</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="imageFormat"
                          value="png"
                          checked={splitSettings.imageFormat === 'png'}
                          onChange={(e) => setSplitSettings(prev => ({ ...prev, imageFormat: e.target.value as 'jpg' | 'png' }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">PNG</span>
                      </label>
                    </div>
                  </div>

                  {splitSettings.imageFormat === 'jpg' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        JPEG Quality: {Math.round(splitSettings.imageQuality * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={splitSettings.imageQuality}
                        onChange={(e) => setSplitSettings(prev => ({ ...prev, imageQuality: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button 
                variant="primary" 
                disabled={!canSplit || processing.isProcessing}
                onClick={handleSplit}
                isLoading={processing.isProcessing}
              >
                {processing.isProcessing ? processing.progress : `Split to ${splitSettings.outputFormat === 'pdf' ? 'PDFs' : 'Images'}`}
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
            processing.progress
          )}
        </div>
      </Modal>
    </div>
  );
}; 