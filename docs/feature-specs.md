# 📘 Feature Specifications: My-PDF Toolbox

This document provides detailed specifications for each feature listed in the PRD.

## 🔗 1. Combine PDFs

Description:
Allow users to upload multiple PDF files and merge them into a single document.
Functional Requirements:
• Upload multiple PDFs via file picker or drag-and-drop
• Display file list with file names and sizes
• Allow reordering before merging
• Button to trigger merge
• Output: single downloadable PDF file
UX Sketch:
+-------------------------------------+
| [Upload PDFs] [Merge & Download] |
+-------------------------------------+
| 📄 file1.pdf ⠿⠿ drag handle |
| 📄 file2.pdf ⠿⠿ |
| 📄 file3.pdf ⠿⠿ |
+-------------------------------------+
Edge Cases:
• Files with different page sizes or orientations
• Non-PDF files rejected

## 🖼️ 2. Images to PDF

Description:
Users can upload multiple image files and convert them into a single multi-page PDF.
Functional Requirements:
• Upload PNG/JPG images via drag-and-drop or file picker
• Show thumbnails of uploaded images
• Allow reordering images
• Convert images into single PDF (one per page)
• Download button for result
UX Sketch:
+------------------------------------+
| [Upload Images] [Create PDF] |
+------------------------------------+
| 🖼️ img1.jpg ⠿⠿ drag handle |
| 🖼️ img2.png ⠿⠿ |
| 🖼️ img3.jpg ⠿⠿ |
+------------------------------------+
Edge Cases:
• Large image files (may need downscaling)
• Different aspect ratios

## ✂️ 3. Split PDF into Multiple PDFs

Description:
Users can split a PDF by range, fixed number of pages, or manual selection. This includes the ability to extract a specific page or a custom range (e.g., extract page 5 only, or pages 2–4).
Functional Requirements:
• Upload single PDF
• Preview pages as thumbnails
• Choose split method:
○ Fixed page ranges
○ Every N pages
○ Manual selection (checkboxes or range input)
○ Custom extract: enter start–end range or a single page number
• Generate multiple PDF outputs (for splits) or single output (for extract)
• Allow download of all or individual parts
UX Sketch:
+-------------------------------------------+
| [Upload PDF] |
| Split By: (•) Every N pages [ 3 ] |
| ( ) Custom Ranges [1-3, 4-6] |
| ( ) Manual Select [x] [x] [x] |
| ( ) Extract Range: [2-4] |
| [Split / Extract] |
+-------------------------------------------+
| 📄 Page 1 | 📄 Page 2 | 📄 Page 3 ... |
+-------------------------------------------+
Edge Cases:
• Invalid range inputs
• Very large PDFs

## 🖨️ 4. Split PDF into Images

Description:
Converts each page of a PDF into separate image files (JPG or PNG). Also supports extracting and converting a user-defined page or page range (e.g., only page 5, or pages 2–4).
Functional Requirements:
• Upload PDF
• Show preview of total pages
• Select output format: JPG / PNG
• Optionally enter page range to export (e.g., 2–4 or 5 only)
• Button to generate and download
• Option to zip all images for easier download
UX Sketch:
+----------------------------------------+
| [Upload PDF] |
| Export format: (•) JPG ( ) PNG |
| Export range: [2–4] |
| [Export Images] |
+----------------------------------------+
| 📄 Page 1 Preview 📄 Page 2 Preview...|
+----------------------------------------+
Edge Cases:
• Very large page counts → offer page range or batch processing

## 🗜️ 5. Compress PDF

Description:
Reduce the size of a PDF file by optimizing embedded images and stripping unnecessary data.
Functional Requirements:
• Upload PDF
• Select compression level: Low / Medium / High
• Preview estimated output size (if possible)
• Download compressed PDF
UX Sketch:
+-----------------------------------+
| [Upload PDF] |
| Compression: (•) Medium |
| [Compress & Download] |
+-----------------------------------+

Edge Cases:
• Compression may not be effective on already optimized files
• Visual difference in image quality (warn user)

## 🔃 6. Reorder Pages with Thumbnails

Description:
Allow users to visually reorder PDF pages using drag-and-drop thumbnails.
Functional Requirements:
• Upload PDF
• Render all pages as thumbnails
• Enable drag-and-drop reordering (via react-beautiful-dnd)
• Preview reordering in real-time
• Generate new PDF with updated order
• Download button
UX Sketch:
+----------------------------------------+
| [Upload PDF] [Rebuild & Download] |
+----------------------------------------+
| 🖼️ Page 1 ⠿⠿ 🖼️ Page 2 ⠿⠿ 🖼️ Page 3 ⠿⠿ |
+----------------------------------------+
Edge Cases:
• PDFs with many pages (add scroll/pagination)
• Very wide or tall pages
