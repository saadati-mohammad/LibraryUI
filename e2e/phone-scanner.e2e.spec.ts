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
  await expect(page.getByText('گوشی به فرم کتاب در رایانه وصل است')).toBeVisible();
  const scanner = page.locator('#phoneBarcode');
  await scanner.fill('978-0-306-40615-7');
  await scanner.press('Enter');

  await expect.poll(() => requestBody, { timeout: 5_000 }).toEqual({ pairingToken, barcode: '9780306406157' });
  await expect(page.getByRole('status').last()).toContainText('به رایانه ارسال شد');
});
