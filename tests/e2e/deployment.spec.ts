import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const domain = readFileSync(new URL('../../CNAME', import.meta.url), 'utf8').trim();
const site = process.env.SITE_URL || `https://${domain}`;
const base = process.env.SITE_BASE || '/';

test('deployment uses the correct canonical origin and resource paths', async ({ page, request }) => {
  if (new URL(site).hostname === domain) expect(base).toBe('/');
  for (const path of ['./', 'about/', 'dataset/hec/']) {
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

test('HEC is available under dataset with or without a trailing slash', async ({ page }) => {
  for (const path of ['dataset/hec', 'dataset/hec/']) {
    await page.goto(path);
    await expect(page.locator('#statusText')).toContainText('717');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href', new URL('dataset/hec/', new URL(base, site)).href,
    );
  }
});

test('the former year URL redirects to the dataset and preserves query and section anchors', async ({ page }) => {
  await page.goto('2026/hec/?source=bookmark#downloads');
  await expect(page).toHaveURL(/\/dataset\/hec\/\?source=bookmark#downloads$/);
  await expect(page.locator('#statusText')).toContainText('717');
  await expect(page.locator('.research-tabs a[aria-current="location"]')).toHaveAttribute('href', '#downloads');
});

test('the former year URL remains usable without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}2026/hec/`);
    await expect(page).toHaveURL(/\/dataset\/hec\/$/);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Download CSV', exact: true })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('every homepage research entry uses the dataset URL', async ({ page }) => {
  await page.goto('./');
  const links = page.locator('.research-item a');
  await expect(links).toHaveCount(4);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute('href', new RegExp(`^${base}dataset/hec/(?:#explorer)?$`));
  }
});
