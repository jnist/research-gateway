import { expect, test } from '@playwright/test';
test.use({ locale: 'zh-CN' });

for (const route of ['', 'about/', 'research/hec/']) {
  test(`footer registration links on /${route}`, async ({ page }, testInfo) => {
    await page.goto(route || './');
    const footer = page.locator('.site-footer');
    const compliance = footer.getByRole('navigation', { name: '网站备案信息' });
    await footer.scrollIntoViewIfNeeded();
    const links = [
      ['鲁ICP备2020050080号', 'https://beian.miit.gov.cn/'],
      ['鲁公网安备 37011202001894号', 'http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=37011202001894'],
    ];
    for (const [name, url] of links) {
      const link = compliance.getByRole('link', { name, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', url);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      const bounds = await link.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
    if (route === 'about/') {
      await expect(page.getByText('本门户集中展示科研成果', { exact: false })).toHaveCount(0);
      await footer.screenshot({ path: testInfo.outputPath('footer.png') });
    }
    if (route === 'research/hec/') {
      await expect(page.locator('#overview')).not.toContainText('未选择元素时不显示结果');
      await expect(page.locator('#overview')).not.toContainText('本地文件仅在浏览器中读取');
      await expect(page.locator('#citation .version-note')).toHaveCount(0);
      await expect(page.locator('#citation')).not.toContainText('引用信息以正式发表版本为准');
    }
  });
}
