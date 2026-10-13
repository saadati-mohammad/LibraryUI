import { expect, test } from '@playwright/test';

test('member registers, reserves a real catalog title, manages the reservation, and is kept out of staff routes', async ({ page }) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const title = `کتاب عضو ${suffix}`;

  await page.goto('/login');
  await page.getByLabel('نام کاربری').fill('admin');
  await page.getByRole('textbox', { name: 'رمز عبور' }).fill('admin');
  await page.getByRole('button', { name: 'ورود' }).click();
  await expect(page).toHaveURL(/\/book/);
  await page.getByRole('button', { name: 'افزودن کتاب جدید' }).click();
  await page.locator('#bookTitleForm').fill(title);
  await page.locator('#bookAuthorForm').fill('نویسنده عضو');
  await page.locator('#bookSubjectForm').fill('کتاب‌های اعضا');
  await page.locator('#bookIsbn10Form').fill('0-306-40615-2');
  await page.getByRole('button', { name: 'ذخیره کتاب' }).click();
  await expect(page.getByText(title, { exact: false }).first()).toBeVisible();
  await page.getByRole('button', { name: 'منوی کاربر' }).click();
  await page.getByRole('menuitem', { name: 'خروج' }).click();

  const nationalId = String(Math.floor(Math.random() * 10_000_000_000)).padStart(10, '0');
  const email = `member-${suffix}@example.test`;
  await page.goto('/register');
  await page.getByLabel('نام', { exact: true }).fill('عضو');
  await page.getByLabel('نام خانوادگی').fill('آزمایشی');
  await page.getByLabel('ایمیل').fill(email);
  await page.getByLabel('کد ملی').fill(nationalId);
  await page.locator('input[name="password"]').fill('member-test-password-41');
  await page.getByLabel('تکرار گذرواژه').fill('member-test-password-41');
  await page.getByRole('button', { name: 'ایجاد حساب' }).click();
  await expect(page).toHaveURL('/account', { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'سلام، عضو' })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();

  await page.goto(`/catalog?q=${encodeURIComponent(title)}`);
  await page.getByRole('link', { name: new RegExp(title) }).click();
  await page.getByRole('button', { name: 'رزرو این کتاب' }).click();
  await expect(page.getByRole('status')).toContainText('رزرو ثبت شد');
  await page.goto('/account');
  const reservation = page.getByRole('article').filter({ hasText: title });
  await expect(reservation).toBeVisible();
  await reservation.getByRole('button', { name: 'لغو رزرو' }).click();
  await expect(page.getByRole('status')).toContainText('رزرو لغو شد');

  await page.goto('/book');
  await expect(page).toHaveURL('/account');
  await page.getByRole('button', { name: 'خروج' }).click();
  await page.goto('/account');
  await expect(page).toHaveURL(/\/login\?returnUrl=/);
});
