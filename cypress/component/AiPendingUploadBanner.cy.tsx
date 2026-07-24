/// <reference types="cypress" />

import React from 'react';
import { AiPendingUploadBanner } from '@/components/ai/AiPendingUploadBanner';

describe('AiPendingUploadBanner (component)', () => {
  it('fires autofill, show-upload, and dismiss actions', () => {
    const onAutofillNow = cy.stub().as('onAutofillNow');
    const onScrollToUpload = cy.stub().as('onScrollToUpload');
    const onDismiss = cy.stub().as('onDismiss');

    cy.mount(
      <AiPendingUploadBanner
        pendingUpload={{
          file_id: 'file-1',
          mime_type: 'application/pdf',
          targetSectionId: '5',
          targetSectionKey: 'vehicles',
          uploadScope: 'full',
          highlightUpload: true,
          createdAt: Date.now(),
          documentSummary: 'Two vehicle registrations',
        }}
        onAutofillNow={onAutofillNow}
        onScrollToUpload={onScrollToUpload}
        onDismiss={onDismiss}
      />,
    );

    cy.contains(/ready to auto-fill/i).should('be.visible');
    cy.contains(/two vehicle registrations/i).should('be.visible');

    cy.contains('button', /auto-fill now/i).click();
    cy.get('@onAutofillNow').should('have.been.calledOnce');

    cy.contains('button', /show upload/i).click();
    cy.get('@onScrollToUpload').should('have.been.calledOnce');

    cy.contains('button', /dismiss/i).click();
    cy.get('@onDismiss').should('have.been.calledOnce');
  });
});
