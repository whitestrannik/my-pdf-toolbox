# 📄 PRD: My-PDF Toolbox

## 🎯 Goal
Build a browser-based, fully client-side web application that allows users to perform common PDF file manipulations directly in the browser. All operations should work locally without requiring server-side processing.

## 🧩 Scope (P0 Features)

### 1. Combine PDFs
- Upload multiple PDF files
- Merge them into a single PDF
- Allow reordering before merging

### 2. Images to PDF
- Upload multiple image files (PNG, JPG)
- Convert them to a multi-page PDF in specified order

### 3. Split PDF into multiple PDFs
- Input: single PDF
- Allow user to:
  - Split by fixed ranges (e.g., every N pages)
  - Manually enter custom ranges
  - Visually select pages to extract
  - Extract a specific page or custom range (e.g., page 5 or pages 2–4)

### 4. Split PDF into images
- Input: single PDF
- Output: each page rendered as a JPG or PNG image (user can select format)
- Support selecting a custom page or page range for image export (e.g., only page 5 or pages 2–4)

### 5. Compress PDF
- Reduce PDF file size by:
  - Downscaling images
  - Removing unused objects and metadata
- Provide compression level options if feasible (low/medium/high)

### 6. Reorder Pages with Thumbnails
- Render visual thumbnails of all PDF pages
- Allow drag-and-drop to change order
- Rebuild and download the reordered PDF

## 🛠 Technical Requirements

### Frontend
- **ReactJS** with **TypeScript**
- **TailwindCSS** for styling
- **No backend** (fully static deployment)

### Libraries
- `pdf-lib`: For editing, merging, compressing, and generating PDFs
- `pdfjs-dist`: For rendering PDF pages into canvas (thumbnails)
- `react-beautiful-dnd`: For drag-and-drop interactions
- `file-saver` and `blob-util`: For downloads and file handling

### Hosting & Distribution Options
- GitHub Pages for web version
- Vercel or Netlify (preferred for speed and flexibility)
- **Electron-based packaging to create a cross-platform executable** (Windows, macOS, Linux) for local desktop usage

## 📦 Non-Goals
- No server-side processing
- No OCR or scanned-text recognition (future feature)
- No account system or file persistence

## 📈 Success Criteria
- All features work offline and client-side
- Smooth drag-and-drop UI for page reordering
- Intuitive file inputs and outputs for all operations
- Works reliably for files up to ~100MB (with progressive performance tuning)
- Available both as a web app and standalone desktop executable

## 🧭 Future Features (Post-P0)
- OCR support (Tesseract.js)
- Password protection/removal
- Annotation (highlight, text, shapes)
- Google Drive / Dropbox integration
- Batch processing for multiple files

## 🖥 Target Users
- Individuals who need quick PDF manipulations without uploading sensitive documents to external servers
- Students, office workers, developers, and privacy-conscious users