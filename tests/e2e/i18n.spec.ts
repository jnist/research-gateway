import { test, expect } from '@playwright/test';

for (const [locale, expected] of [['en-US', 'en'], ['zh-CN', 'zh-CN'], ['zh-TW', 'zh-CN'], ['fr-FR', 'en']]) {
  test.describe(`browser ${locale}`, () => {
    test.use({ locale });
    test('automatically selects the language on a direct deep link', async ({ page }) => {
      await page.goto('about/');
      await expect(page.locator('html')).toHaveAttribute('lang', expected);
      await expect(page.locator('[data-language-switch]')).toHaveValue(expected === 'en' ? 'en' : 'zh');
      await expect(page).toHaveTitle(expected === 'en' ? /About JNIST/ : /关于研究院/);
      await expect(page.locator('h1')).toHaveText(expected === 'en' ? 'Jinan Institute of Supercomputing Technology' : '济南超级计算技术研究院', { useInnerText: true });
      if (expected === 'zh-CN') {
        await page.locator('[data-language-switch]').selectOption('en');
        await page.reload();
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      }
    });
  });
}

test.describe('English interface', () => {
  test.use({ locale: 'en-US' });

  test('all pages render in English without overflow or browser errors', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const path of ['./', 'about/', 'dataset/hec/', '404.html']) {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.getByRole('combobox', { name: 'Language', exact: true })).toBeVisible();
      const text = await page.locator('main').innerText();
      expect(text).not.toMatch(/[\u3400-\u9fff]/);
      for (const image of await page.locator('img').all()) {
        await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
      await page.screenshot({ path: testInfo.outputPath(`en-${path.replaceAll('/', '-')}.png`), fullPage: true });
      if (path === 'dataset/hec/' && testInfo.project.name === 'desktop') {
        await expect(page.locator('#statusText')).toContainText('717');
        await page.locator('#periodicTable [data-symbol="Hf"]').click();
        const viewport = page.viewportSize()!;
        await page.setViewportSize({ width: viewport.width, height: 1800 });
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        const top = await page.locator('.explorer-title').boundingBox();
        const bottom = await page.locator('.selection-bar').boundingBox();
        await page.screenshot({ path: testInfo.outputPath('hec-preview-en.png'), clip: {
          x: top!.x, y: top!.y, width: top!.width, height: bottom!.y + bottom!.height - top!.y,
        } });
        await page.setViewportSize(viewport);
      }
    }
    expect(errors).toEqual([]);
  });

  test('switch persists across navigation and reload with localized metadata', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('.research-visual img')).toHaveAttribute('src', /hec-preview-en\.png$/);
    await page.locator('[data-language-switch]').selectOption('zh');
    await expect(page.locator('.research-visual img')).toHaveAttribute('src', /hec-preview\.png$/);
    await page.getByRole('link', { name: '查看成果', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    await expect(page.locator('#statusText')).toContainText('717 条记录');
    await page.reload();
    await expect(page.locator('[data-language-switch]')).toHaveValue('zh');
    await page.locator('[data-language-switch]').selectOption('en');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /A high-entropy ceramics resource/);
    await expect(page).toHaveTitle(/High-Entropy Ceramics Database/);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('language controls and element labels fit narrow and intermediate widths', async ({ page }) => {
    await page.goto('dataset/hec/');
    await expect(page.locator('#statusText')).toContainText('717');
    for (const width of [320, 720, 800, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      for (const locale of ['en', 'zh']) {
        await page.locator('[data-language-switch]').selectOption(locale);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
        expect(await page.locator('.language-switch').evaluate(node => node.getBoundingClientRect().right)).toBeLessThanOrEqual(width);
        const clipped = await page.locator('.element').evaluateAll(nodes => nodes.filter(node => {
          const label = node.querySelector('.element-name')!.getBoundingClientRect();
          const cell = node.getBoundingClientRect();
          return label.left < cell.left || label.right > cell.right || label.bottom > cell.bottom;
        }).length);
        expect(clipped).toBe(0);
      }
    }
  });

  test('switch preserves filters, pagination, downloads and local data', async ({ page }) => {
    await page.goto('dataset/hec/#explorer');
    await expect(page.locator('#statusText')).toContainText('717');
    await page.locator('#periodicTable [data-symbol="O"]').click();
    await page.locator('#nextPage').click();
    const id = await page.locator('#resultsBody tr').first().locator('td').first().textContent();
    const count = await page.locator('#resultsBody tr').count();
    const pages = await page.locator('#pageInfo').textContent();
    await page.locator('[data-language-switch]').selectOption('zh');
    await expect(page.locator('#pageInfo')).toHaveText(pages!);
    await expect(page.locator('#resultsBody tr').first().locator('td').first()).toHaveText(id!);
    await expect(page.locator('#resultsBody tr')).toHaveCount(count);
    await expect(page.locator('#periodicTable [data-symbol="O"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('[data-language-switch]').selectOption('en');
    await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeVisible();
    await expect(page.locator('#periodicTable [data-symbol="O"]')).toHaveAttribute('aria-label', /Oxygen/);
    const download = page.waitForEvent('download');
    await page.locator('#exportResults').click();
    expect((await download).suggestedFilename()).toContain('hec-v1.0-O');
    await page.locator('#csvFile').setInputFiles({ name: 'local.csv', mimeType: 'text/csv', buffer: Buffer.from('Sorted Json formula,prototype\n"{""A"":{""C"":1}}",carbon') });
    await expect(page.locator('#metricRecords')).toHaveText('1');
    await page.locator('#periodicTable [data-symbol="C"]').click();
    await page.locator('[data-language-switch]').selectOption('zh');
    await expect(page.locator('#statusText')).toContainText('本地数据 · local.csv');
    await expect(page.locator('#resultsBody tr')).toHaveCount(1);
    await expect(page.locator('#resultsBody .structure-link')).toHaveCount(0);
    await page.locator('[data-language-switch]').selectOption('en');
    await expect(page.locator('#statusText')).toContainText('local.csv');
    expect(await page.locator('#statusText').innerText()).not.toMatch(/[\u3400-\u9fff]/);
  });

  test('search accepts both element languages and translates active errors', async ({ page }) => {
    await page.goto('dataset/hec/');
    await expect(page.locator('#statusText')).toContainText('717');
    await page.locator('#elementSearch').fill('hafnium');
    await page.locator('#elementSearch').press('Enter');
    await expect(page.locator('#periodicTable [data-symbol="Hf"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#elementSearch').fill('铪');
    await page.locator('#elementSearch').press('Enter');
    await expect(page.locator('#periodicTable [data-symbol="Hf"]')).toHaveAttribute('aria-pressed', 'false');
    for (const locale of ['zh', 'en']) {
      await page.locator('[data-language-switch]').selectOption(locale);
      for (const symbol of ['O', 'N', 'S']) {
        await page.locator('#elementSearch').fill(symbol.toLowerCase());
        await page.locator('#elementSearch').press('Enter');
        await expect(page.locator(`#periodicTable [data-symbol="${symbol}"]`)).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('#selectedElements button')).toHaveCount(1);
        await page.locator('#clearSelection').click();
      }
    }
    await page.locator('#csvFile').setInputFiles({ name: 'bad.csv', mimeType: 'text/csv', buffer: Buffer.from('bad,column\n1,2') });
    await expect(page.locator('#loadError')).toBeVisible();
    expect(await page.locator('#loadError').innerText()).not.toMatch(/[\u3400-\u9fff]/);
    await page.locator('[data-language-switch]').selectOption('zh');
    await expect(page.locator('#loadError')).toContainText('缺少');
    await expect(page.locator('#loadError')).toContainText('已保留当前数据');
    await page.locator('[data-language-switch]').selectOption('en');
    expect(await page.locator('#loadError').innerText()).not.toMatch(/[\u3400-\u9fff]/);
  });
});

test('overview copy stays aligned in both languages', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'desktop') await page.setViewportSize({ width: 765, height: 787 });
  await page.goto('dataset/hec/');
  for (const locale of ['zh', 'en']) {
    await page.locator('[data-language-switch]').selectOption(locale);
    const content = page.locator(`#overview .prose [data-locale="${locale}"]`);
    await expect(content).toBeVisible();
    await expect(content.getByRole('heading', { name: locale === 'zh' ? 'CSV原始数据字段' : 'Raw CSV data fields', exact: true })).toBeVisible();
    await expect(content.locator('tbody tr td:nth-child(2)')).toHaveText(locale === 'zh' ? [
      '按 A、B 等晶格位点组织的元素及占位比例',
      '晶体原型及其名称',
      '位点的化学计量系数，用于生成可读化学式',
      '来源论文链接',
      '筛选导出时附加的原始记录编号',
    ] : [
      'Elements and occupancy fractions grouped by lattice sites such as A and B.',
      'Crystal prototype and name.',
      'Site stoichiometric coefficients used to construct a readable chemical formula.',
      'Links to source papers.',
      'Original record number added during filtered export.',
    ]);
    await expect(content.locator('p')).toHaveCount(2);
    await expect(content).not.toContainText('Frontend');
    await expect(content).not.toContainText('Computational Materials Science');
    await expect(content.locator('p').last()).toHaveText(locale === 'zh'
      ? '选择一个元素时，匹配任意位点包含该元素的记录；选择多个元素时， 要求它们同时出现在同一个晶格位点。例如首条 AlB2 原型记录中， Hf 与 Ti 同属 A 位点，可以共同匹配；Hf 与 B 分属不同位点，不会共同匹配。'
      : 'Selecting one element matches records with that element at any lattice site. Selecting several elements requires all of them to occur at the same lattice site. For example, in the first AlB2 prototype record, Hf and Ti share site A and can match together. Hf and B occupy different sites and do not match together in that record.');
    await content.locator('table').scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
    await page.screenshot({ path: testInfo.outputPath(`overview-copy-${locale}.png`) });
  }
});

test('language selection works when storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });
  });
  await page.goto('./');
  await page.locator('[data-language-switch]').selectOption('zh');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await page.locator('[data-language-switch]').selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('without JavaScript static content defaults to English', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, locale: 'zh-CN' });
  const page = await context.newPage();
  try {
    await page.goto(`${baseURL}dataset/hec/`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toHaveText('High-Entropy Ceramics Database', { useInnerText: true });
    await expect(page.getByRole('link', { name: 'Download CSV', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Download ZIP', exact: true })).toBeVisible();
    await expect(page.locator('noscript .notice')).toBeVisible();
    await expect(page.locator('noscript .notice')).toContainText('requires JavaScript', { useInnerText: true });
  } finally { await context.close(); }
});
