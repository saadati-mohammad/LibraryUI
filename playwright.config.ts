import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end configuration. Assumes the backend is already running on :8080
 * (with APP_ADMIN_PASSWORD / JWT_SECRET set) and starts the Angular dev server on :4200.
 * The frontend talks to the backend directly via environment.apiUrl, and the backend's
 * CORS allows http://localhost:4200.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'off',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'node ./node_modules/@angular/cli/bin/ng.js serve --port 4200',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
