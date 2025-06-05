import { Link, useLocation } from "react-router-dom";
import { FileText } from "lucide-react";

export const Header: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <header className="px-6 pt-2">
      <div
        className={`bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 px-6 py-4 max-w-7xl mx-auto ${!isHomePage ? "sticky top-2 z-[100]" : ""}`}
      >
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center space-x-3 transition-all duration-200 group"
            style={{
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div className="bg-gradient-primary rounded-2xl p-3 shadow-lg shadow-blue-500/25 transition-all duration-200">
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
            <div className="hidden sm:flex items-center px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full tooltip-container transition-all duration-200 hover:bg-emerald-100 hover:border-emerald-300">
              <div className="relative flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse flex-shrink-0"></div>
                <span className="text-sm font-medium text-emerald-700">
                  Privacy First
                </span>
              </div>
              <div className="tooltip">
                100% client-side processing. No data ever leaves your device.
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
