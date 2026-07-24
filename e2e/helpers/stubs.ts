import type { Page, Route } from '@playwright/test';

export type OwnerSession = {
  authenticated: boolean;
  role: 'owner' | 'nextkin' | null;
  email?: string;
  owner_id?: string;
  requires_billing?: boolean;
  billing_only?: boolean;
  lock_message?: string | null;
};

export const anonymousSession = (): OwnerSession => ({
  authenticated: false,
  role: null,
  requires_billing: false,
  billing_only: false,
  lock_message: null,
});

export const ownerSession = (
  overrides: Partial<OwnerSession> = {},
): OwnerSession => ({
  authenticated: true,
  role: 'owner',
  email: 'owner@example.com',
  owner_id: 'owner-1',
  requires_billing: false,
  billing_only: false,
  lock_message: null,
  ...overrides,
});

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

/**
 * Login/checkout stubs: session starts anonymous, becomes owner after login.
 */
export async function stubAuthApis(
  page: Page,
  options: {
    login?: Record<string, unknown>;
    session?: Partial<OwnerSession>;
  } = {},
) {
  const postLogin = ownerSession(options.session);
  let sessionState: OwnerSession = anonymousSession();

  await page.route('**/auth/session', async route => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await json(route, 200, sessionState);
  });

  await page.route('**/auth/login', async route => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    sessionState = postLogin;
    await json(route, 200, {
      mfa_required: false,
      requires_billing: Boolean(postLogin.requires_billing),
      message: 'ok',
      ...(options.login || {}),
    });
  });

  await page.route('**/auth/signup', async route => {
    sessionState = postLogin;
    await json(route, 200, { message: 'Account created' });
  });

  await page.route('**/api/auth/portal-session', async route => {
    await json(route, 200, { ok: true });
  });

  await page.route('**/auth/request-password-reset', async route => {
    await json(route, 200, {
      message: 'If that email exists, a code was sent.',
    });
  });

  await page.route('**/billing/create-customer', async route => {
    await json(route, 200, { ok: true });
  });

  await page.route('**/billing/start-subscription', async route => {
    sessionState = {
      ...postLogin,
      requires_billing: false,
      billing_only: false,
    };
    await json(route, 200, { ok: true, status: 'trialing' });
  });

  await page.route('**/billing/status', async route => {
    await json(route, 200, {
      billing_only: false,
      status: 'trialing',
      plan: 'yearly',
    });
  });
}

/** Authenticated owner vault stubs (dashboard + sections + AI-related GETs). */
export async function stubVaultData(page: Page) {
  await page.route('**/api/auth/portal-session', async route => {
    await json(route, 200, { ok: true });
  });
  await page.route('**/billing/status', async route => {
    await json(route, 200, {
      billing_only: false,
      status: 'active',
      plan: 'yearly',
    });
  });
  await page.route('**/auth/my-nextkin', async route => {
    await json(route, 200, []);
  });
  await page.route('**/onboarding/status', async route => {
    if (route.request().method() === 'GET') {
      await json(route, 200, {
        version: '1',
        has_completed: true,
        manually_started: false,
        last_run_at: null,
      });
      return;
    }
    await json(route, 200, { message: 'ok' });
  });
  await page.route('**/onboarding/**', async route => {
    await json(route, 200, {
      version: '1',
      has_completed: true,
      manually_started: false,
      last_run_at: null,
    });
  });
  await page.route('**/tour/**', async route => {
    await json(route, 200, { has_completed: true, completed: true });
  });
  await page.route('**/sections/**', async route => {
    const method = route.request().method();
    if (method === 'GET') {
      await json(route, 200, { data: {} });
      return;
    }
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      await json(route, 200, { ok: true, message: 'saved' });
      return;
    }
    await json(route, 200, { ok: true });
  });
  await page.route('**/nok-letter**', async route => {
    await json(route, 200, {});
  });
  await page.route('**/kit**', async route => {
    await json(route, 200, { data: {} });
  });
}

/** Authenticated owner vault stubs (dashboard + sections + AI-related GETs). */
export async function stubAuthenticatedOwner(
  page: Page,
  overrides: Partial<OwnerSession> = {},
) {
  const session = ownerSession(overrides);

  await page.route('**/auth/session', async route => {
    await json(route, 200, session);
  });
  await stubVaultData(page);
  // Override billing when locked
  if (session.billing_only) {
    await page.route('**/billing/status', async route => {
      await json(route, 200, {
        billing_only: true,
        status: 'past_due',
        plan: 'yearly',
        lock_message: session.lock_message,
      });
    });
  }
}

export async function fillLoginForm(
  page: Page,
  email: string,
  password: string,
) {
  await page.locator('[data-cy=auth-email]').fill(email);
  await page.locator('[data-cy=auth-password]').fill(password);
}

export async function fillRegistrationForm(
  page: Page,
  email: string,
  password: string,
) {
  await page.locator('[data-cy=auth-toggle-mode]').click();
  await page.getByRole('button', { name: /create account/i }).waitFor();
  await page.locator('[data-cy=auth-email]').fill(email);
  await page.locator('[data-cy=auth-password]').fill(password);
  await page.locator('[data-cy=auth-confirm-password]').fill(password);
}

export async function dismissWelcomeIfPresent(page: Page) {
  const skip = page.getByRole('button', { name: /explore on my own/i });
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
  }
}

export async function seedAiPendingUpload(page: Page, sectionId = '1') {
  await page.evaluate(
    ({ sectionId: sid }) => {
      const pending = [
        {
          file_id: 'pw-file-1',
          mime_type: 'application/pdf',
          targetSectionId: sid,
          targetSectionKey: 'vital_information',
          uploadScope: 'full',
          highlightUpload: true,
          createdAt: Date.now(),
          documentSummary: 'Playwright seeded autofill document',
        },
      ];
      sessionStorage.setItem(
        'orderly_ai_pending_uploads',
        JSON.stringify(pending),
      );
    },
    { sectionId },
  );
}
