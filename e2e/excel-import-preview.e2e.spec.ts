import { expect, test } from '@playwright/test';

test('book import requires a preview and reports duplicates before commit', async ({ page }) => {
  let committed = 0;
  await page.route('**/api/book**', route => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ content: [], totalPages: 0, totalElements: 0, number: 0, size: 10 }),
  }));
  await page.route('**/api/excel-import/books/preview', route => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      success: true, preview: true, totalRows: 3, eligible: 1,
      skippedDuplicates: 1, duplicateRows: [3], skippedInvalid: 1,
      invalidRows: [{ row: 4, reason: 'موضوع الزامی است' }],
    }),
  }));
  await page.route('**/api/excel-import/books', route => {
    committed++;
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ success: true, imported: 1, eligible: 1, totalRows: 3,
        skippedDuplicates: 1, duplicateRows: [3], skippedInvalid: 1,
        invalidRows: [{ row: 4, reason: 'موضوع الزامی است' }], message: 'ok' }),
    });
  });

  await page.goto('/login');
  await page.getByLabel('نام کاربری').fill('admin');
  await page.getByRole('textbox', { name: 'رمز عبور' }).fill('admin');
  await page.getByRole('button', { name: 'ورود' }).click();
  await expect(page).toHaveURL(/\/book/);
  await page.getByRole('button', { name: 'بارگذاری از اکسل' }).click();
  await page.getByTestId('book-excel-input').setInputFiles({
    name: 'books.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from('not-parsed-by-this-browser-contract-test'),
  });
  await page.getByRole('button', { name: 'پیش‌نمایش فایل' }).click();
  const preview = page.getByRole('status', { name: 'پیش‌نمایش واردسازی کتاب‌ها' });
  await expect(preview).toContainText('3 ردیف داده');
  await expect(preview).toContainText('ردیف‌های تکراری: 3');
  await preview.getByText('نمایش دلیل خطاهای ردیف‌ها').click();
  await expect(preview).toContainText('ردیف 4: موضوع الزامی است');
  await expect.poll(() => committed).toBe(0);

  await page.getByRole('button', { name: 'تأیید و واردسازی' }).click();
  await expect.poll(() => committed).toBe(1);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
