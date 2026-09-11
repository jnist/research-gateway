import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const domain = readFileSync(new URL('../../CNAME', import.meta.url), 'utf8').trim();
const site = process.env.SITE_URL || `https://${domain}`;
const base = process.env.SITE_BASE || '/';

test('deployment uses the correct canonical origin and resource paths', async ({ page, request }) => {
  if (new URL(site).hostname === domain) expect(base).toBe('/');
  for (const path of ['./', 'about/', '2026/hec/']) {
    await page.goto(path);
    const canonical = new URL(path, new URL(base, site)).href;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
    await expect(page.locator('.brand')).toHaveAttribute('href', base);
    const paths = await page.locator('a[href], link[href], img[src], script[src]').evaluateAll(nodes =>
      nodes.map(node => node.getAttribute('href') || node.getAttribute('src') || '').filter(url => url.startsWith('/')),
    );
    for (const url of paths) {
      expect(url.startsWith(base)).toBe(true);
      if (new URL(site).hostname === domain) expect(url).not.toMatch(/^\/research-gateway(?:\/|$)/);
    }
    for (const url of await page.locator('link[rel="stylesheet"], script[src]').evaluateAll(nodes =>
      nodes.map(node => node.getAttribute('href') || node.getAttribute('src') || ''),
    )) expect((await request.get(url)).status()).toBe(200);
  }
});
