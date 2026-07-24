/** @vitest-environment jsdom */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { NOKLetterCard } from '@/components/NOKLetterCard';
import {
  validateAccessCredentialsStep,
  validateAccessPersonStep,
  validateAccessSectionsStep,
  validateAccessWizardStep,
} from '@/utils/accessManagementValidation';
import {
  applyItemsToIndexedList,
  extractAutofillArrayFromPatch,
} from '@/utils/aiMultiItemAutofill';

/**
 * Simulated Access Management wizard state machine — mirrors UI step actions
 * without mounting the 3k-line AccessManagement sheet.
 */
function runAccessWizardFlow(actions: Array<{ type: string; payload?: any }>) {
  let step: 'person' | 'access' | 'credentials' | 'review' = 'person';
  let draft: Record<string, any> = {
    full_name: '',
    email: '',
    relationship: '',
    access_level: 'Full Kit Access',
    authorized_sections: [] as string[],
    master_password: '',
    immediate_access: true,
  };
  const toasts: string[] = [];
  let saved: Record<string, any> | null = null;

  for (const action of actions) {
    if (action.type === 'PATCH') {
      draft = { ...draft, ...action.payload };
      continue;
    }
    if (action.type === 'NEXT') {
      const result = validateAccessWizardStep(step, draft);
      if (!result.ok) {
        toasts.push(result.message || 'Invalid');
        continue;
      }
      if (step === 'person') step = 'access';
      else if (step === 'access') step = 'credentials';
      else if (step === 'credentials') step = 'review';
      continue;
    }
    if (action.type === 'SAVE') {
      for (const id of ['person', 'access', 'credentials'] as const) {
        const result = validateAccessWizardStep(id, draft);
        if (!result.ok) {
          toasts.push(result.message || 'Save failed');
          return { step, draft, toasts, saved };
        }
      }
      saved = { ...draft, _id: 'created-1' };
      toasts.push(`Added ${draft.full_name}`);
    }
  }

  return { step, draft, toasts, saved };
}

describe('Access Management wizard state machine (save/update flow)', () => {
  it('blocks empty person step then completes create flow', () => {
    const blocked = runAccessWizardFlow([{ type: 'NEXT' }]);
    expect(blocked.step).toBe('person');
    expect(blocked.toasts[0]).toMatch(/required|name|email/i);

    const done = runAccessWizardFlow([
      {
        type: 'PATCH',
        payload: {
          full_name: 'Alex Casey',
          email: 'alex@example.com',
          relationship: 'Friend',
        },
      },
      { type: 'NEXT' },
      {
        type: 'PATCH',
        payload: {
          access_level: 'Section-Specific Access',
          authorized_sections: ['1', '4'],
        },
      },
      { type: 'NEXT' },
      {
        type: 'PATCH',
        payload: {
          master_password: 'TempPass123!',
        },
      },
      { type: 'NEXT' },
      { type: 'SAVE' },
    ]);

    expect(done.step).toBe('review');
    expect(done.saved?._id).toBe('created-1');
    expect(done.toasts.at(-1)).toMatch(/Added Alex Casey/);
  });

  it('rejects credentials without password', () => {
    expect(
      validateAccessCredentialsStep({
        immediate_access: true,
        master_password: '',
      }).ok,
    ).toBe(false);
    expect(
      validateAccessPersonStep({
        full_name: 'A',
        email: 'a@b.com',
        relationship: 'Friend',
      }).ok,
    ).toBe(true);
    expect(
      validateAccessSectionsStep({
        access_level: 'Section-Specific Access',
        authorized_sections: ['2'],
      }).ok,
    ).toBe(true);
  });
});

describe('AI autofill save/update/delete card state', () => {
  it('creates multiple cards from document then updates and deletes one', () => {
    const extracted = extractAutofillArrayFromPatch({
      patch: {
        '5A': [
          { make: 'Honda', model: 'CR-V', year: '2022' },
          { make: 'Toyota', model: 'RAV4', year: '2021' },
        ],
      },
      subsectionKey: '5A',
      normalizeItem: raw => ({ ...(raw as object) }) as Record<string, unknown>,
    });

    let cards = applyItemsToIndexedList({
      currentItems: [] as Record<string, unknown>[],
      extractedItems: extracted,
      createEmpty: () => ({ make: '', model: '', year: '' }),
    }).items;

    expect(cards).toHaveLength(2);

    // update state (edit card 2)
    cards = cards.map((card, index) =>
      index === 1 ? { ...card, color: 'Blue' } : card,
    );
    expect(cards[1].color).toBe('Blue');

    // delete state
    cards = cards.filter((_, index) => index !== 0);
    expect(cards).toHaveLength(1);
    expect(cards[0].make).toBe('Toyota');
  });
});

describe('NOKLetterCard (letter card actions)', () => {
  it('shows letter fields and fires view/edit/delete', async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    renderWithProviders(
      <NOKLetterCard
        obj={{
          letter_to: 'Alexis Casey',
          nok_email: 'alexis@example.com',
          nok_phone: '+15550001111',
          password_card_location: 'Safe',
          accessible_sections: ['1', '3'],
          letter_date: null,
          letter_greeting: 'Dear',
        }}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText(/letter to alexis casey/i)).toBeInTheDocument();
    expect(screen.getByText(/upon death/i)).toBeInTheDocument();
    expect(screen.getByText(/alexis@example.com/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /view/i }));
    await user.click(screen.getByRole('button', { name: /edit/i }));
    await user.click(screen.getByRole('button', { name: /delete|remove/i }));

    expect(onView).toHaveBeenCalled();
    expect(onEdit).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalled();
  });
});
