/// <reference types="cypress" />

describe('API interactions', () => {
  it('sends login payload to /auth/login with email and password', () => {
    cy.stubAuthApis();
    cy.visit('/');
    cy.get('[data-cy=auth-credentials-form]', { timeout: 20000 }).should(
      'be.visible',
    );

    cy.fillLoginForm('api.user@example.com', 'Password123!');
    cy.get('[data-cy=auth-submit]').click();

    cy.wait('@login').then(({ request }) => {
      expect(request.method).to.eq('POST');
      expect(request.body).to.include({
        email: 'api.user@example.com',
      });
      expect(request.body.password).to.be.a('string');
    });
  });

  it('calls session after successful login before dashboard redirect', () => {
    cy.stubAuthApis({
      session: { requires_billing: false },
    });
    cy.visit('/');
    cy.get('[data-cy=auth-credentials-form]', { timeout: 20000 }).should(
      'be.visible',
    );
    cy.fillLoginForm('api.user@example.com', 'Password123!');
    cy.get('[data-cy=auth-submit]').click();

    cy.wait('@login');
    cy.wait('@session');
    cy.wait('@portalSession');
  });

  it('surfaces rate-limit API responses on the login form', () => {
    cy.stubAuthApis();
    cy.intercept('POST', '**/auth/login', {
      statusCode: 429,
      headers: { 'Retry-After': '45' },
      body: {
        detail: 'Please try again in 45 seconds.',
        retry_after_seconds: 45,
      },
    }).as('rateLimited');

    cy.visit('/');
    cy.get('[data-cy=auth-credentials-form]', { timeout: 20000 }).should(
      'be.visible',
    );
    cy.fillLoginForm('limited@example.com', 'Password123!');
    cy.get('[data-cy=auth-submit]').click();
    cy.wait('@rateLimited');

    cy.contains(/45 seconds|please wait|try again/i).should('be.visible');
  });
});
