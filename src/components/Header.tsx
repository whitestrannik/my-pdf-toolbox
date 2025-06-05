import { Link, useLocation } from "react-router-dom";

export const Header: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <header className="px-6 pt-2">
      <div
        className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 px-4 py-2.5 max-w-7xl mx-auto ${!isHomePage ? "sticky top-2 z-[100]" : ""}`}
      >
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center space-x-2 transition-all duration-200 group"
          >
            {/* PDF Symbol Icon */}
            <div className="relative w-5 h-5 flex items-center justify-center">
              {/* PDF Symbol */}
              <div className="relative">
                {/* Document Shape */}
                <div className="w-4 h-5 bg-gradient-to-b from-red-50 to-red-100 border border-red-200 rounded-sm shadow-sm transition-all duration-300 group-hover:shadow-md">
                  {/* PDF Text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="text-xs font-bold text-red-600 leading-none"
                      style={{ fontSize: "6px" }}
                    >
                      PDF
                    </span>
                  </div>

                  {/* Corner Fold */}
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-white border-l border-b border-red-200 transform rotate-45 origin-bottom-left"></div>
                </div>
              </div>
            </div>

            {/* 28px Text */}
            <span
              className="font-normal text-slate-500 tracking-wider"
              style={{ fontSize: "28px" }}
            >
              PDF toolbox
            </span>
          </Link>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg tooltip-container transition-all duration-200 hover:bg-emerald-100 hover:border-emerald-300">
              <div className="relative flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse flex-shrink-0"></div>
                <span className="text-xs font-semibold text-emerald-700">
                  Privacy First
                </span>
              </div>
              <div className="tooltip">
                100% client-side processing. Your files never leave your device.
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
