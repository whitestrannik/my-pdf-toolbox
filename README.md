# 📄 PDF Toolbox

A powerful, privacy-focused PDF processing application built with React, TypeScript, and Vite. All processing happens locally in your browser - no uploads, no server-side processing, complete privacy.

## 🚀 Live Demo

Visit the application: **[https://whitestrannik.github.io/my-pdf-toolbox/](https://YOUR_USERNAME.github.io/my-pdf-toolbox/)**

## ✨ Features

- **🔗 Merge PDFs** - Combine multiple PDF files into one
- **✂️ Split PDFs** - Extract pages or convert to images  
- **🗜️ Compress PDFs** - Reduce file size with quality options
- **📄 Images to PDF** - Convert JPEG/PNG images to PDF
- **🔀 Reorder Pages** - Rearrange PDF pages with drag & drop

### 🔒 Privacy First
- **100% Client-Side Processing** - No uploads, no server
- **Local File Processing** - Files never leave your device
- **No Data Collection** - Zero tracking or analytics
- **Secure & Fast** - Modern browser-based PDF utilities

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS 4 + Custom Design System
- **PDF Processing**: pdf-lib, pdfjs-dist
- **Testing**: Vitest + React Testing Library + Playwright
- **Deployment**: GitHub Pages + GitHub Actions

## 🏗️ Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/my-pdf-toolbox.git
cd my-pdf-toolbox

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run test       # Run unit tests
npm run e2e        # Run E2E tests
npm run lint       # Run ESLint
```

## 🚀 Deployment

### GitHub Pages (Recommended)

1. **Push to GitHub**: Ensure your code is pushed to the `main` branch
2. **Enable Pages**: Go to repository Settings → Pages → Source: GitHub Actions
3. **Auto Deploy**: Every push to `main` triggers automatic deployment via GitHub Actions

### Manual Deployment
```bash
# Build the application
npm run build

# Deploy the dist/ folder to your hosting provider
```

## 🧪 Testing

- **Unit Tests**: Vitest with React Testing Library (91 tests)
- **E2E Tests**: Playwright for full user workflows
- **Coverage**: Comprehensive test coverage for PDF utilities

```bash
npm test           # Unit tests
npm run e2e        # E2E tests  
npm run coverage   # Test coverage report
```

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components
├── views/          # Page components for each tool
├── pdf-utils/      # Core PDF processing utilities
├── context/        # React contexts (theme, etc.)
├── styles/         # Global styles and design system
└── assets/         # Static assets

tests/
├── unit/           # Unit tests
└── e2e/            # End-to-end tests
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [pdf-lib](https://pdf-lib.js.org/) - PDF creation and modification
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF rendering and parsing
- [Lucide](https://lucide.dev/) - Beautiful icons
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS framework
