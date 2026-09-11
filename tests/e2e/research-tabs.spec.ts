import { test, expect, type Page } from '@playwright/test';

async function expectActiveSection(page: Page, id: string) {
  const active = page.locator('.research-tabs a[aria-current="location"]');
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAttribute('href', `#${id}`);
  await expect(active).toHaveCSS('border-bottom-color', await active.evaluate(node => getComputedStyle(node).color));
  for (const link of await page.locator('.research-tabs a:not([aria-current])').all()) {
    await expect(link).toHaveCSS('border-bottom-color', 'rgba(0, 0, 0, 0)');
  }
}

for (const locale of ['zh-CN', 'en-US']) {
  test.describe(`research section navigation (${locale})`, () => {
    test.use({ locale });

    test('selection follows scrolling in both directions and at the page bottom', async ({ page }, testInfo) => {
      await page.goto('dataset/hec/');
      await expect(page.locator('#statusText')).toContainText('717');
      for (const id of ['explorer', 'overview', 'downloads', 'citation', 'downloads', 'overview', 'explorer']) {
        await page.locator(`#${id}`).evaluate(node => {
          const navHeight = document.querySelector('.research-tabs')!.getBoundingClientRect().height;
          window.scrollTo({ top: window.scrollY + node.getBoundingClientRect().top - navHeight, behavior: 'instant' });
        });
        await expectActiveSection(page, id);
        if (id === 'downloads') {
          await page.screenshot({ path: testInfo.outputPath(`${locale}-downloads.png`) });
        }
      }
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
      await expectActiveSection(page, 'citation');
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await expectActiveSection(page, 'explorer');
    });

    test('selects downloads when only the overview tail remains above it', async ({ page }) => {
      await page.goto('dataset/hec/');
      await expect(page.locator('#statusText')).toContainText('717');
      await page.locator('#downloads').evaluate(node => {
        window.scrollTo({ top: window.scrollY + node.getBoundingClientRect().top - 150, behavior: 'instant' });
      });
      await expectActiveSection(page, 'downloads');
    });

    test('clicking section links updates selection without changing the sticky menu height', async ({ page }) => {
      await page.goto('dataset/hec/#explorer');
      await expect(page.locator('#statusText')).toContainText('717');
      const nav = page.locator('.research-tabs');
      const height = await nav.evaluate(node => node.getBoundingClientRect().height);
      for (const id of ['overview', 'downloads', 'citation', 'explorer']) {
        await nav.locator(`a[href="#${id}"]`).click();
        await expect(page).toHaveURL(new RegExp(`#${id}$`));
        await expectActiveSection(page, id);
        expect(await nav.evaluate(node => node.getBoundingClientRect().height)).toBe(height);
      }
    });

    test('direct anchors and reload initialize the current section', async ({ page }) => {
      await page.goto('dataset/hec/#downloads');
      await expect(page.locator('#statusText')).toContainText('717');
      await expectActiveSection(page, 'downloads');
      await page.reload();
      await expect(page.locator('#statusText')).toContainText('717');
      await expectActiveSection(page, 'downloads');
    });
  });
}
