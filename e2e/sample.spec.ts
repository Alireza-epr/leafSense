import { test, expect } from 'playwright/test';

test('Sample E2E test', async ({ page }) => {
  await page.goto('https://galaxeam.com');
  await expect(page).toHaveTitle(/Galaxeam/);
});
