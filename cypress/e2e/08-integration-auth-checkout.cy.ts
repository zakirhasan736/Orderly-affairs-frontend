/// <reference types="cypress" />

/**
 * Integration: login → billing required → plan → cardless trial → dashboard
 */
describe('Integration: auth → checkout → dashboard', () => {
  it('completes the billing-required owner journey with mocked APIs', () => {
    cy.stubAuthApis({
      login: { requires_billing: true },
      session: {
        requires_billing: true,
        billing_only: false,
      },
    });

    cy.visit('/');
    cy.get('[data-cy=auth-credentials-form]', { timeout: 20000 }).should(
      'be.visible',
    );
    cy.fillLoginForm('journey@example.com', 'Password123!');
    cy.get('[data-cy=auth-submit]').click();

    cy.get('[data-cy=checkout-plan-selection]', { timeout: 15000 }).should(
      'be.visible',
    );
    cy.get('[data-cy=checkout-plan-yearly]').click();
    cy.get('[data-cy=checkout-trial-cardless]').click();
    cy.get('[data-cy=checkout-continue-trial]').click();
    cy.get('[data-cy=checkout-submit]').click();

    cy.wait('@createCustomer');
    cy.wait('@startSubscription');
    cy.url({ timeout: 20000 }).should('include', '/dashboard');
  });
});
