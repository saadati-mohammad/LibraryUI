#!/usr/bin/env node
/**
 * `npm run e2e:headed` launcher.
 *
 * Sets `PW_HEADED=1` so playwright.config.ts switches into the observable UI-QA mode
 * (visible browser, tracing, video, screenshots) and then runs the Playwright CLI in a
 * child process with inherited stdio.
 *
 * This deliberately replaces `cross-env`: no extra dependency, and it behaves the same in
 * cmd.exe, PowerShell and POSIX shells, on Windows and Linux. (`set VAR=1 && …` only works
 * in cmd, `VAR=1 …` only in POSIX shells.)
 *
 * Extra arguments are forwarded, so `npm run e2e:headed -- --project=chromium` works.
 */
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const playwrightCli = resolve(here, '..', 'node_modules', '@playwright', 'test', 'cli.js');

const child = spawn(process.execPath, [playwrightCli, 'test', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, PW_HEADED: '1' },
});

child.on('error', (error) => {
  console.error('Failed to start Playwright:', error);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
