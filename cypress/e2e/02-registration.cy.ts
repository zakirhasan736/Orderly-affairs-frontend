/// <reference types="cypress" />

describe('User registration', () => {
  beforeEach(() => {
    cy.stubAuthApis();
  });

  it('toggles into registration and validates password confirmation', () => {
    cy.visit('/');
    cy.get('[data-cy=auth-credentials-form]', { timeout: 20000 }).should(
      'be.visible',
    );
    cy.get('[data-cy=auth-toggle-mode]').click();

    cy.get('[data-cy=auth-email]').type('new.user@example.com');
    cy.get('[data-cy=auth-password]').type('SecurePass123!', { log: false });
    cy.get('[data-cy=auth-confirm-password]').type('Mismatch123!', {
      log: false,
    });
    cy.get('[data-cy=auth-submit]').click();

    // Stay on credentials / registration — do not advance to MFA.
    cy.get('[data-cy=auth-credentials-form]').should('be.visible');
    cy.get('[data-cy=auth-mfa-continue]').should('not.exist');
    cy.contains(/passwords do not match|authentication failed|stronger password/i, {
      timeout: 8000,
    }).should('exist');
  });

  it('submits a strong password and advances to MFA method selection', () => {
    cy.visit('/');
    cy.get('[data-cy=auth-credentials-form]', { timeout: 20000 }).should(
      'be.visible',
    );
    cy.fillRegistrationForm('new.user@example.com', 'SecurePass123!');
    cy.get('[data-cy=auth-submit]').click();

    cy.contains(/two-factor|verification codes|choose how/i).should(
      'be.visible',
    );
    cy.get('[data-cy=auth-mfa-continue]').should('be.visible');
  });
});
