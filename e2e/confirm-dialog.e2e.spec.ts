import { test, expect, Page } from '@playwright/test';

/**
 * Verifies the shared Material confirmation dialog replaced the blocking native
 * `confirm()` for destructive actions. We drive the loan "return" action because it
 * is reachable without mutating seed data irreversibly: we open the dialog, assert
 * it renders as an accessible dialog with the expected message, then cancel.
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

test.describe('Shared confirmation dialog', () => {
  test('loan return opens an accessible confirm dialog and cancel is a no-op', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'امانت‌ها' }).click();
    await expect(page).toHaveURL(/\/loan/, { timeout: 15_000 });

    // Find any row's return action. If there are no active loans in the seed data we
    // skip gracefully rather than fail on a data precondition.
    const returnButton = page.getByRole('button', { name: 'بازگشت' }).first();
    if ((await returnButton.count()) === 0) {
      test.skip(true, 'No active loans in seed data to exercise the return action');
      return;
    }

    await returnButton.click();

    // The accessible dialog (role=dialog) must appear — not a native window.confirm.
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog).toContainText('ثبت بازگشت');

    // Cancelling closes the dialog and does not navigate or mutate.
    await page.getByRole('button', { name: 'انصراف' }).click();
    await expect(dialog).toBeHidden({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/loan/);
  });
});
