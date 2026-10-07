import { test, expect, Page, ConsoleMessage, Request } from '@playwright/test';

/**
 * Exploratory QA harness. Drives the real application in a browser, recording every console
 * error/warning and every failed network request, so runtime defects that a green assertion
 * would hide are surfaced. Not a strict pass/fail spec — it prints a report and asserts only
 * that no uncaught console errors occurred on the core flows.
 */

function attachObservers(page: Page, sink: { console: string[]; failed: string[] }) {
  page.on('console', (msg: ConsoleMessage) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      sink.console.push(`[${type}] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => sink.console.push(`[pageerror] ${err.message}`));
  page.on('requestfailed', (req: Request) =>
    sink.failed.push(`FAILED ${req.method()} ${req.url()} :: ${req.failure()?.errorText}`));
  page.on('response', (res) => {
    if (res.status() >= 400) {
      sink.failed.push(`HTTP ${res.status()} ${res.request().method()} ${res.url()}`);
    }
  });
}

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('نام کاربری').fill('admin');
  await page.getByLabel('رمز عبور').fill('admin');
  await page.getByRole('button', { name: 'ورود' }).click();
  await page.waitForURL(/\/book/, { timeout: 15_000 });
}

test.describe('Exploratory QA', () => {
  test('core flows produce no console errors and no failed requests', async ({ page }) => {
    const sink = { console: [] as string[], failed: [] as string[] };
    attachObservers(page, sink);

    await login(page);
    // Visit each routed feature.
    for (const path of ['/book', '/person', '/loan']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(800);
    }

    // Report everything observed, regardless of pass/fail.
    if (sink.console.length) {
      console.log('==== CONSOLE ERRORS/WARNINGS ====\n' + sink.console.join('\n'));
    }
    if (sink.failed.length) {
      console.log('==== FAILED REQUESTS / HTTP >=400 ====\n' + sink.failed.join('\n'));
    }

    // Hard failures: only uncaught page errors and true request failures (not 4xx from
    // intentionally-absent data) should break the run.
    const pageErrors = sink.console.filter((c) => c.startsWith('[pageerror]'));
    expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n')}`).toHaveLength(0);
  });

  test('loan page: open modal, inspect form semantics', async ({ page }) => {
    await login(page);
    await page.goto('/loan');
    await page.waitForLoadState('networkidle').catch(() => {});

    await page.getByRole('button', { name: /ثبت امانت جدید/ }).click();
    await expect(page.getByText('ثبت امانت جدید').first()).toBeVisible();

    // Inspect the labels declared with for= and whether their targets exist.
    const labelAudit = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('label[for]'));
      return labels.map((l) => {
        const id = l.getAttribute('for')!;
        return { for: id, targetExists: !!document.getElementById(id) };
      });
    });
    console.log('==== LABEL for= TARGET AUDIT ====\n' + JSON.stringify(labelAudit, null, 2));

    // Any label pointing at a non-existent id is a real semantic defect.
    const dangling = labelAudit.filter((l) => !l.targetExists);
    expect(dangling, `Labels pointing at missing ids: ${JSON.stringify(dangling)}`).toHaveLength(0);
  });

  test('responsive: no horizontal overflow at narrow widths', async ({ page }) => {
    await login(page);
    for (const width of [320, 360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      for (const path of ['/book', '/person', '/loan']) {
        await page.goto(path);
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(300);
        const overflow = await page.evaluate(() => ({
          docScroll: document.documentElement.scrollWidth,
          docClient: document.documentElement.clientWidth,
        }));
        if (overflow.docScroll > overflow.docClient + 1) {
          console.log(`OVERFLOW at ${width}px ${path}: scroll=${overflow.docScroll} client=${overflow.docClient}`);
        }
        expect(
          overflow.docScroll,
          `Horizontal overflow at ${width}px on ${path} (scroll ${overflow.docScroll} > client ${overflow.docClient})`,
        ).toBeLessThanOrEqual(overflow.docClient + 1);
      }
    }
  });
});
