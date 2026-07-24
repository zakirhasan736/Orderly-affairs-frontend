/// <reference types="cypress" />

import React, { useState } from 'react';
import { PhoneNumberInput } from '@/components/PhoneNumberInput';

function PhoneHarness() {
  const [value, setValue] = useState('');
  return (
    <div>
      <PhoneNumberInput
        value={value}
        onChange={setValue}
        label="Mobile number"
        showValidation
      />
      <p data-cy="phone-e164">{value}</p>
    </div>
  );
}

describe('PhoneNumberInput (component)', () => {
  it('emits E.164 for a US national number', () => {
    cy.mount(<PhoneHarness />);
    cy.get('input[type="tel"], input[role="textbox"], input')
      .filter(':visible')
      .first()
      .type('2025550123');

    cy.get('[data-cy=phone-e164]').should('contain', '+12025550123');
  });
});
