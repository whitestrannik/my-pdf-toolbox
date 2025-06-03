import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="glass-effect sticky top-0 z-50 px-6 py-4 border-b border-white/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center space-x-3 hover:opacity-80 transition-all duration-200 group"
        >
          <div className="bg-gradient-primary rounded-2xl p-3 shadow-lg shadow-blue-500/25 group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-all duration-200 group-hover:-translate-y-0.5">
            <FileText className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              PDF Toolbox
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Professional PDF Tools
            </p>
          </div>
        </Link>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-emerald-700">
              Privacy First
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}; 