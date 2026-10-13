import { test, expect } from '@playwright/test';

const sessionId = '3b241101-e2bb-4255-8caf-4136c566a962';
const pairingToken = 'mB6X0yPZP9p6rYq3h9VBRYqaM6tDXX7V_VB8aD2_8xI';

test.use({ serviceWorkers: 'block' });

test('phone PWA explains how to pair when no desktop session is active', async ({ page }) => {
  await page.goto('/phone-scan');
  await expect(page.getByRole('heading', { name: 'اسکنر همراه کتابخانه' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('QR را با این گوشی اسکن کنید');
});

test('paired phone scanner sends keyboard-wedge ISBN input to its one-time session', async ({ page }) => {
  let requestBody: { pairingToken: string; barcode: string } | undefined;
  await page.route('**/*', async route => {
    if (!route.request().url().includes('/api/phone-scanner/sessions/')) {
      await route.continue();
      return;
    }
    requestBody = route.request().postDataJSON() as typeof requestBody;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sequence: 1, barcode: '9780306406157', receivedAt: new Date().toISOString() }),
    });
  });

  await page.goto(`/phone-scan#pair=${sessionId}.${pairingToken}`);
  await expect(page.locator('.connected')).toContainText('گوشی موقت به فرم کتاب در رایانه وصل است');
  const scanner = page.locator('#phoneBarcode');
  await scanner.fill('978-0-306-40615-7');
  await scanner.press('Enter');

  await expect.poll(() => requestBody, { timeout: 5_000 }).toEqual({ pairingToken, barcode: '9780306406157' });
  await expect(page.getByRole('status').last()).toContainText('به رایانه ارسال شد');
});

test('phone scanner keeps keyboard input ready for consecutive no-mouse scans', async ({ page }) => {
  const scans: string[] = [];
  await page.route('**/api/phone-scanner/sessions/**', async route => {
    const body = route.request().postDataJSON() as { barcode: string };
    scans.push(body.barcode);
    await route.fulfill({ json: { sequence: scans.length, barcode: body.barcode, receivedAt: new Date().toISOString() } });
  });

  await page.goto(`/phone-scan#pair=${sessionId}.${pairingToken}`);
  await page.locator('#phoneBarcode').fill('9780306406157');
  await page.locator('#phoneBarcode').press('Enter');
  await expect.poll(() => scans.length).toBe(1);
  await page.keyboard.type('9780140328721');
  await page.keyboard.press('Enter');
  await expect.poll(() => scans).toEqual(['9780306406157', '9780140328721']);
});

test('phone scanner retains a barcode after a network error and can retry it', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/phone-scanner/sessions/**', async route => {
    attempts += 1;
    if (attempts === 1) {
      await route.fulfill({ status: 503, json: { message: 'offline' } });
      return;
    }
    const body = route.request().postDataJSON() as { barcode: string };
    await route.fulfill({ json: { sequence: 1, barcode: body.barcode, receivedAt: new Date().toISOString() } });
  });

  await page.goto(`/phone-scan#pair=${sessionId}.${pairingToken}`);
  await page.locator('#phoneBarcode').fill('9780306406157');
  await page.locator('#phoneBarcode').press('Enter');
  await expect(page.getByRole('status').last()).toContainText('بارکد در صف حفظ شد');
  await page.getByRole('button', { name: /ارسال دوبارهٔ صف/ }).click();
  await expect.poll(() => attempts).toBe(2);
  await expect(page.getByRole('status').last()).toContainText('به رایانه ارسال شد');
});

test('registered phone restores an unsent scan after reload and reconnects to a new desktop session', async ({ page }) => {
  const deviceId = 84;
  const deviceToken = 'persisted-phone-token-012345678901234567890123456789012345';
  const secondSession = '4b241101-e2bb-4255-8caf-4136c566a963';
  const secondPairingToken = 'second-pairing-token-012345678901234567890123456789012345';
  let attempts = 0;
  let successfulBody: Record<string, unknown> | undefined;
  await page.route('**/api/phone-scanner/sessions/**', async route => {
    attempts += 1;
    if (attempts === 1) {
      await route.fulfill({ status: 503, json: { message: 'offline' } });
      return;
    }
    successfulBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ json: { sequence: 1, barcode: '9780306406157', receivedAt: new Date().toISOString() } });
  });

  await page.goto(`/phone-scan#device=${deviceId}.${deviceToken}`);
  await expect(page.locator('.status')).toContainText('این گوشی به‌عنوان اسکنر ثبت شد');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('library.phone-scanner.device')))
    .toContain(`"id":${deviceId}`);
  await page.goto(`/phone-scan#pair=${sessionId}.${pairingToken}`);
  await page.locator('#phoneBarcode').fill('9780306406157');
  await page.locator('#phoneBarcode').press('Enter');
  await expect(page.getByRole('status').last()).toContainText('بارکد در صف حفظ شد');
  await expect.poll(() => page.evaluate(id => localStorage.getItem(`library.phone-scanner.queue.${id}`), deviceId))
    .toBe('["9780306406157"]');

  await page.reload();
  await page.goto(`/phone-scan#pair=${secondSession}.${secondPairingToken}`);
  await expect(page.getByRole('status').filter({ hasText: '1 بارکد در صف ارسال است' })).toBeVisible();
  await page.getByRole('button', { name: /ارسال دوبارهٔ صف/ }).click();
  await expect.poll(() => successfulBody).toEqual({
    pairingToken: secondPairingToken, barcode: '9780306406157', deviceId, deviceToken,
  });
  await expect.poll(() => page.evaluate(id => localStorage.getItem(`library.phone-scanner.queue.${id}`), deviceId)).toBe('[]');
});

test('registered phone retains its enrollment and authenticates continuous session scans', async ({ page }) => {
  const deviceToken = 'registered-phone-token-012345678901234567890123456789012345';
  let requestBody: Record<string, unknown> | undefined;
  await page.route('**/api/phone-scanner/sessions/**', async route => {
    requestBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ json: { sequence: 1, barcode: '9780306406157', receivedAt: new Date().toISOString() } });
  });
  await page.goto(`/phone-scan#device=42.${deviceToken}`);
  await expect(page.locator('.status')).toContainText('این گوشی به‌عنوان اسکنر ثبت شد');
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('');
  await page.goto(`/phone-scan#pair=${sessionId}.${pairingToken}`);
  await page.locator('#phoneBarcode').fill('9780306406157');
  await page.locator('#phoneBarcode').press('Enter');
  await expect.poll(() => requestBody).toEqual({ pairingToken, barcode: '9780306406157', deviceId: 42, deviceToken });
  await expect(page.getByRole('status').first()).toContainText('گوشی ثبت‌شده و مجاز');
  await page.goto('/phone-scan');
  await page.getByRole('button', { name: 'فراموش‌کردن ثبت این گوشی' }).click();
  await expect(page.locator('.status')).toContainText('ثبت این گوشی از این مرورگر پاک شد');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('library.phone-scanner.device'))).toBeNull();
});
