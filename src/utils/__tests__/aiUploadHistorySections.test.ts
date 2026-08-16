import { describe, expect, it } from 'vitest';
import {
  hydrateAiUploadHistoryFromServer,
  itemMatchesSection,
  listAiUploadHistory,
  mapServerDocumentsToHistory,
  sameDocumentTopic,
  toVaultSectionId,
  clearAiUploadHistory,
} from '@/utils/aiUploadHistory';

describe('aiUploadHistory section mapping', () => {
  it('maps section keys to vault ids', () => {
    expect(toVaultSectionId('insurance_policies')).toBe('7');
    expect(toVaultSectionId('vehicles')).toBe('5');
    expect(toVaultSectionId('7')).toBe('7');
    expect(toVaultSectionId('5A')).toBe('5');
    expect(toVaultSectionId('overview')).toBeNull();
  });

  it('hydrates overview docs so section popups can find them by id', () => {
    clearAiUploadHistory();
    hydrateAiUploadHistoryFromServer([
      {
        file_id: 'doc-1',
        original_filename: 'Auto_Insurance.pdf',
        mime_type: 'application/pdf',
        status: 'ready',
        filled: true,
        section: 'insurance_policies',
        consumed_sections: ['insurance_policies'],
        pending_sections: ['vehicles'],
      },
    ]);

    const insurance = listAiUploadHistory({ sectionId: '7' });
    const vehicles = listAiUploadHistory({ sectionId: '5' });
    expect(insurance).toHaveLength(1);
    expect(vehicles).toHaveLength(1);
    expect(insurance[0].fileName).toContain('Auto_Insurance');
    expect(insurance[0].sectionIds).toEqual(
      expect.arrayContaining(['7', '5']),
    );
  });

  it('maps server documents without waiting on hydrate', () => {
    const mapped = mapServerDocumentsToHistory([
      {
        file_id: 's3-1',
        original_filename: 'Passport.pdf',
        mime_type: 'application/pdf',
        status: 'ready',
        filled: true,
        section: 'vital_information',
        consumed_sections: ['vital_information'],
      },
    ]);
    expect(mapped).toHaveLength(1);
    expect(mapped[0].fileId).toBe('s3-1');
    expect(mapped[0].fileName).toBe('Passport.pdf');
    expect(itemMatchesSection(mapped[0], '1')).toBe(true);
  });

  it('treats renamed Jeep insurance files as the same replaceable topic', () => {
    expect(
      sameDocumentTopic(
        { fileName: 'Jeep_Wrangler_Insurance.pdf', source: 'overview' },
        { fileName: 'Geico_Jeep_Policy.pdf', source: 'overview' },
      ),
    ).toBe(true);
    expect(
      sameDocumentTopic(
        { fileName: 'Jeep_Insurance.pdf', source: 'overview' },
        { fileName: 'Vehicle_Registration_Jeep_Wrangler.pdf', source: 'overview' },
      ),
    ).toBe(false);
  });
});
