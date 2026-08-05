import { describe, expect, it } from 'vitest';
import {
  hydrateAiUploadHistoryFromServer,
  listAiUploadHistory,
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
});
