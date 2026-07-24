/// <reference types="cypress" />

import './commands';

beforeEach(() => {
  cy.clearCookies();
  cy.clearLocalStorage();
  // Prevent middleware cookie cue from bouncing / → /dashboard.
  cy.setCookie('oa_portal_session', '', { log: false });
});

Cypress.on('uncaught:exception', err => {
  if (
    /hydrat|ResizeObserver|Minified React error|KeyboardEvent|Failed to fetch|NetworkError|Load failed/i.test(
      err.message,
    )
  ) {
    return false;
  }
  return undefined;
});
