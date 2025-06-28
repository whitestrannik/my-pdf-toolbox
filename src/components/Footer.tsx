import React from "react";
import { Shield } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="px-6 pb-2">
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-3xl shadow-lg border border-slate-700 pt-3 pb-4 max-w-7xl mx-auto">
        <div className="px-4">
          <div className="flex flex-col items-center justify-center space-y-1.5 text-slate-300">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-900/70 rounded-xl p-1.5">
                <Shield className="w-4 h-4 text-emerald-400" strokeWidth={2} />
              </div>
              <span className="font-semibold text-slate-200">
                Privacy First
              </span>
            </div>
            <p className="text-center max-w-2xl leading-relaxed text-sm">
              All processing happens locally in your browser. Your files never
              leave your device, ensuring complete privacy and security for your
              documents.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
