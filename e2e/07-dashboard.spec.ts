import { test, expect } from '@playwright/test';
import {
  dismissWelcomeIfPresent,
  stubAuthenticatedOwner,
} from './helpers/stubs';

test.describe('Dashboard functionality', () => {
  test('renders owner dashboard overview when session is valid', async ({
    page,
  }) => {
    await stubAuthenticatedOwner(page);
    await page.goto('/dashboard');
    await dismissWelcomeIfPresent(page);
    await expect(page.getByText(/current area/i).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('shows billing lock panel when vault is payment-locked', async ({
    page,
  }) => {
    await stubAuthenticatedOwner(page, {
      billing_only: true,
      lock_message:
        'Your vault access is paused due to a payment or plan issue.',
    });
    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { name: /vault access paused/i }),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('keeps dashboard URL after hydrate for an active owner', async ({
    page,
  }) => {
    await stubAuthenticatedOwner(page);
    await page.goto('/dashboard');
    await dismissWelcomeIfPresent(page);
    await expect(page.getByRole('button', { name: /run tour/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
