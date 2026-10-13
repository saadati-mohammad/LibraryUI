import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { Buffer } from 'node:buffer';

/**
 * Verifies the shared Material confirmation dialog replaced the blocking native
 * `confirm()` for destructive actions. We drive the loan "return" action because it
 * create isolated member/book/loan data through the authenticated API, open the
 * return dialog, assert its accessible content, then cancel without changing state.
 *
 * Assumes the backend is running on :8079 (the dev server proxies /api to it — see
 * proxy.conf.json) with the development admin credentials.
 */
async function login(page: Page): Promise<string> {
  await page.goto('/login');
  await page.getByLabel('نام کاربری').fill('admin');
  await page.getByRole('textbox', { name: 'رمز عبور' }).fill('admin');
  await page.getByRole('button', { name: 'ورود' }).click();
  await expect(page).toHaveURL(/\/book/, { timeout: 15_000 });
  const token = await page.evaluate(() => localStorage.getItem('library.auth.token'));
  expect(token).toBeTruthy();
  return token!;
}

async function createMultipart(
  request: APIRequestContext,
  path: string,
  partName: string,
  entity: Record<string, unknown>,
  token: string,
): Promise<Record<string, unknown>> {
  const response = await request.post(`http://localhost:4200${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    multipart: {
      [partName]: {
        name: `${partName}.json`,
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(entity)),
      },
    },
  });
  expect(response.status()).toBe(201);
  return response.json();
}

function uniqueIsbn10(seed: string): string {
  const body = seed.replace(/\D/g, '').slice(-9).padStart(9, '0');
  const sum = [...body].reduce((total, digit, index) => total + Number(digit) * (10 - index), 0);
  const check = (11 - sum % 11) % 11;
  return `${body}${check === 10 ? 'X' : check}`;
}

test.describe('Shared confirmation dialog', () => {
  test('loan return opens an accessible confirm dialog and cancel is a no-op', async ({ page, request }) => {
    const token = await login(page);
    const unique = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
    const person = await createMultipart(request, '/api/person', 'person', {
      firstName: 'آزمون',
      lastName: `عضو ${unique}`,
      email: `e2e-${unique}@example.test`,
      nationalId: unique.replaceAll('-', '').slice(-10).padStart(10, '0'),
      active: true,
    }, token);
    const book = await createMultipart(request, '/api/book', 'book', {
      title: `امانت آزمون ${unique}`,
      author: 'نویسنده آزمون',
      subject: 'آزمون',
      isbn10: '0306406152',
      active: true,
    }, token);
    const loanResponse = await request.post('http://localhost:4200/api/loan', {
      headers: { Authorization: `Bearer ${token}` },
      data: { personId: person['id'], bookId: book['id'] },
    });
    expect(loanResponse.status()).toBe(201);
    const loansLink = page.getByRole('link', { name: 'امانت‌ها' }).first();
    if (await loansLink.isVisible()) {
      await loansLink.click();
    } else {
      await page.getByRole('button', { name: 'منوی اصلی' }).click();
      await page.getByRole('menuitem', { name: 'امانت‌ها' }).click();
    }
    await expect(page).toHaveURL(/\/loan/, { timeout: 15_000 });

    const loanRow = page.getByRole('row').filter({ hasText: String(book['title']) });
    const returnButton = loanRow.getByRole('button', { name: 'بازگشت' });
    await expect(returnButton).toBeVisible();

    await returnButton.click();

    // The accessible dialog (role=dialog) must appear — not a native window.confirm.
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog).toContainText('ثبت بازگشت');

    // Cancelling closes the dialog and does not navigate or mutate.
    await page.getByRole('button', { name: 'انصراف' }).click();
    await expect(dialog).toBeHidden({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/loan/);
  });

  test('creates a loan through the form and confirms its return', async ({ page, request }) => {
    const token = await login(page);
    const unique = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
    const person = await createMultipart(request, '/api/person', 'person', {
      firstName: `آزمون${unique.replaceAll('-', '').slice(-4)}`,
      lastName: `عضو فرم ${unique}`,
      email: `loan-form-${unique}@example.test`,
      nationalId: unique.replaceAll('-', '').slice(-10).padStart(10, '0'),
      active: true,
    }, token);
    const book = await createMultipart(request, '/api/book', 'book', {
      title: `کتاب امانت فرم ${unique}`,
      author: 'نویسنده آزمون',
      subject: 'آزمون',
      isbn10: uniqueIsbn10(unique),
      active: true,
    }, token);

    await page.goto('/loan');
    await page.getByRole('button', { name: 'ثبت امانت جدید' }).click();
    const modal = page.locator('app-modal').filter({ has: page.locator('#loanFormInternal') });
    await expect(modal).toBeVisible();

    await page.locator('#loanPersonInput').fill(String(person['firstName']));
    const personOption = page.getByRole('option').filter({ hasText: String(person['lastName']) });
    await expect(personOption).toBeVisible({ timeout: 10_000 });
    await personOption.click();

    await page.locator('#loanBarcodeInput').fill(String(book['isbn10']));
    await page.locator('#loanBarcodeInput').press('Enter');
    await expect(page.locator('#loanFormInternal [role="status"]')).toContainText(`کتاب «${book['title']}» انتخاب شد.`, { timeout: 10_000 });
    await expect(page.locator('#loanBookInput')).toHaveValue(`${book['title']} — نویسنده آزمون`);

    const createdPromise = page.waitForResponse((response) =>
      response.request().method() === 'POST' && response.url().endsWith('/api/loan'),
    );
    await page.getByRole('button', { name: 'ثبت امانت', exact: true }).click();
    const created = await createdPromise;
    expect(created.status()).toBe(201);
    const loan = await created.json() as { id: number };
    await expect(modal).toBeHidden();

    const row = page.getByRole('row').filter({ hasText: String(book['title']) });
    await expect(row).toBeVisible();
    const returnButton = row.getByRole('button', { name: new RegExp(`ثبت بازگشت کتاب.*${String(book['title'])}`) });
    await returnButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const returnedPromise = page.waitForResponse((response) =>
      response.request().method() === 'PUT'
      && response.url().includes(`/api/loan/${loan.id}/return`),
    );
    await dialog.getByRole('button', { name: 'ثبت بازگشت' }).click();
    expect((await returnedPromise).ok()).toBe(true);
    await expect(row.getByText('بازگشتی')).toBeVisible({ timeout: 10_000 });
  });
});
