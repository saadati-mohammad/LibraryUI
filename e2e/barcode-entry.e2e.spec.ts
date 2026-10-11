import { expect, test } from '@playwright/test';

test('barcode entry rejects unsupported values and keeps manual entry available', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('نام کاربری').fill('admin');
  await page.getByRole('textbox', { name: 'رمز عبور' }).fill('admin');
  await page.getByRole('button', { name: 'ورود' }).click();
  await expect(page).toHaveURL(/\/book/);
  await page.getByRole('button', { name: 'افزودن کتاب جدید' }).click();

  const scan = page.getByLabel('اسکن بارکد کتاب یا ورود شابک');
  await scan.fill('12345');
  await scan.press('Enter');
  await expect(page.locator('#barcodeStatus')).toContainText('بارکد شابک معتبر نیست');
  await page.locator('#bookTitleForm').fill('عنوان ورود دستی');
  await page.locator('#bookIsbn10Form').fill('12345');
  await expect(page.locator('#bookTitleForm')).toHaveValue('عنوان ورود دستی');
  await expect(page.getByRole('button', { name: 'ذخیره کتاب' })).toBeDisabled();
});
