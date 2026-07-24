/// <reference types="cypress" />

import React from 'react';
import { MultiItemAutofillDialog } from '@/components/ai/MultiItemAutofillDialog';

describe('MultiItemAutofillDialog (component)', () => {
  it('renders extracted items and fires add-all / first-only', () => {
    const onAddAll = cy.stub().as('onAddAll');
    const onAddFirstOnly = cy.stub().as('onAddFirstOnly');

    cy.mount(
      <MultiItemAutofillDialog
        open
        onOpenChange={() => {}}
        itemLabel="Vehicle"
        items={[
          { make: 'Honda', model: 'CR-V' },
          { make: 'Toyota', model: 'RAV4' },
        ]}
        describeItem={item => `${item.make} ${item.model}`}
        onAddAll={onAddAll}
        onAddFirstOnly={onAddFirstOnly}
      />,
    );

    cy.contains(/2 vehicles found/i).should('be.visible');
    cy.contains(/Honda CR-V/i).should('be.visible');
    cy.contains('button', /add all 2 vehicles/i).click();
    cy.get('@onAddAll').should('have.been.calledOnce');

    cy.contains('button', /only fill the first vehicle/i).click();
    cy.get('@onAddFirstOnly').should('have.been.calledOnce');
  });
});
