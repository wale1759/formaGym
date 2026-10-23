import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', workers: 1, timeout: 60000, expect: { timeout: 10000 },
  use: { channel: 'chrome', baseURL: 'http://127.0.0.1:5174', headless: true, viewport: { width: 1440, height: 1000 } },
  webServer: { command: 'npm run dev -- --port 5174 --strictPort', url: 'http://127.0.0.1:5174', reuseExistingServer: !process.env.CI },
});
