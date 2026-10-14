import { expect, Page, test } from '@playwright/test';

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

test.describe('People workflow', () => {
  test('creates a member in the UI and deactivates it with confirmation', async ({ page, request }) => {
    const token = await login(page);
    const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-10);
    const lastName = `عضو ${unique}`;

    await page.goto('/person');
    await page.getByRole('button', { name: 'افزودن عضو جدید' }).click();
    const modal = page.locator('app-modal').filter({ has: page.locator('#personFormInternal') });
    await expect(modal).toBeVisible();
    await page.locator('#personFirstName').fill('آزمون');
    await page.locator('#personLastName').fill(lastName);
    await page.locator('#personNationalId').fill(unique);
    await page.locator('#personEmail').fill(`person-${unique}@example.test`);
    const createdPromise = page.waitForResponse((response) =>
      response.request().method() === 'POST' && response.url().includes('/api/person'),
    );
    await page.getByRole('button', { name: 'ذخیره عضو' }).click();
    const createdResponse = await createdPromise;
    expect(createdResponse.status()).toBe(201);
    // The UI closes the modal and immediately refreshes the list. On slower CI browsers,
    // Chromium may discard the POST response body during that navigation; retrieve the
    // persisted record through the independent API request context instead.
    const createdList = await request.get(
      `http://localhost:4200/api/person?nationalId=${encodeURIComponent(unique)}&page=0&size=10`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(createdList.ok()).toBe(true);
    const people = await createdList.json() as { content: Array<{ id: number; lastName: string; nationalId: string }> };
    const person = people.content.find(item => item.nationalId === unique);
    if (!person) throw new Error(`Created member ${unique} was not returned by the catalog API`);
    expect(person.lastName).toBe(lastName);
    await expect(modal).toBeHidden();

    const row = page.getByRole('row').filter({ hasText: lastName });
    await expect(row).toBeVisible();

    const deactivate = row.getByRole('button', { name: 'غیرفعال سازی عضو' });
    await deactivate.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const responsePromise = page.waitForResponse((response) =>
      response.request().method() === 'DELETE'
      && response.url().includes(`/api/person/${person.id}`),
    );
    await dialog.getByRole('button', { name: /تایید|غیرفعال/ }).click();
    const response = await responsePromise;
    expect(response.ok()).toBe(true);

    const persisted = await request.get(`http://localhost:4200/api/person/${person.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(persisted.ok()).toBe(true);
    expect((await persisted.json()).active).toBe(false);
  });
});
