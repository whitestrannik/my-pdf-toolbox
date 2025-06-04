import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Header, Navigation, Footer } from "./components";
import {
  HomePage,
  CombinePDFsView,
  SplitPDFsView,
  CompressPDFView,
  ImagesToPDFView,
  ReorderPagesView,
} from "./views";

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <Header />
      {!isHomePage && <Navigation />}

      <main className="flex-grow">
        <div
          className={
            isHomePage
              ? "bg-transparent min-h-full pb-8"
              : "bg-white/95 min-h-full pb-8"
          }
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/combine" element={<CombinePDFsView />} />
            <Route path="/images-to-pdf" element={<ImagesToPDFView />} />
            <Route path="/split-pdfs" element={<SplitPDFsView />} />
            <Route path="/compress" element={<CompressPDFView />} />
            <Route path="/reorder" element={<ReorderPagesView />} />
          </Routes>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router basename="/my-pdf-toolbox">
      <AppContent />
    </Router>
  );
}

export default App;
