import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Header, Navigation } from './components';
import { HomePage, CombinePDFsView, SplitPDFsView, CompressPDFView, ImagesToPDFView, ReorderPagesView, PlaceholderView } from './views';

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
              <Route path="/images-to-pdf" element={<ImagesToPDFView />} />
              <Route path="/split-pdfs" element={<SplitPDFsView />} />
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
              <Route path="/compress" element={<CompressPDFView />} />
              <Route path="/reorder" element={<ReorderPagesView />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;