import { expect, test } from '@playwright/test';

async function signIn(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('نام کاربری').fill('admin');
  await page.getByRole('textbox', { name: 'رمز عبور' }).fill('admin');
  await page.getByRole('button', { name: 'ورود' }).click();
  await expect(page).toHaveURL(/\/book/);
}

test('reservation calendar navigates by Jalali month and dates render in Persian', async ({ page }) => {
  await signIn(page);
  await page.goto('/reservation');
  await page.getByRole('button', { name: 'نمایش تقویم شمسی' }).click();
  const calendar = page.getByRole('region', { name: 'تقویم شمسی رزروها' });
  await expect(calendar.locator('h2')).toContainText(/۱۴۰[۰-۹]/);
  const cells = calendar.locator('full-calendar [role="gridcell"]');
  await expect(cells).toHaveCount(42);
  const firstRenderedDate = await cells.first().getAttribute('data-date');
  expect(firstRenderedDate).toBeTruthy();
  expect(new Date(`${firstRenderedDate}T00:00:00Z`).getUTCDay()).toBe(6);
  const before = await calendar.locator('h2').innerText();
  await calendar.getByRole('button', { name: 'ماه بعد' }).click();
  await expect(calendar.locator('h2')).not.toHaveText(before);
  await expect(cells.first()).toContainText(/[۰-۹]/);
  await expect(page.getByRole('button', { name: 'نمایش فهرست' })).toHaveAttribute('aria-pressed', 'true');
});

test('reservation date entry opens an accessible Jalali picker and returns Persian input', async ({ page }) => {
  await signIn(page);
  await page.goto('/reservation');
  await page.getByRole('button', { name: 'رزرو جدید' }).click();
  const input = page.locator('#reservationExpiryDate');
  await expect(input).toHaveAttribute('placeholder', /شمسی/);
  await page.getByRole('button', { name: 'باز کردن تقویم شمسی برای reservationExpiryDate' }).click();
  const picker = page.getByRole('dialog', { name: /تقویم/ });
  await expect(picker).toBeVisible();
  await expect(picker).toContainText(/۱۴۰[۰-۹]/);
  const enabledDate = picker.locator('button.day:not(:disabled)').first();
  await enabledDate.click();
  await expect(input).toHaveValue(/۱۴۰[۰-۹]\/[۰-۹]{2}\/[۰-۹]{2}/);
  await expect(picker).toHaveCount(0);
});
