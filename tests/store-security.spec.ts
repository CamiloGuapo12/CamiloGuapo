import { test, expect } from '@playwright/test';
import path from 'path';

const SITE = process.env.STORE_DIR || path.resolve(__dirname, '../armys-home-and-more');
const XSS = '<img src=x onerror="window.__pwned=1">Hoodie';

test('el catálogo escapa HTML de productos y no ejecuta scripts', async ({ page }) => {
  await page.route('https://*.supabase.co/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/rest/v1/products')) {
      return route.fulfill({
        json: [{ id: 1, name: XSS, category: 'Ropa', price: 750, stock: 5, emoji: '<b>x</b>',
                 description: '<script>window.__pwned=1</script>desc', active: true,
                 image_url: 'https://evil.example/x.png' }],
      });
    }
    if (url.includes('/auth/v1/')) return route.fulfill({ json: { session: null } });
    return route.fulfill({ json: [] });
  });
  await page.goto('file://' + SITE + '/index.html');
  await expect(page.locator('.cd h3')).toHaveCount(1);
  await expect(page.locator('.cd h3')).toHaveText(XSS);      // literal, como texto
  await expect(page.locator('.cd img[src*="evil.example"]')).toHaveCount(0); // URL externa rechazada
  await expect(page.locator('.cd .im b')).toHaveCount(0);     // emoji no inyecta HTML
  expect(await page.evaluate(() => (window as any).__pwned)).toBeUndefined();
});
