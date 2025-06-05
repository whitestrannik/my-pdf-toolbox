import { ChevronRight, FileText, Scissors, SplitSquareHorizontal, Zap, Shield, Download, ImageIcon, Minimize2, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

const tools = [
  {
    name: "Combine PDFs",
    description: "Merge multiple PDF files into a single document",
    path: "/combine",
    icon: FileText,
    gradient: "from-blue-50 to-indigo-50",
    iconColor: "text-blue-600",
    hoverColor: "hover:border-blue-200"
  },
  {
    name: "Split & Extract",
    description: "Extract pages or split PDF into separate files",
    path: "/split-pdfs",
    icon: Scissors,
    gradient: "from-emerald-50 to-teal-50",
    iconColor: "text-emerald-600",
    hoverColor: "hover:border-emerald-200"
  },
  {
    name: "Images to PDF",
    description: "Convert multiple images into a single PDF file",
    path: "/images-to-pdf",
    icon: ImageIcon,
    gradient: "from-violet-50 to-purple-50",
    iconColor: "text-violet-600",
    hoverColor: "hover:border-violet-200"
  },
  {
    name: "Compress PDF",
    description: "Reduce PDF file size while maintaining quality",
    path: "/compress",
    icon: Minimize2,
    gradient: "from-rose-50 to-pink-50",
    iconColor: "text-rose-600",
    hoverColor: "hover:border-rose-200"
  },
  {
    name: "Reorder Pages",
    description: "Rearrange pages in your PDF using drag and drop",
    path: "/reorder",
    icon: RotateCcw,
    gradient: "from-amber-50 to-orange-50",
    iconColor: "text-amber-600",
    hoverColor: "hover:border-amber-200"
  },
];

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Process documents in seconds with optimized algorithms"
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "All processing happens locally - your files never leave your device"
  },
  {
    icon: Download,
    title: "No Registration",
    description: "Start working immediately without creating an account"
  }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-indigo-50/30"></div>
        <div className="relative px-6 pt-16 pb-20 sm:px-12 lg:px-20 lg:pt-24 lg:pb-28">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center rounded-full bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-medium text-slate-600 shadow-sm border border-slate-200">
              <Zap className="mr-2 h-4 w-4 text-blue-500" />
              Open Source PDF Toolkit
            </div>
            
            {/* Main Heading */}
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
              Elegant PDF
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Processing
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              Free, open-source PDF tools that work entirely in your browser. 
              Merge, split, and extract with complete privacy.
            </p>
            
            {/* CTA Button */}
            <div className="flex justify-center">
              <Link
                to="/combine"
                className="group inline-flex items-center rounded-2xl bg-white px-8 py-4 text-base font-semibold text-slate-700 shadow-lg shadow-slate-900/10 ring-1 ring-slate-200 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/20 hover:ring-slate-300"
              >
                Get Started
                <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-6 sm:px-12 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Core Features
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Simple, secure, and completely free to use
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl bg-white/70 backdrop-blur-sm p-8 shadow-sm border border-slate-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-slate-900/10"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-slate-100 to-slate-50 mb-6 group-hover:scale-110 transition-transform duration-200">
                  <feature.icon className="h-6 w-6 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="py-20 px-6 sm:px-12 lg:px-20 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Available Tools
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Choose the tool you need for your PDF processing
            </p>
          </div>
          
          {/* Scrollable Tools Container */}
          <div className="relative">
            <div className="flex overflow-x-auto space-x-6 pb-4 scrollbar-hide snap-x snap-mandatory">
              {tools.map((tool, index) => (
                <Link
                  key={tool.name}
                  to={tool.path}
                  className="group relative block flex-shrink-0 w-80 snap-start"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${tool.gradient} p-8 shadow-sm border border-white/50 transition-all duration-300 hover:-translate-y-3 hover:shadow-xl hover:shadow-slate-900/10 ${tool.hoverColor} h-full`}>
                    {/* Icon */}
                    <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white/80 backdrop-blur-sm mb-6 group-hover:scale-110 transition-all duration-200 shadow-sm">
                      <tool.icon className={`h-7 w-7 ${tool.iconColor}`} />
                    </div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <h3 className="text-xl font-semibold text-slate-900 mb-3 group-hover:text-slate-700">
                        {tool.name}
                      </h3>
                      <p className="text-slate-600 leading-relaxed mb-4">
                        {tool.description}
                      </p>
                      
                      {/* Arrow */}
                      <div className="flex items-center text-sm font-medium text-slate-500 group-hover:text-slate-600">
                        <span>Try it now</span>
                        <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                    
                    {/* Subtle decoration */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Scroll Indicators */}
            <div className="flex justify-center mt-6 space-x-2">
              {tools.map((_, index) => (
                <div key={index} className="w-2 h-2 bg-slate-300 rounded-full"></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="py-20 px-6 sm:px-12 lg:px-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-3xl bg-gradient-to-r from-slate-50 to-white p-12 shadow-lg shadow-slate-900/5 border border-slate-100">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Open source tools you can trust with your documents
            </p>
            <Link
              to="/combine"
              className="inline-flex items-center rounded-2xl bg-slate-900 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:bg-slate-800"
            >
              Start Processing PDFs
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

