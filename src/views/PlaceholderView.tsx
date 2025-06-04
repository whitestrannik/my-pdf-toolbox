import React from "react";

interface PlaceholderViewProps {
  title: string;
  description: string;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({
  title,
  description,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
      <div className="text-center bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-lg border border-white/20">
        <div className="mb-6">
          <span className="bg-gradient-to-r from-slate-500 to-slate-600 rounded-2xl p-4 shadow-lg inline-block">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
              />
            </svg>
          </span>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight drop-shadow-sm">
          <span className="bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent">
            {title}
          </span>
        </h1>
        <p className="text-lg text-slate-700 leading-relaxed max-w-2xl mx-auto">
          {description}
        </p>
        <div className="mt-8 p-4 bg-blue-50/80 backdrop-blur-sm border border-blue-200/60 rounded-2xl shadow-sm">
          <p className="text-sm text-blue-800 font-medium">
            🚧 This feature is currently under development
          </p>
        </div>
      </div>
    </div>
  );
};
