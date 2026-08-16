import { describe, expect, it } from 'vitest';
import {
  removeTopicFromFormData,
  reorderTopicInFormData,
} from '@/utils/vaultNavOrder';

describe('removeTopicFromFormData', () => {
  it('removes nested identity documents under Legal 20A', () => {
    const next = removeTopicFromFormData(
      '20',
      '20A',
      '20A:identity_documents:0',
      {
        '20A': {
          identity_documents: [
            { document_type: 'Passport' },
            { document_type: 'License' },
          ],
        },
      },
    );

    expect(next).toEqual({
      '20A': {
        identity_documents: [{ document_type: 'License' }],
      },
    });
  });

  it('removes root-level identity documents in Vital Information', () => {
    const next = removeTopicFromFormData(
      '1',
      '1A',
      '1A:identity_documents:1',
      {
        identity_documents: [
          { document_type: 'Passport' },
          { document_type: 'State ID' },
        ],
      },
    );

    expect(next).toEqual({
      identity_documents: [{ document_type: 'Passport' }],
    });
  });

  it('removes simple subsection cards such as Other Important Documents', () => {
    const next = removeTopicFromFormData('20', '20C', '20C:0', {
      '20C': [{ document_type: 'Deed' }, { document_type: 'Will' }],
    });

    expect(next).toEqual({
      '20C': [{ document_type: 'Will' }],
    });
  });
});

describe('reorderTopicInFormData', () => {
  it('reorders nested identity documents under 20A', () => {
    const next = reorderTopicInFormData(
      '20',
      '20A',
      '20A:identity_documents:0',
      '20A:identity_documents:1',
      {
        '20A': {
          identity_documents: [
            { document_type: 'Passport' },
            { document_type: 'License' },
          ],
        },
      },
    );

    expect(next).toEqual({
      '20A': {
        identity_documents: [
          { document_type: 'License' },
          { document_type: 'Passport' },
        ],
      },
    });
  });
});
