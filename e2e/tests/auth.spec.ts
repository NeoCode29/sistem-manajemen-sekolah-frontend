import { test, expect } from '@playwright/test';

test('has expected title or element', async ({ page }) => {
  // Asumsi aplikasi frontend jalan di localhost:5173
  await page.goto('/');
  // Cek apakah halaman dirender tanpa blank screen
  await expect(page.locator('body')).toBeVisible();
});
