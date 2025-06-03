import { test, expect } from "@playwright/test";

test.describe("App", () => {
  test("should display the homepage with header and navigation", async ({
    page,
  }) => {
    await page.goto("/");

    // Check for the header with app title
    const headerTitle = page.locator("header h1");
    await expect(headerTitle).toHaveText("PDF Toolbox");

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

    // Check for Privacy First indicator
    const privacyIndicator = page.locator("text=Privacy First");
    await expect(privacyIndicator).toBeVisible();
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

  test("should display all PDF tools", async ({ page }) => {
    await page.goto("/");

    // Check that all tool cards are visible
    await expect(page.locator("text=Combine PDFs")).toBeVisible();
    await expect(page.locator("text=Split PDFs")).toBeVisible();
    await expect(page.locator("text=Compress PDFs")).toBeVisible();
    await expect(page.locator("text=Images to PDF")).toBeVisible();
    await expect(page.locator("text=Reorder Pages")).toBeVisible();

    // Check for privacy benefits
    await expect(page.locator("text=Lightning Fast")).toBeVisible();
    await expect(page.locator("text=Privacy First")).toBeVisible();
    await expect(page.locator("text=Always Available")).toBeVisible();
  });
});
