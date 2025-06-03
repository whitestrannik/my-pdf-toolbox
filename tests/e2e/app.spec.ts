import { test, expect } from "@playwright/test";

test.describe("App", () => {
  test("should display the homepage with header and navigation", async ({
    page,
  }) => {
    await page.goto("/");

    // Check for the header with app title
    const headerTitle = page.locator("header h1");
    await expect(headerTitle).toHaveText("My-PDF Toolbox");

    // Check for the main homepage title
    const pageTitle = page.locator("h1", {
      hasText: "PDF Tools at Your Fingertips",
    });
    await expect(pageTitle).toBeVisible();

    // Check for navigation
    const navigation = page.locator("nav");
    await expect(navigation).toBeVisible();

    // Check that tool cards are displayed
    const combineCard = page.locator("text=Combine PDFs").first();
    await expect(combineCard).toBeVisible();
  });

  test("should navigate to combine PDFs page", async ({ page }) => {
    await page.goto("/");

    // Click on the Combine PDFs navigation link
    await page.locator("nav a", { hasText: "Combine PDFs" }).click();

    // Check that we're on the correct page
    await expect(page.locator("h1", { hasText: "Combine PDFs" })).toBeVisible();

    // Check for the dropzone
    await expect(page.locator("text=Drop PDF files here")).toBeVisible();
  });

  test("should toggle dark mode", async ({ page }) => {
    await page.goto("/");

    // Check initial light mode (look for light theme indicator)
    const themeToggle = page.locator("label", { hasText: "☀️" });
    await expect(themeToggle).toBeVisible();

    // Click the toggle to switch to dark mode
    await themeToggle.click();

    // Check that dark mode is applied (the HTML should have 'dark' class)
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);
  });
});
