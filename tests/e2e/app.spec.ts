import { test, expect } from '@playwright/test';

test.describe('App', () => {
  test('should display the main page with title and coming soon message', async ({ page }) => {
    await page.goto('/');

    // Check for the main title
    const title = page.locator('h1');
    await expect(title).toHaveText('My-PDF Toolbox');

    // Check for the coming soon message
    const comingSoonMessage = page.locator('p');
    await expect(comingSoonMessage).toHaveText('Coming soon!');
  });
}); 