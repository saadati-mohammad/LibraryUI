import { test, expect } from '@playwright/test';

/**
 * End-to-end authentication flow, driven through a real browser.
 *
 * Preconditions: the backend is running on :8079 with APP_ADMIN_USERNAME=admin and
 * APP_ADMIN_PASSWORD=admin (matching the dev profile). The Playwright config starts
 * the Angular dev server (with proxy.conf.json) automatically.
 */
test.describe('Authentication', () => {
  test('unauthenticated visit to a protected route redirects to /login', async ({ page }) => {
    await page.goto('/book');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('link', { name: 'کتاب‌ها', exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'داشبورد' })).toHaveCount(0);
    await expect(page.getByLabel('نام کاربری')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'رمز عبور' })).toBeVisible();
  });

  test('wrong credentials show an inline error and do not navigate', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('نام کاربری').fill('admin');
    await page.getByRole('textbox', { name: 'رمز عبور' }).fill('definitely-wrong');
    await page.getByRole('button', { name: 'ورود' }).click();

    await expect(page.getByRole('alert')).toContainText('نادرست');
    await expect(page).toHaveURL(/\/login/);
  });

  test('valid credentials sign in, reach the app, then log out', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: 'کتاب‌ها', exact: true })).toHaveCount(0);
    await page.getByLabel('نام کاربری').fill('admin');
    await page.getByRole('textbox', { name: 'رمز عبور' }).fill('admin');
    await page.getByRole('button', { name: 'ورود' }).click();

    // Lands on the protected books route.
    await expect(page).toHaveURL(/\/book/, { timeout: 15_000 });
    if ((page.viewportSize()?.width ?? 1024) < 768) {
      await page.getByRole('button', { name: 'منوی اصلی' }).click();
      await expect(page.getByRole('menuitem', { name: 'کتاب‌ها', exact: true })).toBeVisible();
      await page.getByRole('menuitem', { name: 'کتاب‌ها', exact: true }).click();
    } else {
      await expect(page.getByRole('link', { name: 'کتاب‌ها', exact: true })).toBeVisible();
    }
    // The authenticated header is present, with mobile links behind the menu trigger.
    await expect(page.getByRole('heading', { name: /مدیریت کتاب‌ها/ })).toBeVisible();

    // Session token was actually stored.
    const token = await page.evaluate(() => localStorage.getItem('library.auth.token'));
    expect(token).toBeTruthy();

    // Log out via the user menu.
    await page.getByRole('button', { name: 'منوی کاربر' }).click();
    await page.getByRole('menuitem', { name: 'خروج' }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('link', { name: 'کتاب‌ها', exact: true })).toHaveCount(0);
    const cleared = await page.evaluate(() => localStorage.getItem('library.auth.token'));
    expect(cleared).toBeNull();
  });
});
