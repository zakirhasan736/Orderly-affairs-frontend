import { test, expect } from '@playwright/test';
import { stubAuthApis } from './helpers/stubs';

test.describe('Form submission', () => {
  test.beforeEach(async ({ page }) => {
    await stubAuthApis(page);
  });

  test('blocks empty credential submit via HTML required fields', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('[data-cy=auth-credentials-form]')).toBeVisible();
    await page.locator('[data-cy=auth-submit]').click();

    const invalid = await page
      .locator('[data-cy=auth-email]')
      .evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(invalid).toBe(true);
  });

  test('submits forgot-password form to reset API', async ({ page }) => {
    const resetPromise = page.waitForRequest(
      req =>
        req.url().includes('/auth/request-password-reset') &&
        req.method() === 'POST',
    );

    await page.goto('/');
    await expect(page.locator('[data-cy=auth-credentials-form]')).toBeVisible();
    await page.locator('[data-cy=auth-forgot-password]').click();
    await expect(
      page.getByRole('button', { name: /send reset code/i }),
    ).toBeVisible();

    await page.locator('input[type="email"]:visible').fill('reset@example.com');
    await page.getByRole('button', { name: /send reset code/i }).click();

    const req = await resetPromise;
    expect(req.postDataJSON().email).toBe('reset@example.com');
  });
});
