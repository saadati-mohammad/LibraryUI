import { expect, test } from '@playwright/test';

test('member workbook requires review before import and resets preview when the file changes', async ({ page }) => {
  const tokenPayload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  await page.addInitScript(({ token }) => {
    localStorage.setItem('library.auth.token', token);
    localStorage.setItem('library.auth.user', 'admin');
    localStorage.setItem('library.auth.role', 'ADMIN');
  }, { token: `e30.${tokenPayload}.signature` });
  await page.route('**/api/person**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ content: [], totalPages: 0, totalElements: 0, number: 0, size: 10 }),
  }));
  await page.route('**/api/book**', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ content: [], totalPages: 0, totalElements: 0, number: 0, size: 10 }),
  }));
  await page.route('**/api/excel-import/persons/preview', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, preview: true, totalRows: 3, eligible: 1,
      skippedDuplicates: 1, duplicateRows: [3], skippedInvalid: 1,
      invalidRows: [{ row: 4, reason: 'قالب ایمیل نامعتبر است' }] }),
  }));
  const commits: string[] = [];
  await page.route('**/api/excel-import/persons', route => {
    commits.push(route.request().method());
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      success: true, imported: 1, skippedDuplicates: 1, skippedInvalid: 1, message: 'ok',
    }) });
  });

  await page.goto('/person');
  await page.getByRole('button', { name: 'بارگذاری از اکسل' }).click();
  await page.locator('input[data-testid="person-excel-input"]').setInputFiles({
    name: 'members.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from('test workbook'),
  });
  await page.getByRole('button', { name: 'پیش‌نمایش فایل' }).click();
  const preview = page.getByTestId('person-import-preview');
  await expect(preview).toContainText('3 ردیف بررسی شد');
  await expect(preview).toContainText('ردیف 4');
  expect(commits).toHaveLength(0);

  await page.getByRole('button', { name: 'تأیید و واردسازی' }).click();
  await expect.poll(() => commits).toEqual(['POST']);
});
