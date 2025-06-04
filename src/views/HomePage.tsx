import { Link } from "react-router-dom";
import { Card } from "../components";
import {
  FileText,
  ImageIcon,
  Scissors,
  ScanLine,
  Minimize2,
  RotateCcw,
  ArrowRight,
  Zap,
  Shield,
  Clock,
} from "lucide-react";

const tools = [
  {
    id: "combine",
    name: "Combine PDFs",
    description:
      "Merge multiple PDF files into a single document with professional quality",
    icon: FileText,
    path: "/combine",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "images-to-pdf",
    name: "Images to PDF",
    description:
      "Convert multiple images into a single PDF file with custom settings",
    icon: ImageIcon,
    path: "/images-to-pdf",
    color: "from-purple-500 to-purple-600",
  },
  {
    id: "split-pdfs",
    name: "Split to PDFs",
    description: "Split a PDF into multiple separate documents by page ranges",
    icon: Scissors,
    path: "/split-pdfs",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    id: "split-images",
    name: "Split to Images",
    description: "Convert PDF pages to individual high-quality image files",
    icon: ScanLine,
    path: "/split-images",
    color: "from-orange-500 to-orange-600",
  },
  {
    id: "compress",
    name: "Compress PDF",
    description: "Reduce PDF file size while maintaining optimal quality",
    icon: Minimize2,
    path: "/compress",
    color: "from-red-500 to-red-600",
  },
  {
    id: "reorder",
    name: "Reorder Pages",
    description: "Rearrange pages in your PDF using intuitive drag and drop",
    icon: RotateCcw,
    path: "/reorder",
    color: "from-indigo-500 to-indigo-600",
  },
];

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Process PDFs instantly with client-side technology",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your files never leave your device",
  },
  {
    icon: Clock,
    title: "Always Available",
    description: "No server downtime, works offline",
  },
];

export const HomePage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
      {/* Hero Section */}
      <div className="text-center mb-16 bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 homepage-hero">
        <h1 className="text-5xl font-bold text-slate-900 mb-6 tracking-tight drop-shadow-sm">
          PDF Tools at Your
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {" "}
            Fingertips
          </span>
        </h1>

        <p className="text-xl text-slate-700 max-w-2xl mx-auto leading-relaxed mb-8">
          A powerful, client-side PDF toolbox for all your document processing
          needs. No uploads required - everything happens securely in your
          browser.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="flex items-center space-x-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200 hover:shadow-md hover:scale-105 transition-all duration-200 hover-effect"
              >
                <IconComponent
                  className="w-4 h-4 text-slate-600"
                  strokeWidth={2}
                />
                <span className="text-sm font-medium text-slate-700">
                  {feature.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool, index) => {
          const IconComponent = tool.icon;
          return (
            <Link key={tool.id} to={tool.path} className="group hover-effect">
              <Card
                variant="elevated"
                hoverable
                className="h-full animate-slide-in-up border-slate-200/60 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`bg-gradient-to-r ${tool.color} rounded-2xl p-3 shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:-translate-y-1`}
                  >
                    <IconComponent
                      className="w-6 h-6 text-white"
                      strokeWidth={2}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">
                        {tool.name}
                      </h3>
                      <ArrowRight
                        className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all duration-200"
                        strokeWidth={2}
                      />
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
