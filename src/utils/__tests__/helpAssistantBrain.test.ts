import { describe, expect, it } from 'vitest';
import { respondToHelpMessage } from '@/utils/helpAssistantBrain';

const sampleVault = {
  formData: {
    '3': { '3A': { letter_to: 'Sam' } },
    '5': {
      '5A': [
        {
          make: 'Toyota',
          model: 'Camry',
          year: '2020',
          registration_expiry: '2026-09-15',
        },
      ],
    },
    '7': {
      '7A': [
        {
          insurance_company: 'Geico',
          policy_expiry: '2026-08-20',
        },
      ],
    },
  },
  currentSectionId: '3',
};

describe('helpAssistantBrain intent routing', () => {
  it('answers renewals instead of Next of Kin letter', () => {
    const reply = respondToHelpMessage(
      'When is my next renewal?',
      sampleVault,
    );
    expect(reply.text).toMatch(/renewals|expir/i);
    expect(reply.text).not.toMatch(/Letter to Next of Kin/i);
    expect(reply.text).toMatch(/Geico|Toyota|Camry/i);
  });

  it('answers insurance renewal even on letter page', () => {
    const reply = respondToHelpMessage(
      'When is my next insurance renewal?',
      sampleVault,
    );
    expect(reply.text).toMatch(/Geico|policy expiry|Insurance/i);
    expect(reply.text).not.toMatch(/Letter to Next of Kin/i);
  });

  it('does not treat bare next as Letter to Next of Kin', () => {
    const reply = respondToHelpMessage('what is next?', sampleVault);
    expect(reply.text).not.toMatch(/Letter to Next of Kin — that’s section 3/i);
  });

  it('lists empty vehicle fields without inventing letter section', () => {
    const reply = respondToHelpMessage(
      "What's empty in Vehicles?",
      sampleVault,
    );
    expect(reply.text).toMatch(/Vehicles/i);
    expect(reply.text).not.toMatch(/Letter to Next of Kin/i);
    expect(reply.text).toMatch(/still empty|filled/i);
  });

  it('asks which section when empty question has no target', () => {
    const reply = respondToHelpMessage("What's still empty?", sampleVault);
    expect(reply.text).toMatch(/which area/i);
    expect(reply.text).not.toMatch(/Letter to Next of Kin/i);
  });

  it('opens insurance when asked to open insurance', () => {
    const reply = respondToHelpMessage('Open Insurance', sampleVault);
    expect(reply.text).toMatch(/Insurance/i);
    expect(reply.text).not.toMatch(/Letter to Next of Kin/i);
  });

  it('does not treat legal documents question as upload', () => {
    const reply = respondToHelpMessage(
      'Tell me about Legal Documents',
      sampleVault,
    );
    expect(reply.text).not.toMatch(/uploading a document is often/i);
  });

  it('handles upload intent without stealing section from current page', () => {
    const reply = respondToHelpMessage('I want to upload a pdf', sampleVault);
    expect(reply.text).toMatch(/upload/i);
    expect(reply.text).not.toMatch(/Letter to Next of Kin — that’s section 3/i);
  });

  it('live agent is coming soon', () => {
    const reply = respondToHelpMessage('Talk to a live agent', sampleVault);
    expect(reply.text).toMatch(/coming soon/i);
  });

  it('does not treat "will" in a sentence as Legal Documents', () => {
    const reply = respondToHelpMessage(
      'What will happen after I upload?',
      sampleVault,
    );
    expect(reply.text).not.toMatch(/Legal Documents — that’s section/i);
  });

  it('does not treat bare family as treasured items', () => {
    const reply = respondToHelpMessage(
      'Can my family help fill this?',
      sampleVault,
    );
    expect(reply.text).not.toMatch(/Family & Treasured|Treasured/i);
  });

  it('opens current section only when user says this section', () => {
    const reply = respondToHelpMessage(
      "What's empty in this section?",
      sampleVault,
    );
    expect(reply.text).toMatch(/Letter to Next of Kin|section 3/i);
  });

  it('locates a marriage certificate from vault fields', () => {
    const reply = respondToHelpMessage("where's my marriage certificate", {
      formData: {
        '20': {
          '20A': {
            marriage_certificate: {
              text: 'Safe deposit box 12',
              files: [{ name: 'marriage-cert.pdf' }],
            },
          },
        },
      },
      currentSectionId: '1',
    });
    expect(reply.text).toMatch(/Marriage Certificate/i);
    expect(reply.text).toMatch(/marriage-cert\.pdf|Safe deposit box 12/i);
    expect(reply.text).not.toMatch(/Try naming a section/i);
    expect(reply.actions?.some(a => a.type === 'navigate' && a.sectionId === '20')).toBe(
      true,
    );
  });

  it('points to Legal Documents when marriage certificate is missing', () => {
    const reply = respondToHelpMessage("where's my marriage certificate", {
      formData: { '20': { '20A': {} } },
      currentSectionId: '1',
    });
    expect(reply.text).toMatch(/don't see|don’t see|Legal Documents/i);
    expect(reply.text).toMatch(/Marriage Certificate/i);
    expect(reply.text).not.toMatch(/Try naming a section/i);
  });
});
