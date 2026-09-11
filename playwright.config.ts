import { defineConfig } from '@playwright/test';

const base = process.env.SITE_BASE || '/';
const normalizedBase = `/${base.replace(/^\/+|\/+$/g, '')}${base === '/' ? '' : '/'}`;
const port = 4399;
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${port}${normalizedBase}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: 'node scripts/test-preview.mjs',
    url: `http://127.0.0.1:${port}${normalizedBase}`,
    reuseExistingServer: false,
    timeout: 60000,
  },
});
