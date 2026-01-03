import { defineConfig } from 'playwright/test';

export default defineConfig({
  testDir: './e2e',

  use: {
    baseURL: 'http://localhost:4173',
    //baseURL: 'http://localhost:5173',
    headless: true,
  },

  webServer: {
    command: 'npm run build && npm run preview',
    //command: 'npm run dev',
    url: 'http://localhost:4173/',
    //url: 'http://localhost:5173/',
    timeout: 60 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});