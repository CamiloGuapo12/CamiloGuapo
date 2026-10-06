import { test, expect } from '@playwright/test';

test('page boots under the CSP with the bundled supabase-js', async ({ page }) => {
  const cspViolations: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', m => { if (/Content Security Policy/i.test(m.text())) cspViolations.push(m.text()); });
  page.on('pageerror', e => pageErrors.push(e.message));

  await page.goto('/index.html');
  await expect(page).toHaveTitle(/LiveTracker/);

  expect(await page.evaluate(() => typeof (window as any).supabase?.createClient)).toBe('function');
  expect(cspViolations).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test('esc() neutralises markup and quote breakouts', async ({ page }) => {
  await page.goto('/index.html');
  const payload = `"><img src=x onerror=window.__pwned=1>'`;
  const html = await page.evaluate(p => (window as any).esc(p), payload);
  expect(html).not.toContain('<');
  expect(html).not.toContain('"');
  const js = await page.evaluate(p => (window as any).escJs(p), `a'b\\c`);
  expect(js).toContain('\\');
});

test('a hostile display name does not execute script when rendered', async ({ page }) => {
  await page.goto('/index.html');
  const executed = await page.evaluate(() => {
    const name = `"><img src=x onerror="window.__pwned=1">`;
    const box = document.createElement('div');
    box.innerHTML = `<h3>${(window as any).esc(name)}</h3><button title="Gestionar perfil de ${(window as any).esc(name)}">x</button>`;
    document.body.appendChild(box);
    return new Promise(r => setTimeout(() => r((window as any).__pwned === 1), 300));
  });
  expect(executed).toBe(false);
});
