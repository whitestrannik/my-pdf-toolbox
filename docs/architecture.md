# 🧠 Architecture & Implementation Guide: My-PDF Toolbox

This document serves as a high-level and low-level technical blueprint for developers (human or AI) contributing to the project.

## 🛠️ Tech Stack

### Core

    • Framework: ReactJS (with Vite)
    • Language: TypeScript
    • Styling: TailwindCSS
    • PDF Libraries:
        ○ pdf-lib for PDF generation, manipulation, compression
        ○ pdfjs-dist for rendering PDF pages to canvas
    • Drag and Drop: react-beautiful-dnd
    • Download & Blob Support: file-saver, blob-util

### Testing

    • Unit Tests: Vitest + Testing Library
    • End-to-End Tests: Playwright (with headless support)

### Packaging & Hosting

    • Web: GitHub Pages / Vercel / Netlify
    • Desktop: Electron (via electron-builder)

## 🧱 Architecture Overview

### App Layers

App
├── UI Components (presentational)
├── Views (feature pages)
├── Core Utilities (/pdf-utils)
│ ├── merge.ts
│ ├── split.ts
│ ├── compress.ts
│ ├── reorder.ts
│ └── convert.ts
├── State Management (minimal, likely useContext or Redux if needed)
├── Hooks (custom UI logic)
└── Static Asset Handling (uploads, images, zipping)

### Core Principles

    • Separation of Concerns: Keep PDF logic and UI fully decoupled
    • Testability: All core logic and UI components must have unit tests
    • Accessibility: Use semantic HTML and focus indicators
    • Responsiveness: Tailwind breakpoints for mobile ↔ desktop views
    • Dark/Light Mode: Use Tailwind’s theming support

### ✅ Best Practices

#### React + TypeScript

    • Use React.FC<Props> with defined prop types
    • Prefer composition over inheritance
    • Use useCallback, useMemo, and lazy loading for performance
    • Use custom hooks for reusable logic

#### TailwindCSS

    • Use @apply in component-level .css or tailwind.config.ts for reuse
    • Limit className clutter with utility-first design

#### PDF Processing

    • Core logic must:
        ○ Take inputs (File or Uint8Array)
        ○ Output result as Blob or ArrayBuffer
        ○ Return clear error messages on failure
    • Each operation is a pure function in /pdf-utils and covered by unit tests

#### Component Design

    • Keep dumb/presentational components pure
    • Separate container logic if needed
    • Use react-beautiful-dnd only for reorder tool

### 🔬 Testing Strategy

#### Unit Tests

    • Location: /tests/unit/ or colocated near components/utils
    • Framework: vitest
    • Coverage target: 90%+ for all pdf-utils logic

#### Component Tests

    • Use @testing-library/react
    • Focus on interactive behavior (buttons, dropdowns, file inputs)

#### End-to-End Tests

    • Framework: Playwright
    • Headless by default; support npm run e2e and npm run e2e:ui
    • Sample test cases:
        ○ Upload and merge PDFs
        ○ Reorder thumbnails and export
        ○ Extract custom page range and verify download
        ○ Compress and validate output file size

## 📁 Folder Structure

Here is the recommended folder structure for My-PDF Toolbox:
my-pdf-toolbox/
├── public/ # Static assets
├── src/
│ ├── components/ # Reusable UI components (buttons, inputs, modals)
│ ├── views/ # Page-level feature views (one per tool)
│ ├── pdf-utils/ # Core logic for PDF operations (pure functions)
│ │ ├── merge.ts
│ │ ├── split.ts
│ │ ├── compress.ts
│ │ ├── reorder.ts
│ │ └── convert.ts
│ ├── hooks/ # Custom React hooks (file uploads, tool logic)
│ ├── context/ # Global context providers (if needed)
│ ├── assets/ # Logo, icons, example files
│ ├── styles/ # Tailwind extensions, animations
│ ├── App.tsx
│ └── main.tsx
├── tests/
│ ├── unit/ # Unit tests for utils and components
│ └── e2e/ # End-to-end tests (Playwright)
├── electron/ # Electron entry points and packaging scripts (optional)
├── playwright.config.ts
├── tailwind.config.ts
├── vite.config.ts
└── package.json

## 🚀 CI/Automation Ready

    • CI-friendly structure: one-line commands for tests
    • Optional GitHub Actions pipeline
    • Future: Add workflow for publishing Electron builds
