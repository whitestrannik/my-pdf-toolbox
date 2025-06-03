import { Link } from 'react-router-dom';
import { Card } from '../components';

const tools = [
  { 
    id: 'combine', 
    name: 'Combine PDFs', 
    description: 'Merge multiple PDF files into a single document',
    icon: '📄',
    path: '/combine' 
  },
  { 
    id: 'images-to-pdf', 
    name: 'Images to PDF', 
    description: 'Convert multiple images into a single PDF file',
    icon: '🖼️',
    path: '/images-to-pdf' 
  },
  { 
    id: 'split-pdfs', 
    name: 'Split to PDFs', 
    description: 'Split a PDF into multiple separate documents',
    icon: '✂️',
    path: '/split-pdfs' 
  },
  { 
    id: 'split-images', 
    name: 'Split to Images', 
    description: 'Convert PDF pages to individual image files',
    icon: '🖨️',
    path: '/split-images' 
  },
  { 
    id: 'compress', 
    name: 'Compress PDF', 
    description: 'Reduce PDF file size while maintaining quality',
    icon: '🗜️',
    path: '/compress' 
  },
  { 
    id: 'reorder', 
    name: 'Reorder Pages', 
    description: 'Rearrange pages in your PDF using drag and drop',
    icon: '🔃',
    path: '/reorder' 
  }
];

export const HomePage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          PDF Tools at Your Fingertips
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          A powerful, client-side PDF toolbox for all your document processing needs. 
          No uploads required - everything happens in your browser.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Link key={tool.id} to={tool.path} className="group">
            <Card className="h-full transition-transform group-hover:scale-105 group-hover:shadow-lg">
              <div className="text-center">
                <div className="text-4xl mb-4">{tool.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {tool.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {tool.description}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-16 text-center">
        <Card className="bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-sky-900 dark:text-sky-100 mb-4">
              🔒 Privacy First
            </h2>
            <p className="text-sky-800 dark:text-sky-200">
              All processing happens locally in your browser. Your files never leave your device, 
              ensuring complete privacy and security for your documents.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}; 