import { expect, test, type Page } from '@playwright/test';

async function loginAndSeedBook(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('نام کاربری').fill('admin');
  await page.getByRole('textbox', { name: 'رمز عبور' }).fill('admin');
  const loginResponse = page.waitForResponse((response) =>
    response.request().method() === 'POST' && response.url().includes('/api/auth/login'),
  );
  await page.getByRole('button', { name: 'ورود' }).click();
  const response = await loginResponse;
  expect(response.ok()).toBe(true);
  const session = await response.json() as { token: string };

  // Each test owns its fixture so it can run alone against a clean H2 database.
  const isbnPrefix = `979${Date.now().toString().slice(-9)}`;
  const weightedSum = [...isbnPrefix].reduce((sum, digit, index) => sum + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
  const isbn13 = `${isbnPrefix}${(10 - (weightedSum % 10)) % 10}`;
  const seedResponse = await page.request.post('http://localhost:4200/api/book', {
    headers: { Authorization: `Bearer ${session.token}` },
    multipart: {
      book: {
        name: 'book',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify({
          title: `آزمون صفحه‌بندی ${isbn13}`,
          author: 'نویسندهٔ آزمون',
          subject: 'آزمون رابط کاربری',
          isbn13,
          copyCount: 1,
          active: true,
        })),
      },
    },
  });
  expect(seedResponse.status(), 'The isolated book fixture should be created').toBe(201);
  await expect(page).toHaveURL(/\/book/);
}

test('staff table uses Persian paginator labels and renders optional translator data cleanly', async ({ page }) => {
  await loginAndSeedBook(page);
  await expect(page.getByText('تعداد در هر صفحه')).toBeVisible();
  await expect(page.locator('.mat-mdc-paginator-range-label')).toContainText('از');
  await expect(page.locator('app-list')).not.toContainText('undefined');
  await expect(page.getByText('Items per page')).toHaveCount(0);
});

test('mobile staff book cards expand to contain their cells and paginator', async ({ page }) => {
  // The assertion is about the mobile layout, so give it the same explicit viewport in
  // every project instead of relying on the browser project's default width.
  await page.setViewportSize({ width: 390, height: 844 });
  await loginAndSeedBook(page);
  await expect(page.locator('.lux-table tr.data-row').first()).toBeVisible();

  const layout = await page.locator('app-list').evaluate((host) => {
    const rows = [...host.querySelectorAll<HTMLTableRowElement>('.lux-table tr.data-row')];
    const lastRow = rows.at(-1);
    const paginator = host.querySelector<HTMLElement>('.dynamic-table-wrapper > .mt-4');
    if (!lastRow || !paginator) return null;
    const rowRect = lastRow.getBoundingClientRect();
    const lastCell = lastRow.lastElementChild?.getBoundingClientRect();
    return {
      rowBottom: rowRect.bottom,
      cellBottom: lastCell?.bottom ?? 0,
      paginatorTop: paginator.getBoundingClientRect().top,
      rowCount: rows.length,
    };
  });

  expect(layout).not.toBeNull();
  expect(layout!.rowCount).toBeGreaterThan(0);
  expect(layout!.rowBottom).toBeGreaterThanOrEqual(layout!.cellBottom);
  expect(layout!.paginatorTop).toBeGreaterThanOrEqual(layout!.rowBottom);
});
