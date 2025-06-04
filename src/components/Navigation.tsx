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
    <nav className="glass-effect border-b border-white/20 py-4 sticky top-[73px] z-[90]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex space-x-2 overflow-x-auto pb-2 pt-1 px-1 nav-scrollbar-hidden">
          {tools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <NavLink
                key={tool.id}
                to={tool.path}
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center space-x-3 py-3 px-4 rounded-xl whitespace-nowrap transition-all duration-300 font-medium bg-blue-50 text-blue-700 border border-blue-200 shadow-sm flex-shrink-0"
                    : "flex items-center space-x-3 py-3 px-4 rounded-xl whitespace-nowrap transition-all duration-300 font-medium text-slate-600 flex-shrink-0"
                }
              >
                <IconComponent className="w-5 h-5" strokeWidth={2} />
                <span>{tool.name}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
