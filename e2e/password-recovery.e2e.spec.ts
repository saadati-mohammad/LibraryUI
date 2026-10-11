import { test, expect } from '@playwright/test';

test('password recovery request gives a generic confirmation', async ({ page }) => {
  await page.route('**/api/auth/forgot-password', route => route.fulfill({
    status: 202,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, message: 'اگر حسابی با این ایمیل وجود داشته باشد، لینک بازیابی برای آن ارسال می‌شود.' }),
  }));
  await page.goto('/forgot-password');
  await page.getByLabel('ایمیل حساب').fill('member@example.test');
  await page.getByRole('button', { name: 'ارسال لینک بازیابی' }).click();
  await expect(page.getByRole('status')).toContainText('اگر حسابی با این ایمیل وجود داشته باشد');
});

test('one-time reset form submits a matching strong password', async ({ page }) => {
  let received: { token?: string; password?: string } = {};
  await page.route('**/api/auth/reset-password', async route => {
    received = route.request().postDataJSON() as typeof received;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });
  await page.goto('/reset-password?token=abcdefghijklmnopqrstuvwxzy0123456789');
  await page.locator('#newPassword').fill('new-secure-password-456');
  await page.locator('#confirmPassword').fill('new-secure-password-456');
  await page.getByRole('button', { name: 'ثبت رمز جدید' }).click();
  await expect(page.getByRole('status')).toContainText('رمز عبور تغییر کرد');
  expect(received).toEqual({ token: 'abcdefghijklmnopqrstuvwxzy0123456789', password: 'new-secure-password-456' });
});
