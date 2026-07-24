/// <reference types="cypress" />

describe('Dashboard functionality', () => {
  beforeEach(() => {
    cy.stubAuthenticatedOwner();
  });

  it('renders the owner dashboard overview when session is valid', () => {
    cy.visit('/dashboard');
    cy.wait('@ownerSession');
    cy.wait('@billingStatus');

    cy.contains('p', /current area/i, { timeout: 20000 }).should('be.visible');
    cy.url().should('include', '/dashboard');
  });

  it('shows billing lock panel when vault is payment-locked', () => {
    cy.stubAuthenticatedOwner({
      billing_only: true,
      lock_message:
        'Your vault access is paused due to a payment or plan issue.',
    });

    cy.visit('/dashboard');
    cy.contains(/paused|payment|plan|update your card|billing/i, {
      timeout: 20000,
    }).should('be.visible');
  });

  it('keeps dashboard URL after hydrate for an active owner', () => {
    cy.visit('/dashboard');
    cy.wait('@ownerSession');
    cy.contains('button', /run tour/i, { timeout: 20000 }).should('be.visible');
    cy.location('pathname').should('eq', '/dashboard');
  });
});
