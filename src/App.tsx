import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Header, Navigation, Footer } from './components';
import { HomePage, CombinePDFsView, SplitPDFsView, CompressPDFView, ImagesToPDFView, ReorderPagesView } from './views';

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      {!isHomePage && <Navigation />}
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/combine" element={<CombinePDFsView />} />
          <Route path="/images-to-pdf" element={<ImagesToPDFView />} />
          <Route path="/split-pdfs" element={<SplitPDFsView />} />
          <Route path="/compress" element={<CompressPDFView />} />
          <Route path="/reorder" element={<ReorderPagesView />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;