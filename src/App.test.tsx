import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { Header, Navigation, Footer } from "./components";
import {
  HomePage,
  CombinePDFsView,
  SplitPDFsView,
  CompressPDFView,
  ImagesToPDFView,
  ReorderPagesView,
} from "./views";
import { Routes, Route, useLocation } from "react-router-dom";

// Test component that renders the app content for testing
function TestAppContent() {
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

// Test wrapper for App content with proper routing setup
const TestApp = ({ initialPath = "/" }: { initialPath?: string }) => {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <TestAppContent />
    </MemoryRouter>
  );
};

describe("App", () => {
  it("renders app title in header", () => {
    render(<TestApp initialPath="/" />);
    const headline = screen.getByRole("heading", { name: "PDF Toolbox" });
    expect(headline).toBeInTheDocument();
  });

  it("renders homepage with privacy section", () => {
    render(<TestApp initialPath="/" />);
    const privacySections = screen.getAllByText(/Privacy First/i);
    expect(privacySections.length).toBeGreaterThan(0);
  });

  it("does not render top navigation on homepage", () => {
    render(<TestApp initialPath="/" />);
    const navigations = screen.queryAllByRole("navigation");
    expect(navigations.length).toBe(0);
  });

  it("renders top navigation on other pages", () => {
    render(<TestApp initialPath="/combine" />);
    const navigations = screen.getAllByRole("navigation");
    expect(navigations.length).toBeGreaterThan(0);
  });
});
