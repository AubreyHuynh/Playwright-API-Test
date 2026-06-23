import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

// Node.js 22.7+ passes context.conditions as SafeSet (not Array) in module.registerHooks.
// Force the async ESM loader which uses the older API where conditions is an Array.
// Remove when Playwright fixes this upstream: https://github.com/microsoft/playwright/issues
process.env.PLAYWRIGHT_FORCE_ASYNC_LOADER ??= 'true';

const ENV = (process.env.ENV ?? 'dev').toUpperCase();
const BASE_URL = process.env[`${ENV}_BASE_URL`];

if (!BASE_URL) {
  throw new Error(`Missing env var: ${ENV}_BASE_URL — copy .env.example to .env and fill in values`);
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'api',
    },
  ],
});
