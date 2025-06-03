import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-6 mt-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
          <span className="text-lg">🔒</span>
          <span className="font-medium">Privacy First</span>
          <span className="text-sm">• All processing happens locally in your browser</span>
        </div>
      </div>
    </footer>
  );
}; 