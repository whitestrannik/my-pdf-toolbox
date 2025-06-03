import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-6 mt-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center justify-center space-y-2 text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🔒</span>
            <span className="font-medium">Privacy First</span>
          </div>
          <p className="text-sm text-center">
          All processing happens locally in your browser. Your files never leave your device, ensuring complete privacy and security for your documents.
          </p>
        </div>
      </div>
    </footer>
  );
}; 
