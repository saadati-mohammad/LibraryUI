import { test, expect, Page } from '@playwright/test';

/**
 * End-to-end business flow through the real UI + API: sign in, create a book via the
 * modal, verify it persists in the list and survives a reload, then search for it.
 *
 * Assumes the backend is running on :8079 (proxied by the dev server) with the
 * development admin credentials.
 */
async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('نام کاربری').fill('admin');
  await page.getByRole('textbox', { name: 'رمز عبور' }).fill('admin');
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
    await page.locator('#bookIsbn10Form').fill('0-306-40615-2');

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

  test('updates a book, then deactivates it through the confirmation dialog', async ({ page }) => {
    await login(page);
    const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const title = `کتاب چرخه ${unique}`;
    await page.goto('/book');

    await page.getByRole('button', { name: 'افزودن کتاب جدید' }).click();
    const modal = page.locator('app-modal').filter({ has: page.locator('#bookFormInternal') });
    await page.locator('#bookTitleForm').fill(title);
    await page.locator('#bookAuthorForm').fill('نویسنده آزمون');
    await page.locator('#bookSubjectForm').fill('موضوع آزمون');
    await page.locator('#bookIsbn10Form').fill('0-306-40615-2');
    let createdBook: { id: number } | undefined;
    await page.route('**/api/book', async route => {
      if (route.request().method() !== 'POST') return route.continue();
      const response = await route.fetch();
      createdBook = await response.json() as { id: number };
      await route.fulfill({ response });
    });
    const createdPromise = page.waitForResponse((response) =>
      response.request().method() === 'POST' && response.url().includes('/api/book'),
    );
    await page.getByRole('button', { name: 'ذخیره کتاب' }).click();
    const created = await createdPromise;
    expect(created.status()).toBe(201);
    const book = createdBook;
    if (!book) throw new Error('The created book response did not include an ID');
    expect(book.id).toBeTruthy();
    await expect(modal).toBeHidden();

    let row = page.getByRole('row').filter({ hasText: title });
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'ویرایش کتاب' }).click();
    await expect(modal).toBeVisible();
    const updatedTitle = `${title} ویرایش‌شده`;
    await page.locator('#bookTitleForm').fill(updatedTitle);
    const updatedPromise = page.waitForResponse((response) =>
      response.request().method() === 'PUT' && response.url().includes(`/api/book/${book.id}`),
    );
    await page.getByRole('button', { name: 'بروزرسانی کتاب' }).click();
    expect((await updatedPromise).ok()).toBe(true);
    await expect(modal).toBeHidden();
    row = page.getByRole('row').filter({ hasText: updatedTitle });
    await expect(row).toBeVisible();

    await row.getByRole('button', { name: 'حذف کتاب' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const deletedPromise = page.waitForResponse((response) =>
      response.request().method() === 'DELETE' && response.url().includes(`/api/book/${book.id}`),
    );
    await dialog.getByRole('button', { name: 'حذف', exact: true }).click();
    expect((await deletedPromise).ok()).toBe(true);
    await expect(row).toBeHidden();
    await page.reload();
    await expect(page.getByRole('row').filter({ hasText: updatedTitle })).toHaveCount(0);
  });
});
