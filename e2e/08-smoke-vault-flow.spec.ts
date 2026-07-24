import { test, expect } from '@playwright/test';
import {
  dismissWelcomeIfPresent,
  fillLoginForm,
  seedAiPendingUpload,
  stubAuthApis,
  stubVaultData,
} from './helpers/stubs';

/**
 * Smoke: login → Section 0 → save → Access Management → AI autofill
 */
test.describe('Smoke: vault critical path', () => {
  test('login → Section 0 → save → Access Management → AI autofill', async ({
    page,
  }) => {
    test.setTimeout(90_000);

    await stubAuthApis(page, {
      session: { requires_billing: false, billing_only: false },
    });
    await stubVaultData(page);

    // --- Login ---
    await page.goto('/');
    await expect(page.locator('[data-cy=auth-credentials-form]')).toBeVisible();
    await fillLoginForm(page, 'smoke@example.com', 'Password123!');
    await page.locator('[data-cy=auth-submit]').click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
    await dismissWelcomeIfPresent(page);
    await expect(page.getByText(/current area/i).first()).toBeVisible();

    // --- Section 0 (Instructions) ---
    await page.getByText(/0\.\s*Instructions/i).first().click();
    await expect(
      page.getByRole('button', { name: /continue to vital information/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/section 0/i).first()).toBeVisible();

    await page
      .getByRole('button', { name: /continue to vital information/i })
      .click();

    // Lands on Vital Information (Section 1)
    await expect(page.getByText(/section 1/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole('heading', { name: /vital/i }).first(),
    ).toBeVisible();

    // --- Save ---
    await page
      .getByRole('button', { name: /^save$/i })
      .first()
      .click();
    await expect(
      page.getByRole('button', { name: /save|saving/i }).first(),
    ).toBeVisible();

    // --- Access Management (Section 2) ---
    await page.getByText(/2\.\s*Access Management/i).first().click();
    await expect(page.getByText(/section 2/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole('heading', { name: /access management/i }).first(),
    ).toBeVisible();

    // --- AI autofill: seed pending upload, reload so provider hydrates, open Vital ---
    await seedAiPendingUpload(page, '1');
    await page.reload();
    await dismissWelcomeIfPresent(page);
    await expect(page.getByText(/current area/i).first()).toBeVisible({
      timeout: 20_000,
    });
    await page.getByText(/1\.\s*Vital/i).first().click();

    await expect(page.getByText(/ready to auto-fill/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText(/playwright seeded autofill document/i).first(),
    ).toBeVisible();

    await page.getByRole('button', { name: /auto-fill now/i }).click();
    await expect(
      page.getByText(/ready to auto-fill|auto-fill|upload/i).first(),
    ).toBeVisible();
  });
});
