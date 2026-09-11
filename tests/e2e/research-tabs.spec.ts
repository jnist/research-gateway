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

    test('back to top appears only when sticky and preserves the menu layout', async ({ page }, testInfo) => {
      await page.goto('dataset/hec/');
      await expect(page.locator('#statusText')).toContainText('717');
      const nav = page.locator('.research-tabs');
      const button = nav.getByRole('button', { name: locale === 'zh-CN' ? '回到顶部' : 'Back to top', includeHidden: true });
      await expect(button).toBeHidden();
      const height = await nav.evaluate(node => node.getBoundingClientRect().height);
      const linkPositions = await nav.locator('a').evaluateAll(links => links.map(link => link.getBoundingClientRect().x));
      const threshold = await nav.evaluate(node => node.getBoundingClientRect().top + window.scrollY);
      await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), threshold - 2);
      await expect(button).toBeHidden();
      await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), Math.ceil(threshold));
      await expect(button).toBeVisible();
      expect(await nav.evaluate(node => node.getBoundingClientRect().height)).toBe(height);
      expect(await nav.locator('a').evaluateAll(links => links.map(link => link.getBoundingClientRect().x))).toEqual(linkPositions);
      const buttonBox = (await button.boundingBox())!;
      const lastLinkBox = (await nav.locator('a').last().boundingBox())!;
      expect(buttonBox.x).toBeGreaterThanOrEqual(lastLinkBox.x + lastLinkBox.width);
      expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(page.viewportSize()!.width);
      await page.screenshot({ path: testInfo.outputPath(`${locale}-back-to-top.png`) });
      await button.click();
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
      await expect(button).toBeHidden();
      await expectActiveSection(page, 'explorer');
    });

    test('back to top works from a direct anchor with reduced motion and keyboard', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('dataset/hec/#downloads');
      await expect(page.locator('#statusText')).toContainText('717');
      const button = page.locator('.research-tabs').getByRole('button', { name: locale === 'zh-CN' ? '回到顶部' : 'Back to top' });
      await expect(button).toBeVisible();
      await button.focus();
      await page.keyboard.press('Enter');
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
      await expect(button).toBeHidden();
    });
  });
}
