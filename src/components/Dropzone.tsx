import { useState, useRef } from 'react';
import type { ReactNode } from 'react';

interface DropzoneProps {
  onFilesDrop: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  children?: ReactNode;
  className?: string;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFilesDrop,
  accept,
  multiple = true,
  children,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    onFilesDrop(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onFilesDrop(files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      data-testid="dropzone-container"
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragOver 
          ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20' 
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }
        ${className}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
        data-testid="file-input"
      />
      
      {children || (
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
            <p className="text-lg font-medium">Drop files here</p>
            <p className="text-sm">or click to browse</p>
          </div>
        </div>
      )}
    </div>
  );
}; 