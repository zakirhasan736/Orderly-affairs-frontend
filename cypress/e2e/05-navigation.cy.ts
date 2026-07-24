/// <reference types="cypress" />

describe('Navigation between pages', () => {
  beforeEach(() => {
    cy.stubAuthApis();
  });

  it('loads owner login home', () => {
    cy.visit('/');
    cy.get('[data-cy=auth-credentials-form]', { timeout: 20000 }).should(
      'be.visible',
    );
    cy.location('pathname').should('eq', '/');
  });

  it('loads Next of Kin login page', () => {
    cy.visit('/next-kin');
    cy.contains(/next of kin|email|password|sign in/i).should('be.visible');
    cy.location('pathname').should('eq', '/next-kin');
  });

  it('can navigate from NOK login back toward owner area', () => {
    cy.visit('/next-kin');
    cy.contains(/owner|back|return/i)
      .filter('a,button')
      .first()
      .click({ force: true });
    cy.location('pathname', { timeout: 10000 }).should(
      'match',
      /\/(dashboard)?$/,
    );
  });

  it('redirects unauthenticated dashboard visitors via AuthWatcher', () => {
    cy.intercept('GET', '**/auth/session', {
      statusCode: 200,
      body: { authenticated: false, role: null },
    }).as('anonSession');

    cy.visit('/dashboard');
    cy.wait('@anonSession');
    cy.url({ timeout: 15000 }).should('match', /\/($|\?)/);
  });
});
