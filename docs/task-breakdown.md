# ✅ Task Breakdown: My-PDF Toolbox

This document outlines the step-by-step development tasks for the MVP (P0) release, following the PRD and architecture guidelines.

---

## 🚧 Phase 1: Project Setup
- [ ] Initialize project with Vite + React + TypeScript
  - `npm create vite@latest my-pdf-toolbox --template react-ts`
- [ ] Configure TailwindCSS
  - `npm install -D tailwindcss postcss autoprefixer`
  - `npx tailwindcss init -p`
  - Add Tailwind setup in `tailwind.config.ts` and `index.css`
- [ ] Set up folder structure
  - `components`, `views`, `pdf-utils`, `hooks`, `context`, `assets`, `styles`
- [ ] Add ESLint + Prettier config
  - Add `.eslintrc`, `.prettierrc`, and install dependencies
- [ ] Create GitHub repo & CI placeholder
  - `.github/workflows/test.yml`

---

## 🧪 Phase 2: Tooling & Test Infrastructure
- [ ] Install Vitest + React Testing Library
- [ ] Install Playwright (headless + headed)
- [ ] Add test scripts: `npm run test`, `npm run e2e`, `npm run e2e:ui`
- [ ] Create sample unit test and E2E sanity test

---

## 🎨 Phase 3: UI Foundation
- [ ] Header with title + dark/light toggle
- [ ] Dashboard or toolbar layout
- [ ] Create reusable UI components:
  - `Button`, `Card`, `Dropzone`, `Modal`, `Toggle`
- [ ] Create routes + views for each tool
  - combine, split, compress, reorder
- [ ] Add animated drag-and-drop support

---

## 🔍 Phase 4: Core PDF Logic
- [ ] `merge.ts` – Merge multiple PDFs
- [ ] `convert.ts` – Convert images to PDF
- [ ] `split.ts` – Split PDFs into multiple PDFs (range/page)
- [ ] `split.ts` – Split PDFs into images (JPG/PNG)
- [ ] `compress.ts` – Compress PDFs with quality levels
- [ ] `reorder.ts` – Reorder pages in PDF

Each utility must be:
- A pure function
- Unit tested
- Return usable errors

---

## 🧱 Phase 5: Feature Integration
- [ ] Connect UI with PDF utilities
- [ ] Input validation + user feedback
- [ ] Render thumbnails with `pdfjs-dist`
- [ ] Enable file downloads with `file-saver`
- [ ] Zip image exports (split output) using `JSZip`

---

## 🧪 Phase 6: Testing
- [ ] Unit tests for each PDF utility
- [ ] Component tests for all UI logic
- [ ] E2E tests for each user flow:
  - Combine → Merge → Download
  - Split → Range Select → Export
  - Reorder → Preview → Export
  - Compress → Save

---

## 📦 Phase 7: Build & Distribute
- [ ] Optimize production build with Vite
- [ ] Deploy to GitHub Pages / Netlify
- [ ] Package as desktop Electron app
- [ ] Add Electron test case and toggle mode

---
