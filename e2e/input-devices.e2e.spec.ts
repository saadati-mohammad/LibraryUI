import { test, expect } from '@playwright/test';

test('admin provisions, edits, disables and revokes a keyboard-wedge scanner', async ({ page }) => {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const devices: Array<Record<string, unknown>> = [];
  const type = { key: 'KEYBOARD_WEDGE', displayName: 'اسکنر USB / بلوتوث', capabilities: ['keyboard-wedge', 'usb'], configSchema: { type: 'object', properties: { terminator: { type: 'string', enum: ['ENTER', 'TAB', 'NONE'] }, minimumLength: { type: 'integer', minimum: 1, maximum: 128 } } } };
  await page.route('**/api/auth/login', route => route.fulfill({ status: 200, json: { token: `e30.${payload}.signature`, username: 'admin', role: 'ADMIN', expiresInSeconds: 3600 } }));
  await page.route('**/api/book**', route => route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 10 } }));
  await page.route('**/api/admin/input-devices**', async route => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (path.endsWith('/types')) return route.fulfill({ json: [type] });
    if (path.endsWith('/audit')) return route.fulfill({ json: [] });
    if (method === 'GET') return route.fulfill({ json: devices });
    if (method === 'POST' && !/\/(enable|disable|rotate-token)$/.test(path)) {
      const item = { id: 7, ...route.request().postDataJSON() as object, capabilities: type.capabilities, enabled: true, revoked: false, lastSeenAt: null, version: 0 };
      devices.push(item);
      return route.fulfill({ status: 201, json: { device: item, token: 'one-time-device-token' } });
    }
    if (method === 'POST' && path.endsWith('/disable')) { devices[0]!['enabled'] = false; return route.fulfill({ json: devices[0] }); }
    if (method === 'DELETE') { devices[0]!['enabled'] = false; devices[0]!['revoked'] = true; return route.fulfill({ json: devices[0] }); }
    if (method === 'PUT') { Object.assign(devices[0]!, route.request().postDataJSON()); return route.fulfill({ json: devices[0] }); }
    return route.fulfill({ status: 200, json: devices[0] ?? {} });
  });

  await page.goto('/login');
  await page.getByLabel('نام کاربری').fill('admin');
  await page.getByRole('textbox', { name: 'رمز عبور' }).fill('admin');
  await page.getByRole('button', { name: 'ورود' }).click();
  await page.goto('/input-devices');
  await expect(page.getByRole('heading', { name: 'دستگاه‌ها و روش‌های ورود اطلاعات' })).toBeVisible();
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
});
