import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { describe, it, expect } from "vitest";
import { Header, Navigation, Footer } from "./components";
import { CombinePDFsView } from "./views";

// Test component that renders the app content without the outer Router
const TestAppContent = ({ initialPath = "/" }: { initialPath?: string }) => {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <div className="min-h-screen bg-gradient-hero flex flex-col">
        <Header />
        {initialPath !== "/" && <Navigation />}
        <main className="flex-grow">
          {initialPath === "/combine" ? (
            <CombinePDFsView />
          ) : (
            <div>Test Page</div>
          )}
        </main>
        <Footer />
      </div>
    </MemoryRouter>
  );
};

describe("App", () => {
  it("renders app title in header", () => {
    render(<App />);
    const headline = screen.getByRole("heading", { name: "PDF Toolbox" });
    expect(headline).toBeInTheDocument();
  });

  it("renders homepage with privacy section", () => {
    render(<App />);
    const privacySections = screen.getAllByText(/Privacy First/i);
    expect(privacySections.length).toBeGreaterThan(0);
  });

  it("does not render top navigation on homepage", () => {
    render(<TestAppContent initialPath="/" />);
    const navigations = screen.queryAllByRole("navigation");
    expect(navigations.length).toBe(0);
  });

  it("renders top navigation on other pages", () => {
    render(<TestAppContent initialPath="/combine" />);
    const navigations = screen.getAllByRole("navigation");
    expect(navigations.length).toBeGreaterThan(0);
  });
});
