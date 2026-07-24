/// <reference types="cypress" />

export type OwnerSessionFixture = {
  authenticated: boolean;
  role: 'owner' | 'nextkin' | null;
  email?: string;
  owner_id?: string;
  requires_billing?: boolean;
  billing_only?: boolean;
  lock_message?: string | null;
};

export type StubAuthenticatedOwnerOptions = Partial<OwnerSessionFixture> & {
  /** Seed Access Management / Section 3 letter recipients */
  nextKin?: unknown[];
};

declare global {
  namespace Cypress {
    interface Chainable {
      stubAuthenticatedOwner(
        overrides?: StubAuthenticatedOwnerOptions,
      ): Chainable<void>;

      stubAuthApis(options?: {
        login?: Record<string, unknown>;
        signup?: Record<string, unknown>;
        /** Session returned AFTER a successful login/signup. */
        session?: Partial<OwnerSessionFixture>;
      }): Chainable<void>;

      fillLoginForm(email: string, password: string): Chainable<void>;
      fillRegistrationForm(
        email: string,
        password: string,
      ): Chainable<void>;

      visitVaultAsOwner(
        overrides?: StubAuthenticatedOwnerOptions,
      ): Chainable<void>;

      dismissWelcomeTour(): Chainable<void>;

      openVaultSection(sectionId: string, heading?: RegExp): Chainable<void>;

      ensureSectionCardOpen(): Chainable<void>;

      fillVisibleTextFields(options?: {
        maxFields?: number;
        valuePrefix?: string;
      }): Chainable<void>;

      clickSectionSave(): Chainable<void>;
    }
  }
}

const anonymousSession = (): OwnerSessionFixture => ({
  authenticated: false,
  role: null,
  requires_billing: false,
  billing_only: false,
  lock_message: null,
});

const defaultOwnerSession = (
  overrides: Partial<OwnerSessionFixture> = {},
): OwnerSessionFixture => ({
  authenticated: true,
  role: 'owner',
  email: 'owner@example.com',
  owner_id: 'owner-1',
  requires_billing: false,
  billing_only: false,
  lock_message: null,
  ...overrides,
});

const onboardingCompleted = {
  version: '1',
  has_completed: true,
  manually_started: false,
  last_run_at: null,
  completed: true,
  step: 'done',
};

Cypress.Commands.add('stubAuthenticatedOwner', (overrides = {}) => {
  const { nextKin, ...sessionOverrides } = overrides;
  const session = defaultOwnerSession(sessionOverrides);
  const nextKinBody = nextKin ?? [];

  cy.intercept('GET', '**/auth/session', {
    statusCode: 200,
    body: session,
  }).as('ownerSession');

  cy.intercept('POST', '**/api/auth/portal-session', {
    statusCode: 200,
    body: { ok: true },
  }).as('portalSession');

  cy.intercept('GET', '**/billing/status', {
    statusCode: 200,
    body: {
      billing_only: Boolean(session.billing_only),
      status: session.billing_only ? 'past_due' : 'active',
      plan: 'yearly',
      lock_message: session.lock_message,
    },
  }).as('billingStatus');

  cy.intercept('GET', '**/auth/my-nextkin', {
    statusCode: 200,
    body: nextKinBody,
  }).as('myNextKin');

  cy.intercept('GET', '**/onboarding/status', {
    statusCode: 200,
    body: onboardingCompleted,
  }).as('onboardingStatus');

  cy.intercept('GET', '**/onboarding/**', {
    statusCode: 200,
    body: onboardingCompleted,
  }).as('onboarding');

  cy.intercept('POST', '**/onboarding/**', {
    statusCode: 200,
    body: onboardingCompleted,
  }).as('onboardingPost');

  cy.intercept('GET', '**/tour/**', {
    statusCode: 200,
    body: onboardingCompleted,
  }).as('tour');

  cy.intercept('GET', '**/sections/**', {
    statusCode: 200,
    body: { data: {} },
  }).as('sectionsGet');

  cy.intercept('POST', '**/sections/**', {
    statusCode: 200,
    body: { ok: true, message: 'saved' },
  }).as('sectionSave');

  cy.intercept('PUT', '**/sections/**', {
    statusCode: 200,
    body: { ok: true, message: 'updated' },
  }).as('sectionUpdate');

  cy.intercept('PATCH', '**/sections/**', {
    statusCode: 200,
    body: { ok: true, message: 'patched' },
  }).as('sectionPatch');

  cy.intercept('GET', '**/nok-letter**', {
    statusCode: 200,
    body: {},
  }).as('nokLetterGet');

  cy.intercept('POST', '**/nok-letter**', {
    statusCode: 200,
    body: { id: 'letter-1', ok: true },
  }).as('nokLetterSave');

  cy.intercept('PUT', '**/nok-letter**', {
    statusCode: 200,
    body: { id: 'letter-1', ok: true },
  }).as('nokLetterUpdate');

  cy.intercept('GET', '**/message', {
    statusCode: 200,
    body: [],
  }).as('messagesGet');

  cy.intercept('POST', '**/message', {
    statusCode: 200,
    body: { id: 'msg-1', _id: 'msg-1', ok: true },
  }).as('messageSave');

  cy.intercept('PUT', '**/message/**', {
    statusCode: 200,
    body: { id: 'msg-1', ok: true },
  }).as('messageUpdate');

  cy.intercept('POST', '**/auth/create-nextkin', {
    statusCode: 200,
    body: { id: 'nok-new', message: 'created' },
  }).as('createNextKin');

  cy.intercept('GET', '**/kit**', {
    statusCode: 200,
    body: { data: {} },
  }).as('kit');
});

Cypress.Commands.add('stubAuthApis', (options = {}) => {
  const postLoginSession = defaultOwnerSession(options.session);
  let sessionState: OwnerSessionFixture = anonymousSession();

  cy.intercept('GET', '**/auth/session', req => {
    req.reply({ statusCode: 200, body: sessionState });
  }).as('session');

  cy.intercept('POST', '**/auth/login', req => {
    sessionState = postLoginSession;
    req.reply({
      statusCode: 200,
      body: {
        mfa_required: false,
        requires_billing: Boolean(postLoginSession.requires_billing),
        message: 'ok',
        ...(options.login || {}),
      },
    });
  }).as('login');

  cy.intercept('POST', '**/auth/signup', req => {
    sessionState = postLoginSession;
    req.reply({
      statusCode: 200,
      body: {
        message: 'Account created',
        ...(options.signup || {}),
      },
    });
  }).as('signup');

  cy.intercept('POST', '**/api/auth/portal-session', {
    statusCode: 200,
    body: { ok: true },
  }).as('portalSession');

  cy.intercept('POST', '**/billing/create-customer', {
    statusCode: 200,
    body: { ok: true },
  }).as('createCustomer');

  cy.intercept('POST', '**/billing/start-subscription', req => {
    sessionState = {
      ...postLoginSession,
      requires_billing: false,
      billing_only: false,
    };
    req.reply({ statusCode: 200, body: { ok: true, status: 'trialing' } });
  }).as('startSubscription');

  cy.intercept('GET', '**/billing/status', {
    statusCode: 200,
    body: {
      billing_only: false,
      status: 'trialing',
      plan: 'yearly',
    },
  }).as('billingStatus');

  cy.intercept('POST', '**/auth/request-password-reset', {
    statusCode: 200,
    body: { message: 'If that email exists, a code was sent.' },
  }).as('forgotPassword');
});

Cypress.Commands.add('fillLoginForm', (email, password) => {
  cy.get('[data-cy=auth-email]', { timeout: 20000 })
    .should('be.visible')
    .clear()
    .type(email, { delay: 0 });
  cy.get('[data-cy=auth-password]')
    .should('be.visible')
    .clear()
    .type(password, { log: false, delay: 0 });
});

Cypress.Commands.add('fillRegistrationForm', (email, password) => {
  cy.get('[data-cy=auth-toggle-mode]').should('be.visible').click();
  cy.contains('button', /create account/i).should('exist');
  cy.get('[data-cy=auth-email]').clear().type(email, { delay: 0 });
  cy.get('[data-cy=auth-password]')
    .clear()
    .type(password, { log: false, delay: 0 });
  cy.get('[data-cy=auth-confirm-password]')
    .clear()
    .type(password, { log: false, delay: 0 });
});

Cypress.Commands.add('dismissWelcomeTour', () => {
  cy.get('body').then($body => {
    const skip = $body.find('button:contains("Explore on my own")');
    if (skip.length) {
      cy.contains('button', /explore on my own/i).click({ force: true });
    }
  });
});

Cypress.Commands.add('visitVaultAsOwner', (overrides = {}) => {
  cy.stubAuthenticatedOwner(overrides);
  cy.visit('/dashboard');
  cy.wait('@ownerSession');
  cy.wait('@billingStatus');
  cy.contains(/current area/i, { timeout: 25000 }).should('be.visible');
  cy.dismissWelcomeTour();
  // Wait for owner hydrate + tour status so clicks are not swallowed by overlays
  cy.contains('button', /run tour/i, { timeout: 20000 }).should('be.visible');
  cy.get('aside.sidebar-navigation button.section-0-nav', {
    timeout: 20000,
  }).should('exist');
});

Cypress.Commands.add('openVaultSection', (sectionId, heading) => {
  cy.window({ timeout: 20000 }).should(win => {
    expect(
      (win as Window & { __oaGoToSection?: (id: string) => void })
        .__oaGoToSection,
      'Cypress vault navigation helper',
    ).to.be.a('function');
  });

  cy.window().then(win => {
    (
      win as Window & { __oaGoToSection?: (id: string) => void }
    ).__oaGoToSection?.(sectionId);
  });

  cy.contains('p', /^Current Area$/i, { timeout: 20000 })
    .should('be.visible')
    .parent()
    .find('h1')
    .invoke('text')
    .should('match', new RegExp(`^\\s*${sectionId}\\.`));

  cy.get('main.min-w-0', { timeout: 20000 })
    .contains(new RegExp(`Section\\s+${sectionId}\\b`, 'i'))
    .should('exist');

  if (heading) {
    cy.get('main.min-w-0').contains(heading).should('exist');
  }
});

Cypress.Commands.add('ensureSectionCardOpen', () => {
  cy.get('main.min-w-0').then($main => {
    const editable = $main.find('input:visible, textarea:visible').filter((_, el) => {
      const $el = Cypress.$(el);
      const type = ($el.attr('type') || 'text').toLowerCase();
      if (
        ['checkbox', 'radio', 'file', 'hidden', 'button', 'submit', 'reset'].includes(
          type,
        )
      ) {
        return false;
      }
      if ($el.is(':disabled') || $el.attr('readonly')) return false;
      const ph = `${$el.attr('placeholder') || ''} ${$el.attr('aria-label') || ''}`;
      if (/search/i.test(ph)) return false;
      return true;
    });

    if (editable.length === 0) {
      const addBtn = $main.find('button').filter((_, btn) =>
        /^Add\s+/i.test(Cypress.$(btn).text().trim()),
      );
      if (addBtn.length) {
        cy.wrap(addBtn.first()).click({ force: true });
      }
    }
  });
});

Cypress.Commands.add('fillVisibleTextFields', (options = {}) => {
  const maxFields = options.maxFields ?? 3;
  const valuePrefix = options.valuePrefix ?? 'Cypress field';
  const allowedInputTypes = new Set(['text', 'email', 'tel', 'search', 'url', '']);

  const setNativeValue = (el: HTMLInputElement | HTMLTextAreaElement, value: string) => {
    const proto =
      el.tagName.toLowerCase() === 'textarea'
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
    descriptor?.set?.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };

  cy.get('main.min-w-0').then($main => {
    const targets = $main
      .find('input, textarea')
      .toArray()
      .filter(el => {
        const $el = Cypress.$(el);
        if (!$el.is(':visible')) return false;
        if ($el.is(':disabled') || $el.attr('readonly')) return false;
        const tag = el.tagName.toLowerCase();
        if (tag === 'textarea') return true;
        if (tag !== 'input') return false;
        const type = ($el.attr('type') || 'text').toLowerCase();
        if (!allowedInputTypes.has(type)) return false;
        const ph = `${$el.attr('placeholder') || ''} ${$el.attr('aria-label') || ''}`;
        if (/search/i.test(ph)) return false;
        return true;
      })
      .slice(0, maxFields);

    expect(targets.length, 'at least one editable text field').to.be.greaterThan(
      0,
    );

    targets.forEach((el, index) => {
      const value = `${valuePrefix} ${index + 1}`;
      setNativeValue(el as HTMLInputElement | HTMLTextAreaElement, value);
    });
  });
});

Cypress.Commands.add('clickSectionSave', () => {
  cy.contains('button', /^Save$/i).first().click({ force: true });
});
