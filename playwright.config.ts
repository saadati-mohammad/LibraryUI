import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end configuration.
 *
 * The backend must already be running on :8079 (with APP_ADMIN_PASSWORD / JWT_SECRET set);
 * the config starts the Angular dev server on :4200 with the `proxy.conf.json` proxy, so
 * the browser only ever talks to :4200 and `/api` is forwarded to the backend. The
 * frontend therefore uses same-origin relative URLs (environment.apiUrl === '/api').
 *
 * UI QA mode: set PW_HEADED=1 (and optionally PW_SLOWMO=250) to run a real, visible browser
 * with tracing, video and screenshots so exploratory QA is observable and evidenced. In CI
 * (no PW_HEADED) the run stays headless with lighter artifacts. `npm run e2e:headed` sets
 * the variable for you.
 *
 * `noPropertyAccessFromIndexSignature` is on, so `process.env` members are read with
 * bracket notation.
 */
const headed = process.env['PW_HEADED'] === '1';
const slowMo = Number(process.env['PW_SLOWMO'] ?? (headed ? '200' : '0'));
const chromiumExecutable = process.env['PW_CHROMIUM_EXECUTABLE'];

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4200',
    headless: !headed,
    launchOptions: { slowMo, ...(chromiumExecutable ? { executablePath: chromiumExecutable } : {}) },
    trace: headed ? 'on' : 'retain-on-failure',
    // Avoid requiring a separately downloaded ffmpeg binary in headless CI/dev runs.
    video: headed ? 'on' : 'off',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    // The proxy config is required: `environment.apiUrl` is the relative '/api', so
    // without it every API call from the E2E runs would 404 against the dev server.
    command:
      'node ./node_modules/@angular/cli/bin/ng.js serve --port 4200 --proxy-config proxy.conf.json',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
