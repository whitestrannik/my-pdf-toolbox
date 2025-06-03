# ✅ Task Breakdown: My-PDF Toolbox

This document outlines the step-by-step development tasks for the MVP (P0) release, following the PRD and architecture guidelines.

---

## ✅ Phase 1: Project Setup *(COMPLETED)*
- [x] Initialize project with Vite + React + TypeScript
  - `npm create vite@latest my-pdf-toolbox --template react-ts`
- [x] Configure TailwindCSS
  - `npm install -D tailwindcss postcss autoprefixer`
  - `npx tailwindcss init -p`
  - Add Tailwind setup in `tailwind.config.ts` and `index.css`
- [x] Set up folder structure
  - `components`, `views`, `pdf-utils`, `hooks`, `context`, `assets`, `styles`
- [x] Add ESLint + Prettier config
  - Add `.eslintrc`, `.prettierrc`, and install dependencies
- [x] Create GitHub repo & CI placeholder
  - `.github/workflows/test.yml`

**Completed:** Cleaned up default Vite files, set up project structure, configured ESLint/Prettier integration, created CI workflow.

---

## ✅ Phase 2: Tooling & Test Infrastructure *(COMPLETED)*
- [x] Install Vitest + React Testing Library
- [x] Install Playwright (headless + headed)
- [x] Add test scripts: `npm run test`, `npm run e2e`, `npm run e2e:ui`
- [x] Create sample unit test and E2E sanity test

**Completed:** 
- Upgraded to Vitest 3.2.0 with React Testing Library
- Configured Playwright for E2E testing
- Fixed memory issues and test execution
- All tests passing: 2 unit tests, 1 E2E test
- Proper test separation (Vitest for unit, Playwright for E2E)

---

## ✅ Phase 3: UI Foundation *(COMPLETED)*
- [x] Header with title + dark/light toggle
- [x] Dashboard or toolbar layout
- [x] Create reusable UI components:
  - `Button`, `Card`, `Dropzone`, `Modal`, `Toggle`
- [x] Create routes + views for each tool
  - combine, split, compress, reorder
- [x] Add animated drag-and-drop support

**Completed:**
- **Core Components:** Button (variants, sizes, loading), Card, Toggle, Dropzone, Modal
- **Layout:** Header with branding and theme toggle, Navigation with tool tabs
- **Theme System:** Complete dark/light mode with localStorage and system detection
- **Routing:** React Router setup with all tool routes and placeholder views
- **Homepage:** Professional dashboard with tool cards and privacy messaging
- **Testing:** Updated unit tests (3 passing) and E2E tests (3 passing)
- **Design:** Modern TailwindCSS design system with sky blue theme and animations

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
