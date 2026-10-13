import { expect, test } from '@playwright/test';

test('visitor finds a persisted title from the public home and opens its public detail', async ({ page }) => {
  const title = `جست‌وجوی عمومی ${Date.now()}`;

  // Create the test title through the actual staff UI so the guest path uses persisted data.
  await page.goto('/login');
  await page.getByLabel('نام کاربری').fill('admin');
  await page.getByRole('textbox', { name: 'رمز عبور' }).fill('admin');
  await page.getByRole('button', { name: 'ورود' }).click();
  await expect(page).toHaveURL(/\/book/);
  await page.getByRole('button', { name: 'افزودن کتاب جدید' }).click();
  await page.locator('#bookTitleForm').fill(title);
  await page.locator('#bookAuthorForm').fill('نویسنده مهمان');
  await page.locator('#bookSubjectForm').fill('آزمون فهرست عمومی');
  await page.locator('#bookIsbn10Form').fill('0-306-40615-2');
  await page.getByRole('button', { name: 'ذخیره کتاب' }).click();
  await expect(page.getByText(title, { exact: false }).first()).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'منوی کاربر' }).click();
  await page.getByRole('menuitem', { name: 'خروج' }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /کتاب بعدی‌تان/ })).toBeVisible();
  if ((page.viewportSize()?.width ?? 1024) < 700) {
    await page.getByRole('button', { name: 'باز کردن منو' }).click();
  }
  await expect(page.getByRole('navigation', { name: 'ناوبری عمومی' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'مدیریت کتاب‌ها' })).toHaveCount(0);
  await page.getByRole('searchbox', { name: 'جست‌وجوی عنوان، نویسنده یا موضوع' }).fill(title);
  await page.getByRole('button', { name: 'جست‌وجو' }).click();
  await expect(page).toHaveURL(/\/catalog\?q=/);
  const result = page.getByRole('link', { name: new RegExp(title) });
  await expect(result).toBeVisible();
  await result.click();
  await expect(page).toHaveURL(/\/books\/\d+/);
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.getByText('نویسنده مهمان')).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/catalog\?q=/);
  await page.goForward();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
});

test('public search validates empty results and preserves the category navigation', async ({ page }) => {
  await page.goto('/catalog?q=not-a-real-title-748281');
  await expect(page.getByRole('heading', { name: 'کتابی پیدا نشد' })).toBeVisible();
  await page.getByRole('button', { name: 'پاک‌کردن فیلترها' }).click();
  await expect(page).toHaveURL('/catalog');
  if ((page.viewportSize()?.width ?? 1024) < 700) {
    await page.getByRole('button', { name: 'باز کردن منو' }).click();
  }
  await page.getByRole('link', { name: 'موضوع‌ها' }).click();
  await expect(page).toHaveURL('/categories');
  await expect(page.getByRole('heading', { name: 'از موضوع دلخواهتان شروع کنید' })).toBeVisible();
});
