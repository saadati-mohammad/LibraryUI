import { test } from '@playwright/test';

/** Diagnostic: at 320px, report which elements exceed the viewport width on each page. */
test('diagnose overflow offenders at 320px', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('نام کاربری').fill('admin');
  await page.getByLabel('رمز عبور').fill('admin');
  await page.getByRole('button', { name: 'ورود' }).click();
  await page.waitForURL(/\/book/, { timeout: 15_000 });

  await page.setViewportSize({ width: 320, height: 800 });
  for (const path of ['/book', '/person', '/loan']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(400);
    const offenders = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const out: { tag: string; cls: string; right: number; width: number }[] = [];
      document.querySelectorAll('*').forEach((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        if (r.right > vw + 1 && r.width > 0) {
          out.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.getAttribute('class') || '').slice(0, 80),
            right: Math.round(r.right),
            width: Math.round(r.width),
          });
        }
      });
      // Keep the widest / furthest-right few.
      return out.sort((a, b) => b.right - a.right).slice(0, 8);
    });
    console.log(`==== ${path} @320px offenders ====\n` + JSON.stringify(offenders, null, 2));
  }
});
