import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sectionHasSidebarNewAiData } from '@/utils/aiSidebarNewData';
import {
  markDashboardAiPatchPersisted,
  stashDashboardAiPatch,
  takeDashboardAiPatch,
} from '@/utils/aiDashboardPatchCache';
import { markAiSectionReviewed } from '@/utils/aiSectionReviewState';

function installSessionStorage() {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
  vi.stubGlobal('sessionStorage', storage);
  vi.stubGlobal('window', {
    sessionStorage: storage,
    dispatchEvent: () => true,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  });
}

describe('sectionHasSidebarNewAiData', () => {
  beforeEach(() => {
    installSessionStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('marks section when an unpersisted stash is unread', () => {
    stashDashboardAiPatch({
      file_id: 'file-a',
      section_id: '7',
      section_key: 'insurance_policies',
      result: { member_id: '123' },
      pending_accept: true,
      vault_persisted: false,
      createdAt: Date.now(),
    });

    expect(sectionHasSidebarNewAiData('7')).toBe(true);
  });

  it('marks every matching section that has its own unread stash', () => {
    stashDashboardAiPatch({
      file_id: 'file-a',
      section_id: '7',
      section_key: 'insurance_policies',
      result: { member_id: '123' },
      pending_accept: true,
      createdAt: Date.now(),
    });
    stashDashboardAiPatch({
      file_id: 'file-a',
      section_id: '15',
      section_key: 'health_information',
      result: { provider: 'Acme' },
      pending_accept: true,
      createdAt: Date.now(),
    });

    expect(sectionHasSidebarNewAiData('7')).toBe(true);
    expect(sectionHasSidebarNewAiData('15')).toBe(true);
  });

  it('hides badge after review or vault persist', () => {
    stashDashboardAiPatch({
      file_id: 'file-a',
      section_id: '5',
      section_key: 'vehicles',
      result: { make: 'Toyota' },
      pending_accept: true,
      createdAt: Date.now(),
    });
    markAiSectionReviewed({ sectionId: '5', fileId: 'file-a' });
    expect(sectionHasSidebarNewAiData('5')).toBe(false);

    takeDashboardAiPatch('5', 'file-a');
    stashDashboardAiPatch({
      file_id: 'file-b',
      section_id: '5',
      section_key: 'vehicles',
      result: { make: 'Honda' },
      createdAt: Date.now(),
    });
    markDashboardAiPatchPersisted('5', 'file-b');
    expect(sectionHasSidebarNewAiData('5')).toBe(false);
  });

  it('marks quiet partner pending rows without highlightUpload', () => {
    expect(
      sectionHasSidebarNewAiData('15', [
        {
          file_id: 'file-a',
          targetSectionId: '15',
          documentSummary: 'Health insurance card fields',
          extractedFields: [],
          navigateIntent: 'review',
          highlightUpload: false,
        },
      ]),
    ).toBe(true);
  });
});
