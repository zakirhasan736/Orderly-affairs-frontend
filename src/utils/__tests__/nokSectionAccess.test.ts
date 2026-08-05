import { describe, expect, it } from 'vitest';
import { nokCanReadSection, nokHasFullKitAccess } from '@/utils/nokSectionAccess';

describe('nokSectionAccess', () => {
  it('allows full kit access to any section', () => {
    expect(
      nokCanReadSection(
        { access_level: 'Full Kit Access', immediate_access: true },
        '12',
      ),
    ).toBe(true);
  });

  it('denies unlisted section for section-specific access', () => {
    expect(
      nokCanReadSection(
        {
          access_level: 'Section-Specific Access',
          authorized_sections: ['1'],
          immediate_access: true,
        },
        '7',
      ),
    ).toBe(false);
  });

  it('allows parent section grant for subsection ids', () => {
    expect(
      nokCanReadSection(
        {
          access_level: 'Section-Specific Access',
          authorized_sections: ['5'],
          immediate_access: true,
        },
        '5A',
      ),
    ).toBe(true);
  });

  it('detects full access via full_access flag', () => {
    expect(
      nokHasFullKitAccess({
        full_access: true,
        authorized_sections: [],
      }),
    ).toBe(true);
  });
});
