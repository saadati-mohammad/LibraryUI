import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end configuration.
 *
 * The backend must already be running on :8080 (with APP_ADMIN_PASSWORD / JWT_SECRET set);
 * the config starts the Angular dev server on :4200. The frontend talks to the backend via
 * environment.apiUrl and the backend CORS allows http://localhost:4200.
 *
 * UI QA mode: set PW_HEADED=1 (and optionally PW_SLOWMO=250) to run a real, visible browser
 * with tracing, video and screenshots so exploratory QA is observable and evidenced. In CI
 * (no PW_HEADED) the run stays headless with lighter artifacts.
 */
const headed = process.env.PW_HEADED === '1';
const slowMo = Number(process.env.PW_SLOWMO ?? (headed ? '200' : '0'));

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4200',
    headless: !headed,
    launchOptions: { slowMo },
    trace: headed ? 'on' : 'retain-on-failure',
    video: headed ? 'on' : 'retain-on-failure',
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
