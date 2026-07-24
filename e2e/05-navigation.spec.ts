import { test, expect } from '@playwright/test';
import { stubAuthApis } from './helpers/stubs';

test.describe('Navigation between pages', () => {
  test.beforeEach(async ({ page }) => {
    await stubAuthApis(page);
  });

  test('loads owner login home', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-cy=auth-credentials-form]')).toBeVisible();
    await expect(page).toHaveURL('/');
  });

  test('loads Next of Kin login page', async ({ page }) => {
    await page.goto('/next-kin');
    await expect(
      page.getByText(/next of kin|email|password|sign in/i).first(),
    ).toBeVisible();
    await expect(page).toHaveURL('/next-kin');
  });

  test('can navigate from NOK login back toward owner area', async ({
    page,
  }) => {
    await page.goto('/next-kin');
    await page
      .getByRole('button', { name: /owner|back|return/i })
      .or(page.getByRole('link', { name: /owner|back|return/i }))
      .first()
      .click({ force: true });
    await expect(page).toHaveURL(/\/(dashboard)?$/);
  });

  test('redirects unauthenticated dashboard visitors via AuthWatcher', async ({
    page,
  }) => {
    await page.route('**/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: false, role: null }),
      });
    });

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/($|\?)/, { timeout: 15_000 });
  });
});
