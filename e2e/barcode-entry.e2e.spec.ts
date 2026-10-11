import { expect, test } from '@playwright/test';

test('barcode entry rejects unsupported values and keeps manual entry available', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => {
          throw new DOMException('Camera permission denied by the test', 'NotAllowedError');
        },
      },
    });
  });
  await page.goto('/login');
  await page.getByLabel('نام کاربری').fill('admin');
  await page.getByRole('textbox', { name: 'رمز عبور' }).fill('admin');
  await page.getByRole('button', { name: 'ورود' }).click();
  await expect(page).toHaveURL(/\/book/);
  await page.getByRole('button', { name: 'افزودن کتاب جدید' }).click();

  await page.getByRole('button', { name: 'اسکن با دوربین گوشی' }).click();
  await expect(page.locator('#barcodeStatus')).toContainText('اجازهٔ دوربین داده نشد');
  await expect(page.locator('#bookTitleForm')).toBeVisible();

  const scan = page.getByLabel('اسکن بارکد کتاب یا ورود شابک');
  await scan.fill('12345');
  await scan.press('Enter');
  await expect(page.locator('#barcodeStatus')).toContainText('بارکد شابک معتبر نیست');
  await page.locator('#bookTitleForm').fill('عنوان ورود دستی');
  await page.locator('#bookIsbn10Form').fill('12345');
  await expect(page.locator('#bookTitleForm')).toHaveValue('عنوان ورود دستی');
  await expect(page.getByRole('button', { name: 'ذخیره کتاب' })).toBeDisabled();
});

test('continuous wedge scanning registers consecutive books without extra clicks', async ({ page }) => {
  const saved: unknown[] = [];
  await page.route('**/api/book**', async (route) => {
    if (route.request().url().includes('/metadata/isbn/')) {
      await route.fallback();
      return;
    }
    if (route.request().method() === 'POST') {
      saved.push(route.request().postData());
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: saved.length }) });
      return;
    }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 }) });
  });
  await page.route('**/api/book/metadata/isbn/*', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify([{
      title: 'کتاب آزمایشی', author: 'نویسنده آزمایشی', publisher: 'ناشر',
      isbn10: '0306406152', isbn13: '9780306406157', publicationYear: 2020,
      pageCount: 200, language: 'fa', subject: 'آزمایش', subjects: ['آزمایش'],
    }]),
  }));
  await page.goto('/login');
  await page.getByLabel('نام کاربری').fill('admin');
  await page.getByRole('textbox', { name: 'رمز عبور' }).fill('admin');
  await page.getByRole('button', { name: 'ورود' }).click();
  await expect(page).toHaveURL(/\/book/);
  await page.getByRole('button', { name: 'افزودن کتاب جدید' }).click();
  await page.getByLabel('ثبت پیوسته').check();
  const scanner = page.getByLabel('اسکن بارکد کتاب یا ورود شابک');
  await scanner.fill('9780306406157');
  await scanner.press('Enter');
  await expect(page.locator('#barcodeStatus')).toContainText('کتاب ثبت شد؛ بارکد بعدی را اسکن کنید.', { timeout: 10_000 });
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(scanner).toBeFocused();
  await scanner.fill('9780306406157');
  await scanner.press('Enter');
  await expect.poll(() => saved.length).toBe(2);
  await expect(page.locator('#barcodeStatus')).toContainText('کتاب ثبت شد؛ بارکد بعدی را اسکن کنید.');
  await expect(page.getByRole('dialog')).toBeVisible();
});
