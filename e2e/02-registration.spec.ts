import { test, expect } from '@playwright/test';
import { fillRegistrationForm, stubAuthApis } from './helpers/stubs';

test.describe('User registration', () => {
  test.beforeEach(async ({ page }) => {
    await stubAuthApis(page);
  });

  test('validates password confirmation and stays on registration', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('[data-cy=auth-credentials-form]')).toBeVisible();
    await page.locator('[data-cy=auth-toggle-mode]').click();

    await page.locator('[data-cy=auth-email]').fill('new.user@example.com');
    await page.locator('[data-cy=auth-password]').fill('SecurePass123!');
    await page.locator('[data-cy=auth-confirm-password]').fill('Mismatch123!');
    await page.locator('[data-cy=auth-submit]').click();

    await expect(page.locator('[data-cy=auth-credentials-form]')).toBeVisible();
    await expect(page.locator('[data-cy=auth-mfa-continue]')).toHaveCount(0);
    await expect(
      page
        .getByText(
          /passwords do not match|authentication failed|stronger password/i,
        )
        .first(),
    ).toBeVisible();
  });

  test('advances to MFA method selection with a strong password', async ({
    page,
  }) => {
    await page.goto('/');
    await fillRegistrationForm(page, 'new.user@example.com', 'SecurePass123!');
    await page.locator('[data-cy=auth-submit]').click();

    await expect(
      page.getByText(/two-factor|verification codes|choose how/i).first(),
    ).toBeVisible();
    await expect(page.locator('[data-cy=auth-mfa-continue]')).toBeVisible();
  });
});
