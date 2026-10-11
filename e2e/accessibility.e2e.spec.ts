import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility audit using axe-core against the real rendered pages. Every reported
 * violation fails the test so minor/moderate regressions are caught as well. Assumes the
 * backend is running on :8079 (proxied by the dev server).
 */
async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('نام کاربری').fill('admin');
  await page.getByRole('textbox', { name: 'رمز عبور' }).fill('admin');
  await page.getByRole('button', { name: 'ورود' }).click();
  await expect(page).toHaveURL(/\/book/, { timeout: 15_000 });
}

async function scan(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).analyze();
  if (results.violations.length) {
    console.log(
      `==== axe violations on ${label} ====\n` +
        JSON.stringify(
          results.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.map((node) => ({ target: node.target, html: node.html })),
            help: v.help,
          })),
          null,
          2,
        ),
    );
  }
  return results.violations;
}

test.describe('Accessibility', () => {
  test('login page has no axe violations', async ({ page }) => {
    await page.goto('/login');
    const violations = await scan(page, 'login');
    expect(violations, `A11y violations:\n${JSON.stringify(violations, null, 2)}`).toHaveLength(0);
  });

  test('book page has no axe violations', async ({ page }) => {
    await login(page);
    await page.waitForLoadState('networkidle').catch(() => {});
    const violations = await scan(page, 'book');
    expect(violations, `A11y violations:\n${JSON.stringify(violations, null, 2)}`).toHaveLength(0);
  });

  test('people page has no axe violations', async ({ page }) => {
    await login(page);
    await page.goto('/person');
    await page.waitForLoadState('networkidle').catch(() => {});
    const violations = await scan(page, 'people');
    expect(violations, `A11y violations:\n${JSON.stringify(violations, null, 2)}`).toHaveLength(0);
  });

  test('reservations page has no axe violations', async ({ page }) => {
    await login(page);
    await page.goto('/reservation');
    await page.waitForLoadState('networkidle').catch(() => {});
    const violations = await scan(page, 'reservations');
    expect(violations, `A11y violations:\n${JSON.stringify(violations, null, 2)}`).toHaveLength(0);
  });

  test('dashboard page has no axe violations', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle').catch(() => {});
    const violations = await scan(page, 'dashboard');
    expect(violations, `A11y violations:\n${JSON.stringify(violations, null, 2)}`).toHaveLength(0);
  });

  test('loan modal has no axe violations', async ({ page }) => {
    await login(page);
    await page.goto('/loan');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.getByRole('button', { name: /ثبت امانت جدید/ }).click();
    await page.waitForTimeout(500);
    const violations = await scan(page, 'loan modal');
    expect(violations, `A11y violations:\n${JSON.stringify(violations, null, 2)}`).toHaveLength(0);
  });
});
