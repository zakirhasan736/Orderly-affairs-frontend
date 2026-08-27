import { describe, expect, it } from 'vitest';
import {
  pickAttachedVaultDocument,
  scoreVaultDocumentMatch,
} from '@/utils/vaultAttachedDocument';
import type { SchemaSub } from '@/vault-prototype/types';

const licenseSub: SchemaSub = {
  id: 'drivers-license',
  name: "Driver's License / State ID",
  kind: 'form',
  fields: [],
};

const personalSub: SchemaSub = {
  id: 'personal-details',
  name: 'Personal Details',
  kind: 'form',
  fields: [],
};

const vehicleSub: SchemaSub = {
  id: 'current-vehicles',
  name: 'Current Vehicles',
  kind: 'entries',
  entry: 'vehicle',
  fields: [],
};

describe('vaultAttachedDocument', () => {
  it('matches a license upload to the license subsection', () => {
    const score = scoreVaultDocumentMatch(
      {
        fileName: 'IMG_1397.jpg',
        displayTitle: "Driver's license",
        documentSummary: 'Texas driver license for Sebastian',
      },
      licenseSub,
    );
    expect(score).toBeGreaterThan(0);
  });

  it('does not attach a license scan to an unrelated subsection', () => {
    const picked = pickAttachedVaultDocument(
      [
        {
          id: '1',
          fileName: 'IMG_1397.jpg',
          status: 'filled',
          createdAt: '',
          updatedAt: '',
          fileId: 'file-1',
          displayTitle: "Driver's license",
          documentSummary: 'Texas driver license',
        },
      ],
      personalSub,
    );
    expect(picked).toBeNull();
  });

  it('uses an embedded file_id on the row when present', () => {
    const picked = pickAttachedVaultDocument(
      [],
      licenseSub,
      {
        photo: {
          text: '',
          files: [{ file_id: 'abc', name: 'front.jpg', mime_type: 'image/jpeg' }],
        },
      },
    );
    expect(picked?.fileId).toBe('abc');
  });

  it('matches a vehicle row to a document that names that car', () => {
    const picked = pickAttachedVaultDocument(
      [
        {
          id: '2',
          fileName: 'honda-title.pdf',
          status: 'done',
          createdAt: '',
          updatedAt: '2026-08-01',
          fileId: 'veh-1',
          displayTitle: 'Vehicle title',
          documentSummary: '2019 Honda CR-V',
        },
      ],
      vehicleSub,
      { year_make_and_model: '2019 Honda CR-V' },
    );
    expect(picked?.fileId).toBe('veh-1');
  });
});
