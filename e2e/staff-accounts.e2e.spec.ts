import { test, expect } from '@playwright/test';

test('admin manages staff accounts without deleting history', async ({ page }) => {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  await page.route('**/api/auth/login', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ token: `e30.${payload}.signature`, username: 'admin', role: 'ADMIN', expiresInSeconds: 3600 }),
  }));
  await page.route('**/api/book**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ content: [], totalPages: 0, totalElements: 0, number: 0, size: 10 }),
  }));
  await page.route('**/api/input-policies/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ formKey: 'book-registration', station: '', allowedSources: ['MANUAL', 'KEYBOARD_WEDGE', 'PHONE_CAMERA'],
      defaultSource: 'MANUAL', scope: 'system-default', updatedBy: null, updatedAt: null, version: 0 }),
  }));
  const accounts: Array<Record<string, unknown>> = [];
  await page.route('**/api/admin/staff-accounts**', async route => {
    const request = route.request();
    const method = request.method();
    const path = new URL(request.url()).pathname;
    if (method === 'GET') return route.fulfill({ json: accounts });
    if (method === 'POST' && path.endsWith('/reactivate')) {
      const account = accounts.find(item => path.endsWith(`/${item['id']}/reactivate`));
      if (account) account['active'] = true;
      return route.fulfill({ json: account ?? {} });
    }
    if (method === 'POST') {
      const request = route.request().postDataJSON() as Record<string, unknown>;
      const account = { id: Date.now(), ...request, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      accounts.unshift(account);
      return route.fulfill({ status: 201, json: account });
    }
    if (method === 'DELETE') {
      const account = accounts.find(item => path.endsWith(`/${item['id']}`));
      if (account) account['active'] = false;
      return route.fulfill({ json: account ?? {} });
    }
    return route.fulfill({ status: 405 });
  });
  await page.goto('/login');
  await page.getByLabel('نام کاربری').fill('admin');
  await page.getByRole('textbox', { name: 'رمز عبور' }).fill('admin');
  await page.getByRole('button', { name: 'ورود' }).click();
  await expect(page).toHaveURL(/\/book/);

  const mobileMenu = page.getByRole('button', { name: 'منوی اصلی' });
  if (await mobileMenu.isVisible()) await mobileMenu.click();
  const staffLink = page.getByRole('link', { name: 'حساب‌های کارکنان' });
  if (await staffLink.isVisible()) await staffLink.click();
  else await page.getByRole('menuitem', { name: 'حساب‌های کارکنان' }).click();
  await expect(page.getByRole('heading', { name: 'حساب‌های کارکنان' })).toBeVisible();
  const username = `qa-${Date.now()}`;
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="displayName"]').fill('کاربر آزمایشی');
  await page.locator('input[name="email"]').fill(`${username}@example.test`);
  await page.locator('input[name="password"]').fill('long-test-password-123');
  await page.locator('select[name="role"]').selectOption('LIBRARIAN');
  await page.getByRole('button', { name: 'ایجاد حساب' }).click();

  const row = page.locator('.account-row').filter({ hasText: username });
  await expect(row).toContainText('کاربر آزمایشی');
  await page.once('dialog', dialog => dialog.accept());
  await row.getByRole('button', { name: 'غیرفعال‌سازی' }).click();
  await expect(row).toContainText('غیرفعال');
  await row.getByRole('button', { name: 'فعال‌سازی' }).click();
  await expect(row).toContainText('فعال');
});
