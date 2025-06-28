import { NavLink } from "react-router-dom";
import {
  FileText,
  ImageIcon,
  Scissors,
  Minimize2,
  RotateCcw,
  Crop,
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
    name: "Split & Extract",
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
  {
    id: "select-area",
    name: "Select Area",
    icon: Crop,
    path: "/select-area",
  },
];

export const Navigation: React.FC = () => {
  return (
    <nav className="px-6 py-1">
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-700 p-2">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {tools.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <NavLink
                  key={tool.id}
                  to={tool.path}
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center space-x-2 py-2.5 px-4 rounded-xl whitespace-nowrap transition-all duration-200 font-medium bg-blue-600 text-white shadow-sm flex-shrink-0"
                      : "flex items-center space-x-2 py-2.5 px-4 rounded-xl whitespace-nowrap transition-all duration-200 font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-700 flex-shrink-0"
                  }
                >
                  <IconComponent className="w-4 h-4" strokeWidth={2} />
                  <span className="text-sm">{tool.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
