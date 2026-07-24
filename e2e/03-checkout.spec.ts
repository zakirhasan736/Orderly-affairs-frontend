import { test, expect } from '@playwright/test';
import { fillLoginForm, stubAuthApis } from './helpers/stubs';

test.describe('Checkout process', () => {
  test.beforeEach(async ({ page }) => {
    await stubAuthApis(page, {
      login: { requires_billing: true },
      session: { requires_billing: true, billing_only: false },
    });
  });

  test('opens plan selection when billing is required', async ({ page }) => {
    await page.goto('/');
    await fillLoginForm(page, 'billing@example.com', 'Password123!');
    await page.locator('[data-cy=auth-submit]').click();

    await expect(page.locator('[data-cy=checkout-plan-selection]')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/choose your plan/i).first()).toBeVisible();
  });

  test('starts cardless trial checkout', async ({ page }) => {
    await page.goto('/');
    await fillLoginForm(page, 'billing@example.com', 'Password123!');
    await page.locator('[data-cy=auth-submit]').click();
    await expect(page.locator('[data-cy=checkout-plan-selection]')).toBeVisible();

    await page.locator('[data-cy=checkout-plan-monthly]').click();
    await page.locator('[data-cy=checkout-trial-cardless]').click();
    await page.locator('[data-cy=checkout-continue-trial]').click();

    await expect(page.getByText(/cardless trial/i).first()).toBeVisible();
    await expect(page.locator('[data-cy=checkout-submit]')).toContainText(
      /start cardless trial/i,
    );

    await page.locator('[data-cy=checkout-submit]').click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  });
});
