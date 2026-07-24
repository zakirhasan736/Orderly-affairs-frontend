/// <reference types="cypress" />

import {
  FORM_SECTIONS,
  LETTER_READY_NEXT_KIN,
} from '../fixtures/vaultSections';

/**
 * Full vault coverage: open every section, fill text fields where applicable,
 * and assert save/update submission paths.
 */
describe('Vault section form submissions (0–21)', () => {
  it('Section 0 Instructions: shows copy and continues to Vital Information', () => {
    cy.visitVaultAsOwner();
    cy.openVaultSection('0', /instructions/i);

    cy.get('main.min-w-0')
      .contains(/welcome|peace of mind|orderly affairs kit/i)
      .should('exist');
    cy.get('main.min-w-0')
      .contains('button', /continue to vital information/i)
      .click({ force: true });

    cy.contains('p', /^Current Area$/i)
      .should('be.visible')
      .parent()
      .find('h1')
      .invoke('text')
      .should('match', /^\s*1\./);
  });

  it('Section 1 Vital Information: fill text fields and POST section save', () => {
    cy.visitVaultAsOwner();
    cy.openVaultSection('1', /vital/i);

    cy.ensureSectionCardOpen();
    cy.fillVisibleTextFields({
      valuePrefix: 'Section 1 Cypress',
      maxFields: 3,
    });
    cy.clickSectionSave();

    cy.wait('@sectionSave', { timeout: 20000 })
      .its('request.url')
      .should('include', '/sections/');
    cy.contains(/saved successfully/i, { timeout: 10000 }).should('exist');
  });

  it('Section 2 Access Management: opens kit access UI', () => {
    cy.visitVaultAsOwner();
    cy.openVaultSection('2', /access management/i);

    cy.get('main.min-w-0')
      .contains(/kit access control|trusted person|emergency access/i)
      .should('exist');

    cy.get('body').then($body => {
      const add = $body
        .find('button')
        .filter((_, el) => /add trusted person/i.test(el.textContent || ''));
      if (add.length) {
        cy.wrap(add.first()).click({ force: true });
        cy.get(
          'input[placeholder*="full name" i], input[placeholder*="Enter full name" i]',
        )
          .first()
          .clear({ force: true })
          .type('Cypress Trusted Person', { force: true, delay: 0 });
        cy.get(
          'input[placeholder*="full name" i], input[placeholder*="Enter full name" i]',
        )
          .first()
          .should('have.value', 'Cypress Trusted Person');
      }
    });
  });

  it('Section 3 Letter to Next of Kin: recipient list or empty state', () => {
    cy.visitVaultAsOwner({ nextKin: LETTER_READY_NEXT_KIN });
    cy.openVaultSection('3', /letter/i);

    cy.get('main.min-w-0')
      .contains(/introductory letter|letter to next of kin|recipient|section 2/i)
      .should('exist');

    cy.get('body').then($body => {
      const openBtn = $body
        .find('button')
        .filter((_, el) => /^\s*Open\s*$/i.test(el.textContent || ''));
      if (!openBtn.length) return;

      cy.wrap(openBtn.first()).click({ force: true });
      cy.get('textarea:visible, input:visible', { timeout: 15000 })
        .not('[type="checkbox"]')
        .not('[type="radio"]')
        .not('[type="file"]')
        .not('[type="hidden"]')
        .first()
        .clear({ force: true })
        .type('Cypress NOK letter greeting update', { force: true, delay: 0 });
      cy.wait('@nokLetterSave', { timeout: 15000 });
    });
  });

  it('Section 4 Personal Messages: opens messages workspace', () => {
    cy.visitVaultAsOwner();
    cy.openVaultSection('4', /personal messages/i);

    cy.get('main.min-w-0')
      .contains(/message|letter|create|personal/i)
      .should('exist');

    cy.get('body').then($body => {
      const create = $body
        .find('button')
        .filter((_, el) =>
          /create (first )?message/i.test(el.textContent || ''),
        );
      if (!create.length) return;

      cy.wrap(create.first()).click({ force: true });
      cy.get('main.min-w-0 input:visible, main.min-w-0 textarea:visible', {
        timeout: 15000,
      }).should('have.length.at.least', 1);
    });
  });

  FORM_SECTIONS.forEach(section => {
    it(`Section ${section.id}: fill fields and save/update submission`, () => {
      cy.visitVaultAsOwner();
      cy.openVaultSection(section.id, section.heading);

      if (section.needsAddCard) {
        cy.ensureSectionCardOpen();
      }

      cy.fillVisibleTextFields({
        valuePrefix: `Section ${section.id} Cypress`,
        maxFields: 3,
      });

      cy.clickSectionSave();

      cy.wait('@sectionSave', { timeout: 20000 }).then(interception => {
        expect(interception.request.method).to.eq('POST');
        expect(interception.request.url).to.match(/\/sections\//);
      });

      cy.contains(/saved successfully/i, { timeout: 10000 }).should('exist');
    });
  });

  // Per-section open/fill/save tests above already cover navigation for 0–21.
});
