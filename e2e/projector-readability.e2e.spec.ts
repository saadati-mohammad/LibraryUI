import { test, expect } from '@playwright/test';

test('staff layout stays readable and uses the viewport at projector zoom-out scale', async ({ page }) => {
  // A 4× CSS viewport approximates viewing a 1366×768 desktop at 25% browser zoom.
  await page.setViewportSize({ width: 5464, height: 3072 });
  await page.goto('/login');
  await page.getByLabel('نام کاربری').fill('admin');
  await page.getByRole('textbox', { name: 'رمز عبور' }).fill('admin');
  await page.getByRole('button', { name: 'ورود' }).click();
  await expect(page).toHaveURL(/\/book/);

  const metrics = await page.evaluate(() => {
    const container = document.querySelector<HTMLElement>('main .container');
    const heading = document.querySelector<HTMLElement>('main h1, main h2');
    const rootSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    const headingSize = heading ? Number.parseFloat(getComputedStyle(heading).fontSize) : 0;
    return {
      viewportWidth: window.innerWidth,
      containerWidth: container?.getBoundingClientRect().width ?? 0,
      rootSize,
      headingSize,
    };
  });

  expect(metrics.containerWidth / metrics.viewportWidth).toBeGreaterThan(0.9);
  // Scale CSS pixels back to the 768px physical display height represented by this test.
  expect(metrics.rootSize * 0.25).toBeGreaterThanOrEqual(15);
  expect(metrics.headingSize * 0.25).toBeGreaterThanOrEqual(18);
});
