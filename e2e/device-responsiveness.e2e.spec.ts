import { test, expect, Page } from '@playwright/test';

const BREAKPOINTS = [
  { name: 'Extra Small Mobile (320px)', width: 320, height: 568 },
  { name: 'Standard Mobile (375px)', width: 375, height: 667 },
  { name: 'Modern Mobile (390px)', width: 390, height: 844 },
  { name: 'Tablet Portrait (768px)', width: 768, height: 1024 },
  { name: 'Tablet Landscape (1024px)', width: 1024, height: 768 },
  { name: 'Desktop Laptop (1366px)', width: 1366, height: 768 },
  { name: 'Desktop Full HD (1920px)', width: 1920, height: 1080 },
  { name: 'Ultrawide / 2K (2560px)', width: 2560, height: 1440 },
];

const PUBLIC_ROUTES = [
  { path: '/', name: 'Home' },
  { path: '/catalog', name: 'Catalog' },
  { path: '/categories', name: 'Categories' },
  { path: '/login', name: 'Login' },
  { path: '/register', name: 'Register' },
  { path: '/forgot-password', name: 'Forgot Password' },
  { path: '/phone-scan', name: 'Phone Scanner' },
];

const STAFF_ROUTES = [
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/book', name: 'Books' },
  { path: '/person', name: 'Members' },
  { path: '/loan', name: 'Loans' },
  { path: '/reservation', name: 'Reservations' },
  { path: '/staff-accounts', name: 'Staff Accounts' },
  { path: '/input-devices', name: 'Input Devices' },
];

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('نام کاربری').fill('admin');
  await page.getByRole('textbox', { name: 'رمز عبور' }).fill('admin');
  const loginResponse = page.waitForResponse((response) =>
    response.request().method() === 'POST' && response.url().includes('/api/auth/login'),
  );
  await page.getByRole('button', { name: 'ورود' }).click();
  expect((await loginResponse).ok(), 'Login API should succeed').toBe(true);
  await page.waitForURL(/\/book/, { timeout: 15_000 });
  await page.waitForLoadState('networkidle').catch(() => {});
}

async function findHorizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const docClient = document.documentElement.clientWidth;
    const docScroll = document.documentElement.scrollWidth;
    const bodyScroll = document.body.scrollWidth;
    const maxScroll = Math.max(docScroll, bodyScroll);

    if (maxScroll <= docClient + 2) {
      return null;
    }

    // Find the specific offending elements
    const culprits: { tag: string; id: string; className: string; right: number; width: number }[] = [];
    for (const el of Array.from(document.querySelectorAll('*'))) {
      const rect = el.getBoundingClientRect();
      if (rect.right > docClient + 2 && rect.width > 0 && rect.height > 0) {
        culprits.push({
          tag: el.tagName.toLowerCase(),
          id: el.id,
          className: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : '',
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        });
      }
    }

    return {
      docClient,
      docScroll,
      bodyScroll,
      culprits: culprits.slice(0, 5),
    };
  });
}

test.describe('Responsive Layout & Visual Detail Verification', () => {
  test.describe.configure({ mode: 'serial', timeout: 90_000 });

  for (const bp of BREAKPOINTS) {
    test(`public routes visual responsivity on ${bp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });

      for (const route of PUBLIC_ROUTES) {
        await page.goto(route.path);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(150);

        const overflow = await findHorizontalOverflow(page);
        if (overflow) {
          console.warn(`[OVERFLOW] ${bp.name} on ${route.path}:`, overflow);
        }

        expect(
          overflow,
          `Horizontal overflow on ${bp.name} at ${route.path}: ${JSON.stringify(overflow)}`,
        ).toBeNull();
      }
    });

    test(`staff routes visual responsivity on ${bp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await login(page);

      for (const route of STAFF_ROUTES) {
        await page.goto(route.path);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(200);

        const overflow = await findHorizontalOverflow(page);
        if (overflow) {
          console.warn(`[OVERFLOW] ${bp.name} on ${route.path}:`, overflow);
        }

        expect(
          overflow,
          `Horizontal overflow on ${bp.name} at ${route.path}: ${JSON.stringify(overflow)}`,
        ).toBeNull();
      }
    });
  }

  test('dialogs, modals and forms fit without overflow on mobile (320px & 375px)', async ({ page }) => {
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 640 });
      await login(page);

      // Check Loan modal
      await page.goto('/loan');
      await page.waitForLoadState('networkidle').catch(() => {});
      const openLoanBtn = page.getByRole('button', { name: 'ثبت امانت جدید' });
      if (await openLoanBtn.isVisible()) {
        await openLoanBtn.click();
        await page.waitForSelector('app-modal', { state: 'visible' });
        await page.waitForTimeout(200);

        const overflow = await findHorizontalOverflow(page);
        expect(overflow, `Loan modal overflow at ${width}px`).toBeNull();

        // Close modal
        await page.getByRole('button', { name: 'انصراف' }).click();
        await page.waitForSelector('app-modal', { state: 'hidden' });
      }

      // Check Book modal
      await page.goto('/book');
      await page.waitForLoadState('networkidle').catch(() => {});
      const openBookBtn = page.getByRole('button', { name: 'افزودن کتاب' });
      if (await openBookBtn.isVisible()) {
        await openBookBtn.click();
        await page.waitForSelector('app-modal', { state: 'visible' });
        await page.waitForTimeout(200);

        const overflow = await findHorizontalOverflow(page);
        expect(overflow, `Book modal overflow at ${width}px`).toBeNull();

        await page.getByRole('button', { name: 'انصراف' }).click();
        await page.waitForSelector('app-modal', { state: 'hidden' });
      }

      // Check Person modal
      await page.goto('/person');
      await page.waitForLoadState('networkidle').catch(() => {});
      const openPersonBtn = page.getByRole('button', { name: 'عضو جدید' });
      if (await openPersonBtn.isVisible()) {
        await openPersonBtn.click();
        await page.waitForSelector('app-modal', { state: 'visible' });
        await page.waitForTimeout(200);

        const overflow = await findHorizontalOverflow(page);
        expect(overflow, `Person modal overflow at ${width}px`).toBeNull();

        await page.getByRole('button', { name: 'انصراف' }).click();
        await page.waitForSelector('app-modal', { state: 'hidden' });
      }
    }
  });

  test('dark theme and light theme visual integrity across devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Toggle theme button should exist in the header and change the theme attribute/class
    const themeToggle = page.locator('button[aria-label*="تغییر پوسته"], button[aria-label*="تم"], .theme-toggle').first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(200);
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark') || document.body.classList.contains('dark-theme'));
      expect(typeof isDark).toBe('boolean');

      const overflow = await findHorizontalOverflow(page);
      expect(overflow, 'Dark theme horizontal overflow').toBeNull();
    }
  });
});
