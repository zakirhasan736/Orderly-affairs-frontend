import { test, expect } from '@playwright/test';
import { fillLoginForm, stubAuthApis } from './helpers/stubs';

test.describe('API interactions', () => {
  test('sends login payload to /auth/login', async ({ page }) => {
    await stubAuthApis(page);
    const loginPromise = page.waitForRequest(
      req => req.url().includes('/auth/login') && req.method() === 'POST',
    );

    await page.goto('/');
    await fillLoginForm(page, 'api.user@example.com', 'Password123!');
    await page.locator('[data-cy=auth-submit]').click();

    const req = await loginPromise;
    const body = req.postDataJSON();
    expect(body.email).toBe('api.user@example.com');
    expect(typeof body.password).toBe('string');
  });

  test('calls session after successful login', async ({ page }) => {
    await stubAuthApis(page, { session: { requires_billing: false } });

    await page.goto('/');
    await fillLoginForm(page, 'api.user@example.com', 'Password123!');
    await page.locator('[data-cy=auth-submit]').click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  });

  test('surfaces rate-limit API responses on the login form', async ({
    page,
  }) => {
    await stubAuthApis(page);
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 429,
        headers: { 'Retry-After': '45' },
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Please try again in 45 seconds.',
          retry_after_seconds: 45,
        }),
      });
    });

    await page.goto('/');
    await fillLoginForm(page, 'limited@example.com', 'Password123!');
    await page.locator('[data-cy=auth-submit]').click();

    await expect(
      page.getByText(/45 seconds|please wait|try again/i).first(),
    ).toBeVisible();
  });
});
