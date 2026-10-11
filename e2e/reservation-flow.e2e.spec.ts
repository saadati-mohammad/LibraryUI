import { APIRequestContext, expect, Page, test } from '@playwright/test';
import { Buffer } from 'node:buffer';

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

async function createEntity(
  request: APIRequestContext,
  path: string,
  part: string,
  entity: Record<string, unknown>,
  token: string,
): Promise<Record<string, unknown>> {
  const response = await request.post(`http://localhost:4200${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    multipart: {
      [part]: {
        name: `${part}.json`,
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(entity)),
      },
    },
  });
  expect(response.status()).toBe(201);
  return response.json();
}

test.describe('Reservation workflow', () => {
  test('fulfills an active reservation through the UI and API', async ({ page, request }) => {
    const token = await login(page);
    const unique = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
    const person = await createEntity(request, '/api/person', 'person', {
      firstName: 'آزمون',
      lastName: `رزرو ${unique}`,
      email: `reservation-${unique}@example.test`,
      nationalId: unique.replaceAll('-', '').slice(-10).padStart(10, '0'),
      active: true,
    }, token);
    const book = await createEntity(request, '/api/book', 'book', {
      title: `کتاب رزرو ${unique}`,
      author: 'نویسنده آزمون',
      subject: 'آزمون',
      isbn10: `8${unique.replaceAll('-', '').slice(-9)}`,
      active: true,
    }, token);
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const createResponse = await request.post(
      `http://localhost:4200/api/reservations?personId=${person['id']}&bookId=${book['id']}&expiryDate=${expiryDate}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(createResponse.status()).toBe(201);
    const reservation = await createResponse.json() as { id: number };

    await page.goto('/reservation');
    const row = page.getByRole('row').filter({ hasText: String(book['title']) });
    const fulfillButton = row.getByRole('button', { name: new RegExp(`تحویل رزرو کتاب.*${String(person['firstName'])}`) });
    await expect(fulfillButton).toBeVisible();
    await fulfillButton.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(String(book['title']));
    const fulfilledResponse = page.waitForResponse(
      (response) => response.request().method() === 'PUT'
        && response.url().includes(`/api/reservations/${reservation.id}/fulfill`),
    );
    await page.getByRole('button', { name: 'تحویل شد' }).click();
    expect((await fulfilledResponse).status()).toBe(200);
    await expect(row).toBeHidden();

    const activeResponse = await request.get('http://localhost:4200/api/reservations/active', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(activeResponse.ok()).toBe(true);
    const active = await activeResponse.json() as Array<{ id: number }>;
    expect(active.some((item) => item.id === reservation.id)).toBe(false);

    const loansResponse = await request.get('http://localhost:4200/api/loan?size=100&page=0&sort=id,desc', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(loansResponse.ok()).toBe(true);
    const loans = await loansResponse.json() as { content: Array<{ bookId: number; personId: number }> };
    expect(loans.content.some((loan) => loan.bookId === book['id'] && loan.personId === person['id'])).toBe(true);
  });

  test('cancels an active reservation through the UI and persists the cancelled status', async ({ page, request }) => {
    const token = await login(page);
    const unique = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
    const person = await createEntity(request, '/api/person', 'person', {
      firstName: 'آزمون', lastName: `لغو رزرو ${unique}`,
      email: `reservation-cancel-${unique}@example.test`,
      nationalId: unique.replaceAll('-', '').slice(-10).padStart(10, '0'), active: true,
    }, token);
    const book = await createEntity(request, '/api/book', 'book', {
      title: `کتاب لغو رزرو ${unique}`, author: 'نویسنده آزمون', subject: 'آزمون',
      isbn10: `9${unique.replaceAll('-', '').slice(-9)}`, active: true,
    }, token);
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const response = await request.post(
      `http://localhost:4200/api/reservations?personId=${person['id']}&bookId=${book['id']}&expiryDate=${expiryDate}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(response.status()).toBe(201);
    const reservation = await response.json() as { id: number };

    await page.goto('/reservation');
    const row = page.getByRole('row').filter({ hasText: String(book['title']) });
    await row.getByRole('button', { name: new RegExp(`لغو رزرو کتاب.*${String(person['firstName'])}`) }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(String(book['title']));
    const cancelled = page.waitForResponse((res) => res.request().method() === 'PUT'
      && res.url().includes(`/api/reservations/${reservation.id}/cancel`));
    await dialog.getByRole('button', { name: 'لغو رزرو', exact: true }).click();
    expect((await cancelled).status()).toBe(200);
    await expect(row).toBeHidden();

    const active = await request.get('http://localhost:4200/api/reservations/active', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const reservations = await active.json() as Array<{ id: number }>;
    expect(reservations.some((item) => item.id === reservation.id)).toBe(false);
  });
});
