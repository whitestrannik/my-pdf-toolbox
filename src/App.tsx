import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Header, Navigation } from './components';
import { HomePage, CombinePDFsView, PlaceholderView } from './views';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Header />
          <Navigation />
          
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/combine" element={<CombinePDFsView />} />
              <Route 
                path="/images-to-pdf" 
                element={
                  <PlaceholderView 
                    title="Images to PDF"
                    icon="🖼️"
                    description="Convert multiple images into a single PDF file"
                  />
                } 
              />
              <Route 
                path="/split-pdfs" 
                element={
                  <PlaceholderView 
                    title="Split to PDFs"
                    icon="✂️"
                    description="Split a PDF into multiple separate documents"
                  />
                } 
              />
              <Route 
                path="/split-images" 
                element={
                  <PlaceholderView 
                    title="Split to Images"
                    icon="🖨️"
                    description="Convert PDF pages to individual image files"
                  />
                } 
              />
              <Route 
                path="/compress" 
                element={
                  <PlaceholderView 
                    title="Compress PDF"
                    icon="🗜️"
                    description="Reduce PDF file size while maintaining quality"
                  />
                } 
              />
              <Route 
                path="/reorder" 
                element={
                  <PlaceholderView 
                    title="Reorder Pages"
                    icon="🔃"
                    description="Rearrange pages in your PDF using drag and drop"
                  />
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;