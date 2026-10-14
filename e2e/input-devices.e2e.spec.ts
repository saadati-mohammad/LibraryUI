import { test, expect } from '@playwright/test';

test('admin provisions, edits, disables and revokes a keyboard-wedge scanner', async ({ page }) => {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const devices: Array<Record<string, unknown>> = [];
  const policies = new Map<string, Record<string, unknown>>();
  const basePolicy = (formKey: string, station = '', ownerUsername = '') => policies.get(`${formKey}|${station}|${ownerUsername}`)
    ?? { formKey, station, allowedSources: ['MANUAL'], defaultSource: 'MANUAL', scope: 'system-default', updatedBy: null, updatedAt: null, version: 0 };
  const manualType = { key: 'MANUAL', displayName: 'ورود دستی', capabilities: ['keyboard'], configSchema: { type: 'object', properties: {} } };
  const type = { key: 'KEYBOARD_WEDGE', displayName: 'اسکنر USB / بلوتوث', capabilities: ['keyboard-wedge', 'usb'], configSchema: { type: 'object', properties: { terminator: { type: 'string', enum: ['ENTER', 'TAB', 'NONE'] }, minimumLength: { type: 'integer', minimum: 1, maximum: 128 } } } };
  const phoneType = { key: 'PHONE_CAMERA', displayName: 'دوربین گوشی', capabilities: ['camera', 'pwa'], configSchema: { type: 'object', properties: { cameraFacing: { type: 'string', enum: ['environment', 'user'] } } } };
  await page.route('**/api/auth/login', route => route.fulfill({ status: 200, json: { token: `e30.${payload}.signature`, username: 'admin', role: 'ADMIN', expiresInSeconds: 3600 } }));
  await page.route('**/api/book**', route => route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 10 } }));
  await page.route('**/api/admin/input-devices**', async route => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (path.endsWith('/types')) return route.fulfill({ json: [manualType, type, phoneType] });
    if (path.endsWith('/audit')) return route.fulfill({ json: [] });
    if (method === 'GET') return route.fulfill({ json: devices });
    if (method === 'POST' && !/\/(enable|disable|rotate-token)$/.test(path)) {
      const item = { id: 7 + devices.length, ...route.request().postDataJSON() as object, capabilities: type.capabilities, enabled: true, revoked: false, lastSeenAt: null, version: 0 };
      devices.push(item);
      return route.fulfill({ status: 201, json: { device: item, token: 'one-time-device-token' } });
    }
    if (method === 'POST' && path.endsWith('/disable')) { devices[0]!['enabled'] = false; return route.fulfill({ json: devices[0] }); }
    if (method === 'DELETE') { devices[0]!['enabled'] = false; devices[0]!['revoked'] = true; return route.fulfill({ json: devices[0] }); }
    if (method === 'PUT') { Object.assign(devices[0]!, route.request().postDataJSON()); return route.fulfill({ json: devices[0] }); }
    return route.fulfill({ status: 200, json: devices[0] ?? {} });
  });
  await page.route('**/api/admin/input-policies/**', async route => {
    const url = new URL(route.request().url());
    const formKey = url.pathname.split('/').at(-1)!;
    const station = route.request().method() === 'PUT'
      ? String(route.request().postDataJSON()['station'] ?? '') : url.searchParams.get('station') ?? '';
    const owner = route.request().method() === 'PUT'
      ? String(route.request().postDataJSON()['ownerUsername'] ?? '') : url.searchParams.get('ownerUsername') ?? '';
    const key = `${formKey}|${station}|${owner}`;
    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON();
      const response = { ...basePolicy(formKey, station, owner), ...body, scope: owner ? 'user' : 'global', updatedBy: 'admin', version: 1 };
      policies.set(key, response);
      return route.fulfill({ json: response });
    }
    return route.fulfill({ json: basePolicy(formKey, station, owner) });
  });

  await page.goto('/login');
  await page.getByLabel('نام کاربری').fill('admin');
  await page.getByRole('textbox', { name: 'رمز عبور' }).fill('admin');
  await page.getByRole('button', { name: 'ورود' }).click();
  await page.goto('/input-devices');
  await expect(page.getByRole('heading', { name: 'دستگاه‌ها و روش‌های ورود اطلاعات' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'روش‌های ورود برای هر فرم' })).toBeVisible();
  const policyPanel = page.getByRole('region', { name: 'روش‌های ورود برای هر فرم' });
  await policyPanel.locator('.policy-controls select').selectOption('loan-checkout');
  await policyPanel.locator('.policy-controls input').nth(0).fill('میز امانت');
  await policyPanel.locator('.policy-controls input').nth(1).fill('librarian');
  await page.getByRole('button', { name: 'بارگذاری تنظیم' }).click();
  await policyPanel.locator('.policy-controls select').selectOption('book-registration');
  await policyPanel.locator('.policy-controls input').nth(0).fill('میز امانت');
  await policyPanel.locator('.policy-controls input').nth(1).fill('librarian');
  await page.getByRole('button', { name: 'بارگذاری تنظیم' }).click();
  await policyPanel.locator('.policy-options label').filter({ hasText: 'اسکنر USB / بلوتوث' }).locator('input').check();
  await policyPanel.locator('.policy-default').locator('select').selectOption('KEYBOARD_WEDGE');
  await page.getByRole('button', { name: 'ذخیره سیاست فرم' }).click();
  await expect(page.getByText('سیاست ورودی ذخیره شد.')).toBeVisible();
  expect(policies.has('book-registration|میز امانت|librarian')).toBe(true);
  await expect(policyPanel.locator('legend')).toContainText('user');
  await page.getByLabel('نام دستگاه').fill('اسکنر میز امانت');
  await page.getByRole('button', { name: 'ثبت دستگاه' }).click();
  await expect(page.getByText('one-time-device-token')).toBeVisible();
  await page.getByRole('button', { name: 'ذخیره شد؛ بستن' }).click();
  const row = page.locator('.device-row').filter({ hasText: 'اسکنر میز امانت' });
  await expect(row).toContainText('فعال');
  await row.getByRole('button', { name: 'ویرایش' }).click();
  await page.getByLabel('نام دستگاه').fill('اسکنر میز امانت ۲');
  await page.getByRole('button', { name: 'ذخیره تغییرات' }).click();
  const updated = page.locator('.device-row').filter({ hasText: 'اسکنر میز امانت ۲' });
  await updated.getByRole('button', { name: 'غیرفعال‌سازی' }).click();
  await expect(updated).toContainText('غیرفعال');
  await page.once('dialog', dialog => dialog.accept());
  await updated.getByRole('button', { name: 'لغو دسترسی' }).click();
  await expect(page.locator('.device-row').filter({ hasText: 'اسکنر میز امانت ۲' })).toContainText('لغوشده');
  await page.getByLabel('نام دستگاه').fill('گوشی میز امانت');
  await page.getByLabel('نوع ورودی').selectOption('PHONE_CAMERA');
  await page.getByRole('button', { name: 'ثبت دستگاه' }).click();
  await expect(page.locator('.enrollment-qr')).toBeVisible();
  await expect(page.locator('.token-box')).toContainText('توکن دستگاه');
});
