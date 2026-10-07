import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility audit using axe-core against the real rendered pages. Serious/critical
 * violations fail the test so regressions are caught; minor/moderate findings are printed
 * for review. Assumes the backend is running on :8080.
 */
async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('نام کاربری').fill('admin');
  await page.getByLabel('رمز عبور').fill('admin');
  await page.getByRole('button', { name: 'ورود' }).click();
  await expect(page).toHaveURL(/\/book/, { timeout: 15_000 });
}

async function scan(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  if (results.violations.length) {
    console.log(
      `==== axe violations on ${label} ====\n` +
        JSON.stringify(
          results.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.length,
            help: v.help,
          })),
          null,
          2,
        ),
    );
  }
  return serious;
}

test.describe('Accessibility', () => {
  test('login page has no serious/critical violations', async ({ page }) => {
    await page.goto('/login');
    const serious = await scan(page, 'login');
    expect(serious, `Serious a11y violations:\n${JSON.stringify(serious, null, 2)}`).toHaveLength(0);
  });

  test('book page has no serious/critical violations', async ({ page }) => {
    await login(page);
    await page.waitForLoadState('networkidle').catch(() => {});
    const serious = await scan(page, 'book');
    expect(serious, `Serious a11y violations:\n${JSON.stringify(serious, null, 2)}`).toHaveLength(0);
  });

  test('loan modal has no serious/critical violations', async ({ page }) => {
    await login(page);
    await page.goto('/loan');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.getByRole('button', { name: /ثبت امانت جدید/ }).click();
    await page.waitForTimeout(500);
    const serious = await scan(page, 'loan modal');
    expect(serious, `Serious a11y violations:\n${JSON.stringify(serious, null, 2)}`).toHaveLength(0);
  });
});
