import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const publicRoutes = ['/', '/catalog', '/categories', '/login', '/register'];
const staffRoutes = ['/dashboard', '/book', '/person', '/loan', '/reservation'];

async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('نام کاربری').fill('admin');
  await page.getByRole('textbox', { name: 'رمز عبور' }).fill('admin');
  await page.getByRole('button', { name: 'ورود' }).click();
  await expect(page).toHaveURL(/\/book/);
}

async function expectReadableText(page: Page, route: string, theme: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  const font = await page.evaluate(() => ({
    family: getComputedStyle(document.body).fontFamily,
    loaded: document.fonts.check('400 16px "Vazirmatn Variable"', 'کتابخانه فارسی'),
    size: Number.parseFloat(getComputedStyle(document.body).fontSize),
  }));
  expect(font.loaded, `${route} (${theme}) must load the bundled Persian font: ${font.family}`).toBe(true);
  expect(font.size, `${route} (${theme}) body type should remain comfortably readable`).toBeGreaterThanOrEqual(16);

  const result = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  expect(
    result.violations,
    `Text contrast violations on ${route} (${theme}):\n${JSON.stringify(result.violations, null, 2)}`,
  ).toHaveLength(0);
}

test.describe('Typography and text contrast', () => {
  test('public pages load Persian typography and meet WCAG text contrast', async ({ page }) => {
    for (const route of publicRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle').catch(() => {});
      await expectReadableText(page, route, 'light');
      await expect(page.locator('body')).toHaveCSS('font-family', /Vazirmatn Variable/);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `${route} should not overflow horizontally at this viewport`,
      ).toBe(true);
    }
  });

  test('staff pages keep readable typography and contrast in both themes', async ({ page }) => {
    await loginAsAdmin(page);
    for (const theme of ['light', 'dark']) {
      for (const route of staffRoutes) {
        await page.goto(route);
        await page.waitForLoadState('networkidle').catch(() => {});
        if (theme === 'dark' && await page.locator('html').getAttribute('data-theme') !== 'dark') {
          await page.getByRole('button', { name: /پوسته تیره/ }).click();
        }
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await expectReadableText(page, route, theme);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          `${route} (${theme}) should not overflow horizontally at this viewport`,
        ).toBe(true);
      }
      if (theme === 'dark') {
        await page.getByRole('button', { name: /پوسته روشن/ }).click();
      }
    }
  });
});
