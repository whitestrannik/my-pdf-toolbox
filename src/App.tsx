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
  SelectAreaView,
} from "./views";

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <Header />
      {!isHomePage && <Navigation />}

      <main className="flex-grow">
        <div className="bg-transparent min-h-full pb-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/combine" element={<CombinePDFsView />} />
            <Route path="/images-to-pdf" element={<ImagesToPDFView />} />
            <Route path="/split-pdfs" element={<SplitPDFsView />} />
            <Route path="/compress" element={<CompressPDFView />} />
            <Route path="/reorder" element={<ReorderPagesView />} />
            <Route path="/select-area" element={<SelectAreaView />} />
          </Routes>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router basename="/">
      <AppContent />
    </Router>
  );
}

export default App;
