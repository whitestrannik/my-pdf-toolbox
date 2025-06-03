import { Card, Dropzone, Button } from '../components';

export const CombinePDFsView: React.FC = () => {
  const handleFilesDrop = (files: File[]) => {
    console.log('Files dropped:', files);
    // TODO: Handle PDF files for combining
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          📄 Combine PDFs
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload multiple PDF files and merge them into a single document.
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
                <p className="text-lg font-medium">Drop PDF files here</p>
                <p className="text-sm">or click to browse</p>
              </div>
            </div>
          </Dropzone>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Files to Combine
            </h2>
            <Button variant="primary" disabled>
              Combine & Download
            </Button>
          </div>
          <div className="mt-4 text-gray-500 dark:text-gray-400 text-center py-8">
            No files uploaded yet. Drop some PDF files above to get started.
          </div>
        </Card>
      </div>
    </div>
  );
}; 