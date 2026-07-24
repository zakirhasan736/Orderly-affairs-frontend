/// <reference types="cypress" />

describe('Checkout process', () => {
  beforeEach(() => {
    cy.stubAuthApis({
      login: { requires_billing: true },
      session: {
        requires_billing: true,
        billing_only: false,
      },
    });
  });

  it('opens plan selection after login when billing is required', () => {
    cy.visit('/');
    cy.fillLoginForm('billing@example.com', 'Password123!');
    cy.get('[data-cy=auth-submit]').click();

    cy.wait('@login');
    cy.get('[data-cy=checkout-plan-selection]', { timeout: 15000 }).should(
      'be.visible',
    );
    cy.contains(/choose your plan/i).should('be.visible');
  });

  it('selects monthly plan and starts cardless trial checkout', () => {
    cy.visit('/');
    cy.fillLoginForm('billing@example.com', 'Password123!');
    cy.get('[data-cy=auth-submit]').click();
    cy.get('[data-cy=checkout-plan-selection]').should('be.visible');

    cy.get('[data-cy=checkout-plan-monthly]').click();
    cy.get('[data-cy=checkout-trial-cardless]').click();
    cy.get('[data-cy=checkout-continue-trial]').click();

    cy.contains(/cardless trial/i).should('be.visible');
    cy.get('[data-cy=checkout-submit]').should(
      'contain.text',
      'Start cardless trial',
    );

    cy.get('[data-cy=checkout-submit]').click();
    cy.wait('@createCustomer');
    cy.wait('@startSubscription');
    cy.url({ timeout: 20000 }).should('include', '/dashboard');
  });
});
