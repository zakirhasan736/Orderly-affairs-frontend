/// <reference types="cypress" />

describe('User login', () => {
  beforeEach(() => {
    cy.stubAuthApis({
      session: {
        requires_billing: false,
        billing_only: false,
      },
    });
  });

  it('signs in an existing owner and lands on the dashboard', () => {
    cy.visit('/');
    cy.get('[data-cy=auth-credentials-form]', { timeout: 20000 }).should(
      'be.visible',
    );

    cy.fillLoginForm('owner@example.com', 'Password123!');
    cy.get('[data-cy=auth-submit]').click();

    cy.wait('@login');
    cy.wait('@session');
    cy.url({ timeout: 20000 }).should('include', '/dashboard');
  });

  it('shows an API error when credentials are rejected', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 401,
      body: { detail: 'Invalid email or password' },
    }).as('loginFail');

    cy.visit('/');
    cy.get('[data-cy=auth-credentials-form]', { timeout: 20000 }).should(
      'be.visible',
    );
    cy.fillLoginForm('bad@example.com', 'WrongPass1!');
    cy.get('[data-cy=auth-submit]').click();
    cy.wait('@loginFail');

    cy.contains(/invalid email or password|authentication failed/i).should(
      'be.visible',
    );
    cy.url().should('not.include', '/dashboard');
  });
});
