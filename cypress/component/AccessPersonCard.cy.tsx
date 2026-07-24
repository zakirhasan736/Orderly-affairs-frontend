/// <reference types="cypress" />

import React from 'react';
import { AccessPersonCard } from '@/components/AccessPersonCard';

describe('AccessPersonCard (component)', () => {
  it('renders person state and fires edit/delete', () => {
    const onEdit = cy.stub().as('onEdit');
    const onDelete = cy.stub().as('onDelete');

    cy.mount(
      <AccessPersonCard
        item={{
          full_name: 'Sebastian Casey',
          email: 'seb@example.com',
          phone_number: '+15551234567',
          relationship: 'Spouse',
          access_level: 'Full Kit Access',
          authorized_sections: ['all'],
          immediate_access: true,
        }}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    cy.contains('Sebastian Casey').should('be.visible');
    cy.contains(/spouse/i).should('be.visible');
    cy.get('button[aria-label="Edit Sebastian Casey"]').click();
    cy.get('@onEdit').should('have.been.calledOnce');
    cy.get('button[aria-label="Delete Sebastian Casey"]').click();
    cy.get('@onDelete').should('have.been.calledOnce');
  });
});
