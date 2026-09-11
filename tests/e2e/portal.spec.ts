import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { rowsFromCsv, filterRows } from '../../src/features/hec/data.js';
test.use({ locale: 'zh-CN' });

const officialCsv = await readFile(new URL('../../public/data/hec/v1.0/dataset.csv', import.meta.url), 'utf8');
const rows = rowsFromCsv(officialCsv);
const tinyCsv = 'Sorted Json formula,prototype,prototype_formula,DOIs\r\n"{""A"":{""C"":1}}",carbon,,';

test('home and research pages load with working images and no horizontal overflow', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const path of ['', '2026/hec/', 'about/']) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    for (const image of await page.locator('img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`${path.replaceAll('/', '-') || 'home'}.png`), fullPage: true });
  }
  expect(errors).toEqual([]);
});

test('navigation reaches research directly and the official CSV loads', async ({ page }) => {
  await page.goto('');
  await page.getByRole('link', { name: '查看成果', exact: true }).click();
  await expect(page).toHaveURL(/2026\/hec\/$/);
  await expect(page.locator('#statusText')).toContainText('717 条记录');
  await expect(page.locator('#resultsBody tr')).toHaveCount(0);
  await expect(page.locator('#exportResults')).toBeDisabled();
  await page.reload();
  await expect(page.locator('#statusText')).toContainText('717 条记录');
});

test('skip link is hidden until keyboard focus', async ({ page }) => {
  await page.goto('');
  await expect(page.locator('.skip-link')).toHaveCSS('opacity', '0');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await expect(page.locator('.skip-link')).toHaveCSS('opacity', '1');
});

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.title.startsWith('home') || testInfo.title.startsWith('navigation') || testInfo.title.startsWith('mobile navigation')) return;
  await page.goto('2026/hec/');
  await expect(page.locator('#statusText')).toContainText('717 条记录');
});

test('same-site filtering, empty results, clear and focus state', async ({ page }) => {
  const hf = page.locator('#periodicTable [data-symbol="Hf"]');
  await hf.click();
  await expect(hf).toHaveAttribute('aria-pressed', 'true');
  await expect(hf).toBeFocused();
  await expect(page.locator('#resultCount')).toContainText(`${filterRows(rows, ['Hf']).length} 条匹配记录`);
  await page.locator('#periodicTable [data-symbol="Ti"]').click();
  await expect(page.locator('#resultCount')).toContainText(`${filterRows(rows, ['Hf', 'Ti']).length} 条匹配记录`);
  await page.locator('#clearSelection').click();
  await page.locator('#periodicTable [data-symbol="Hf"]').click();
  await page.locator('#periodicTable [data-symbol="B"]').click();
  await expect(page.locator('#resultCount')).toContainText(`${filterRows(rows, ['Hf', 'B']).length} 条匹配记录`);
  await page.locator('#periodicTable [data-symbol="O"]').click();
  await page.locator('#periodicTable [data-symbol="F"]').click();
  await expect(page.locator('#resultsBody tr')).toHaveCount(0);
  await expect(page.locator('#emptyState')).toContainText('暂无符合条件');
  await page.locator('#clearSelection').click();
  await expect(page.locator('#emptyState')).toContainText('尚未选择元素');
  await expect(page.locator('#periodicTable [aria-pressed="true"]')).toHaveCount(0);
});

test('pagination preserves IDs and CSV export includes every matching record', async ({ page }) => {
  await page.locator('#periodicTable [data-symbol="O"]').click();
  const filtered = filterRows(rows, ['O']);
  await expect(page.locator('#resultsBody tr')).toHaveCount(25);
  await expect(page.locator('#resultsBody tr').first().locator('td').first()).toHaveText(String(filtered[0].id).padStart(3, '0'));
  await page.locator('#nextPage').click();
  await expect(page.locator('#resultsBody tr').first().locator('td').first()).toHaveText(String(filtered[25].id).padStart(3, '0'));
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportResults').click();
  const download = await downloadPromise;
  const downloadedRows = rowsFromCsv(await readFile((await download.path())!, 'utf8'));
  expect(downloadedRows.map(row => row.id)).toEqual(filtered.map(row => row.id));
  await page.locator('#pageSize').selectOption('50');
  await expect(page.locator('#resultsBody tr')).toHaveCount(50);
  await expect(page.locator('#pageInfo')).toContainText('1 /');
});

test('structure and full data downloads resolve under the configured base', async ({ page, request, baseURL }) => {
  await page.locator('#periodicTable [data-symbol="Hf"]').click();
  const first = page.locator('#resultsBody tr').first();
  for (const link of await first.locator('.structure-link').all()) {
    const href = (await link.getAttribute('href'))!;
    expect(new URL(href, baseURL).pathname).toContain(new URL(baseURL!).pathname + 'data/hec/v1.0/structures/');
    const response = await request.get(href);
    expect(response.status()).toBe(200);
    expect((await response.body()).length).toBeGreaterThan(100);
  }
  for (const link of await page.locator('#downloads a[download]').all()) {
    expect((await request.get((await link.getAttribute('href'))!)).status()).toBe(200);
  }
});

test('local CSV stays in the browser and never uses official structure indexes', async ({ page }) => {
  const uploads: string[] = [];
  page.on('request', request => { if (request.method() !== 'GET') uploads.push(request.url()); });
  await page.locator('#csvFile').setInputFiles({ name: 'local.csv', mimeType: 'text/csv', buffer: Buffer.from(tinyCsv) });
  await expect(page.locator('#statusText')).toContainText('本地数据 · local.csv · 1 条记录');
  await expect(page.locator('#metricRecords')).toHaveText('1');
  await expect(page.locator('#metricElements')).toHaveText('1');
  await page.locator('#periodicTable [data-symbol="C"]').click();
  await expect(page.locator('#resultsBody tr')).toHaveCount(1);
  await expect(page.locator('#resultsBody .structure-link')).toHaveCount(0);
  expect(uploads).toEqual([]);
  await page.locator('#restoreDataset').click();
  await expect(page.locator('#statusText')).toContainText('官方数据 v1.0 · 717');
  await expect(page.locator('#resultsBody tr')).toHaveCount(0);
});

test('invalid CSV reports an error and keeps the last valid data', async ({ page }) => {
  await page.locator('#periodicTable [data-symbol="C"]').click();
  const previousCount = await page.locator('#resultCount').textContent();
  await page.locator('#csvFile').setInputFiles({ name: 'broken.csv', mimeType: 'text/csv', buffer: Buffer.from('bad,column\n1,2') });
  await expect(page.locator('#loadError')).toContainText('缺少');
  await expect(page.locator('#loadError')).toContainText('已保留当前数据');
  await expect(page.locator('#resultCount')).toHaveText(previousCount!);
});

test('keyboard element search and toggle remain usable', async ({ page }) => {
  await page.locator('#elementSearch').fill('铪');
  await page.locator('#elementSearch').press('Enter');
  await expect(page.locator('#periodicTable [data-symbol="Hf"]')).toHaveAttribute('aria-pressed', 'true');
  const hf = page.locator('#periodicTable [data-symbol="Hf"]');
  await hf.focus();
  await hf.press('Space');
  await expect(hf).toHaveAttribute('aria-pressed', 'false');
});

test('default network failure is recoverable', async ({ page }) => {
  await page.route('**/dataset.csv', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.reload();
  await expect(page.locator('#loadError')).toContainText('HTTP 503');
  await page.unroute('**/dataset.csv');
  await page.locator('#restoreDataset').click();
  await expect(page.locator('#statusText')).toContainText('717 条记录');
});

test('invalid index JSON is rejected before a dataset becomes active', async ({ page }) => {
  await page.route('**/indexes.json', route => route.fulfill({ json: { cifs: {}, supercells: {} } }));
  await page.reload();
  await expect(page.locator('#loadError')).toContainText('索引文件');
  await expect(page.locator('#resultsBody tr')).toHaveCount(0);
  await page.unroute('**/indexes.json');
  await page.locator('#restoreDataset').click();
  await expect(page.locator('#statusText')).toContainText('717 条记录');
});

test('late official fetch cannot overwrite a newer local import', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/dataset.csv', async route => { await gate; await route.continue(); });
  await page.locator('#restoreDataset').click();
  await expect(page.locator('#statusText')).toContainText('正在加载');
  await page.locator('#csvFile').setInputFiles({ name: 'newer.csv', mimeType: 'text/csv', buffer: Buffer.from(tinyCsv) });
  await expect(page.locator('#statusText')).toContainText('本地数据 · newer.csv');
  const response = page.waitForResponse('**/dataset.csv');
  release();
  await response;
  await expect(page.locator('#metricRecords')).toHaveText('1');
  await expect(page.locator('#statusText')).toContainText('本地数据 · newer.csv');
  await expect(page.locator('#restoreDataset')).toBeEnabled();
});

test('citation copy gives a confirmed status', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('.copy-citation').click();
  await expect(page.locator('.copy-status')).toHaveText('已复制引用');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('High-Entropy Ceramics Database');
});

test('mobile navigation opens, closes with Escape, and reaches about', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile navigation only');
  await page.goto('');
  await page.getByRole('button', { name: '打开导航' }).click();
  await expect(page.locator('#site-nav')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#site-nav')).not.toBeVisible();
  await page.getByRole('button', { name: '打开导航' }).click();
  await page.locator('#site-nav').getByRole('link', { name: '关于研究院' }).click();
  await expect(page).toHaveURL(/about\/$/);
});
