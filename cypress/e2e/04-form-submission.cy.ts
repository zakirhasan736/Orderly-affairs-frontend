/// <reference types="cypress" />

describe('Form submission', () => {
  beforeEach(() => {
    cy.stubAuthApis();
  });

  it('blocks empty credential submit via HTML required fields', () => {
    cy.visit('/');
    cy.get('[data-cy=auth-credentials-form]', { timeout: 20000 }).should(
      'be.visible',
    );
    cy.get('[data-cy=auth-submit]').click();
    cy.get('[data-cy=auth-email]:invalid').should('exist');
  });

  it('submits forgot-password email form and hits the reset API', () => {
    cy.visit('/');
    cy.get('[data-cy=auth-credentials-form]', { timeout: 20000 }).should(
      'be.visible',
    );
    cy.get('[data-cy=auth-forgot-password]').click();
    cy.contains('button', /send reset code/i).should('be.visible');

    cy.get('input[type="email"]:visible').clear().type('reset@example.com');
    cy.contains('button', /send reset code/i).click();

    cy.wait('@forgotPassword').its('request.body.email').should(
      'eq',
      'reset@example.com',
    );
  });
});
