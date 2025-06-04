import { NavLink } from "react-router-dom";
import {
  FileText,
  ImageIcon,
  Scissors,
  Minimize2,
  RotateCcw,
} from "lucide-react";

const tools = [
  {
    id: "combine",
    name: "Combine PDFs",
    icon: FileText,
    path: "/combine",
  },
  {
    id: "images-to-pdf",
    name: "Images to PDF",
    icon: ImageIcon,
    path: "/images-to-pdf",
  },
  {
    id: "split-pdfs",
    name: "Split PDFs",
    icon: Scissors,
    path: "/split-pdfs",
  },
  {
    id: "compress",
    name: "Compress PDF",
    icon: Minimize2,
    path: "/compress",
  },
  {
    id: "reorder",
    name: "Reorder Pages",
    icon: RotateCcw,
    path: "/reorder",
  },
];

export const Navigation: React.FC = () => {
  return (
    <nav className="px-6 py-2">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-2">
          <div className="flex space-x-1 overflow-x-auto nav-scrollbar-hidden">
            {tools.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <NavLink
                  key={tool.id}
                  to={tool.path}
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center space-x-3 py-3 px-5 rounded-2xl whitespace-nowrap transition-all duration-300 font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg flex-shrink-0 transform hover:scale-105"
                      : "flex items-center space-x-3 py-3 px-5 rounded-2xl whitespace-nowrap transition-all duration-300 font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50/80 flex-shrink-0 transform hover:scale-105"
                  }
                >
                  <IconComponent className="w-5 h-5" strokeWidth={2} />
                  <span>{tool.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
