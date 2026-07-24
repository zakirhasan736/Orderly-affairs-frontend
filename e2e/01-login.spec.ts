import { test, expect } from '@playwright/test';
import { fillLoginForm, stubAuthApis } from './helpers/stubs';

test.describe('User login', () => {
  test('signs in an existing owner and lands on the dashboard', async ({
    page,
  }) => {
    await stubAuthApis(page, {
      session: { requires_billing: false, billing_only: false },
    });
    await page.goto('/');
    await expect(page.locator('[data-cy=auth-credentials-form]')).toBeVisible();

    await fillLoginForm(page, 'owner@example.com', 'Password123!');
    await page.locator('[data-cy=auth-submit]').click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  });

  test('shows an API error when credentials are rejected', async ({ page }) => {
    await stubAuthApis(page);
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Invalid email or password' }),
      });
    });

    await page.goto('/');
    await expect(page.locator('[data-cy=auth-credentials-form]')).toBeVisible();
    await fillLoginForm(page, 'bad@example.com', 'WrongPass1!');
    await page.locator('[data-cy=auth-submit]').click();

    await expect(
      page.getByText(/invalid email or password|authentication failed/i).first(),
    ).toBeVisible();
    await expect(page).not.toHaveURL(/\/dashboard/);
  });
});
