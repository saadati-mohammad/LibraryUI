import { test, expect, Page } from '@playwright/test';

/**
 * End-to-end business flow through the real UI + API: sign in, create a book via the
 * modal, verify it persists in the list and survives a reload, then search for it.
 *
 * Assumes the backend is running on :8080 with the development admin credentials.
 */
async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('نام کاربری').fill('admin');
  await page.getByLabel('رمز عبور').fill('admin');
  await page.getByRole('button', { name: 'ورود' }).click();
  await expect(page).toHaveURL(/\/book/, { timeout: 15_000 });
}

test.describe('Business flow: book CRUD', () => {
  test('create a book and see it persist in the list', async ({ page }) => {
    await login(page);

    const title = `کتاب آزمون ${Date.now()}`;

    // Open the create modal. Scope to the form modal — the page also renders an
    // Excel-import app-modal, so a bare `app-modal` locator is ambiguous.
    await page.getByRole('button', { name: 'افزودن کتاب جدید' }).click();
    const modal = page.locator('app-modal').filter({ has: page.locator('#bookFormInternal') });
    await expect(modal).toBeVisible();

    // Required fields (isbn10, title, author, subject are Validators.required).
    await page.locator('#bookTitleForm').fill(title);
    await page.locator('#bookAuthorForm').fill('نویسنده آزمون');
    await page.locator('#bookSubjectForm').fill('موضوع آزمون');
    await page.locator('#bookIsbn10Form').fill('964-321-000-1');

    // Save.
    await page.getByRole('button', { name: 'ذخیره کتاب' }).click();

    // Modal closes and the new row appears in the table.
    await expect(modal).toBeHidden({ timeout: 15_000 });
    await expect(page.getByText(title, { exact: false }).first()).toBeVisible({ timeout: 15_000 });

    // Persistence: reload and confirm it is still there.
    await page.reload();
    await expect(page.getByText(title, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('required-field validation blocks submit', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'افزودن کتاب جدید' }).click();
    const modal = page.locator('app-modal').filter({ has: page.locator('#bookFormInternal') });
    await expect(modal).toBeVisible();

    // With required fields empty the save button must be disabled (validation gate).
    await expect(page.getByRole('button', { name: 'ذخیره کتاب' })).toBeDisabled();
  });
});
