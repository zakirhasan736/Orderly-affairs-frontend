import { describe, expect, it } from 'vitest';
import {
  getNokLetterProgress,
  getNokLetterSectionProgress,
  getSectionProgress,
  hasAtLeastOneNokLetter,
  isMeaningfulFilled,
} from '@/utils/sectionCompletion';
import { NOK_LETTER_DEFAULTS } from '@/utils/nokLetterPreview';

describe('sectionCompletion', () => {
  it('treats empty / placeholder strings as unfilled', () => {
    expect(isMeaningfulFilled('')).toBe(false);
    expect(isMeaningfulFilled('   ')).toBe(false);
    expect(isMeaningfulFilled('[Key Bag Location]')).toBe(false);
    expect(isMeaningfulFilled('Hall closet')).toBe(true);
  });

  it('marks section 3 complete when at least one letter exists', () => {
    const progress = getSectionProgress('3', {
      formData: {},
      dashboardNokLetter: {
        id: 'abc',
        owner_id: 'owner',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
    });
    expect(progress.complete).toBe(true);
    expect(progress.percent).toBe(100);
  });

  it('marks section 3 incomplete when no letter exists', () => {
    const progress = getNokLetterSectionProgress({}, null);
    expect(progress.complete).toBe(false);
    expect(progress.percent).toBe(0);
    expect(hasAtLeastOneNokLetter({}, null)).toBe(false);
  });

  it('detects a letter under next_of_kin_letters_by_nok', () => {
    expect(
      hasAtLeastOneNokLetter(
        {
          next_of_kin_letters_by_nok: {
            nok1: { letter_to: 'Alex', nok_email: 'a@b.com' },
          },
        },
        null,
      ),
    ).toBe(true);
  });

  it('still scores individual letter fields for editor UX helpers', () => {
    const progress = getNokLetterProgress({
      letter_to: 'Alex',
      letter_greeting: 'Dearest',
      letter_opening: 'Hello friend, custom note.',
      kit_description: 'Custom kit blurb',
      access_url: 'https://example.com/custom-kit',
      login_credentials_text: 'Use email and the password card.',
      nok_email: 'a@b.com',
      nok_phone: '555',
      password_card_location: 'safe',
      accessible_sections: 'Once you log in, manage Vehicles and Banking.',
      key_bag_info: 'Custom key bag note. It is located',
      key_bag_location: 'drawer',
      documents_bag_info: 'Custom docs bag note. It is located',
      documents_bag_location: 'shelf',
      incomplete_kit_message: 'Custom incomplete note',
      closing_message: 'Custom closing',
      letter_signature: 'Always,',
      signer_name: 'Jordan',
    });
    expect(progress.complete).toBe(true);
    expect(progress.percent).toBe(100);
  });

  it('does not treat stock template defaults as filled letter fields', () => {
    const progress = getNokLetterProgress({
      id: 'abc',
      owner_id: 'owner',
      letter_to: 'Alex Casey',
      letter_greeting: 'Dear',
      letter_opening: NOK_LETTER_DEFAULTS.letter_opening,
      kit_description: NOK_LETTER_DEFAULTS.kit_description,
      access_url: NOK_LETTER_DEFAULTS.access_url,
      nok_email: 'alex@example.com',
      nok_phone: '555-0100',
      password_card_location: 'Hall closet',
      accessible_sections: NOK_LETTER_DEFAULTS.accessible_sections,
      key_bag_info: NOK_LETTER_DEFAULTS.key_bag_info,
      key_bag_location: 'Hook by door',
      documents_bag_info: NOK_LETTER_DEFAULTS.documents_bag_info,
      documents_bag_location: 'Safe',
      incomplete_kit_message: NOK_LETTER_DEFAULTS.incomplete_kit_message,
      closing_message: NOK_LETTER_DEFAULTS.closing_message,
      letter_signature: NOK_LETTER_DEFAULTS.letter_signature,
      signer_name: 'Jordan Owner',
    });
    expect(progress.complete).toBe(false);
    expect(progress.percent).toBeLessThan(100);
    expect(progress.filled).toBeGreaterThan(0);
  });

  it('marks section 2 incomplete with no next of kin', () => {
    const progress = getSectionProgress('2', {
      formData: {},
      myNextKin: [],
    });
    expect(progress.complete).toBe(false);
    expect(progress.percent).toBe(0);
  });

  it('marks section 2 complete when any access person exists', () => {
    const progress = getSectionProgress('2', {
      formData: {},
      myNextKin: [
        {
          full_name: 'Alex',
          email: 'a@b.com',
          relationship: 'Child',
          immediate_access: false,
        },
      ],
    });
    expect(progress.complete).toBe(true);
    expect(progress.percent).toBe(100);
  });

  it('marks section 4 incomplete with no personal messages', () => {
    const progress = getSectionProgress('4', {
      formData: { '4': { '4A': { letters_data: [] } } },
    });
    expect(progress.complete).toBe(false);
    expect(progress.percent).toBe(0);
  });

  it('marks section 4 complete when any personal message exists', () => {
    const progress = getSectionProgress('4', {
      formData: {
        '4': {
          '4A': {
            letters_data: [{ recipient_name: 'Alex', title: 'Hello' }],
          },
        },
      },
    });
    expect(progress.complete).toBe(true);
    expect(progress.percent).toBe(100);
  });
});
