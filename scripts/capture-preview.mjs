import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 2000 }, deviceScaleFactor: 1 });
  await page.goto(new URL('research/hec/', process.argv[2] || 'http://127.0.0.1:4321/').href);
  await page.locator('#statusText').filter({ hasText: '717 条记录' }).waitFor();
  await page.locator('#periodicTable [data-symbol="Hf"]').click();
  await page.evaluate(() => document.fonts.ready);
  const box = await page.locator('.hec-explorer .container-wide').boundingBox();
  await page.screenshot({
    path: 'public/images/hec-preview.png',
    clip: { x: box.x, y: box.y, width: box.width, height: 790 },
  });
} finally {
  await browser.close();
}
