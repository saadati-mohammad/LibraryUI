import { expect, test } from '@playwright/test';

test('staff table uses Persian paginator labels and renders optional translator data cleanly', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('نام کاربری').fill('admin');
  await page.getByRole('textbox', { name: 'رمز عبور' }).fill('admin');
  await page.getByRole('button', { name: 'ورود' }).click();
  await expect(page).toHaveURL(/\/book/);
  await expect(page.getByText('تعداد در هر صفحه')).toBeVisible();
  await expect(page.locator('.mat-mdc-paginator-range-label')).toContainText('از');
  await expect(page.locator('app-list')).not.toContainText('undefined');
  await expect(page.getByText('Items per page')).toHaveCount(0);
});

test('mobile staff book cards expand to contain their cells and paginator', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 1024) >= 768, 'mobile layout only');
  await page.goto('/login');
  await page.getByLabel('نام کاربری').fill('admin');
  await page.getByRole('textbox', { name: 'رمز عبور' }).fill('admin');
  await page.getByRole('button', { name: 'ورود' }).click();
  await expect(page).toHaveURL(/\/book/);
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
