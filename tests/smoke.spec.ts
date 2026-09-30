import { test, expect } from '@playwright/test';

test('playwright funciona', async ({ page }) => {
  await page.setContent('<h1>hola</h1>');
  await expect(page.locator('h1')).toHaveText('hola');
});
