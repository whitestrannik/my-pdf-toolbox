import { NavLink } from 'react-router-dom';

const tools = [
  { 
    id: 'combine', 
    name: 'Combine PDFs', 
    icon: '📄',
    path: '/combine' 
  },
  { 
    id: 'images-to-pdf', 
    name: 'Images to PDF', 
    icon: '🖼️',
    path: '/images-to-pdf' 
  },
  { 
    id: 'split-pdfs', 
    name: 'Split to PDFs', 
    icon: '✂️',
    path: '/split-pdfs' 
  },
  { 
    id: 'split-images', 
    name: 'Split to Images', 
    icon: '🖨️',
    path: '/split-images' 
  },
  { 
    id: 'compress', 
    name: 'Compress PDF', 
    icon: '🗜️',
    path: '/compress' 
  },
  { 
    id: 'reorder', 
    name: 'Reorder Pages', 
    icon: '🔃',
    path: '/reorder' 
  }
];

export const Navigation: React.FC = () => {
  return (
    <nav className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex space-x-8 overflow-x-auto">
          {tools.map((tool) => (
            <NavLink
              key={tool.id}
              to={tool.path}
              className={({ isActive }) =>
                `flex items-center space-x-2 py-4 px-2 border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`
              }
            >
              <span className="text-lg">{tool.icon}</span>
              <span className="font-medium">{tool.name}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}; 