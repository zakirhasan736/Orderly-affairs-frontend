import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  countPendingAiReviews,
  partitionVaultNavForNewData,
  sectionHasSidebarNewAiData,
} from '@/utils/aiSidebarNewData';
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

describe('countPendingAiReviews', () => {
  beforeEach(() => {
    installSessionStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps a deferred Review later document countable', () => {
    stashDashboardAiPatch({
      file_id: 'file-later',
      section_id: '5',
      section_key: 'vehicles',
      result: { make: 'Honda' },
      detectedFields: [{ label: 'Make', value: 'Honda' }],
      pending_accept: true,
      createdAt: Date.now(),
    });

    expect(countPendingAiReviews('5')).toBe(1);
    expect(countPendingAiReviews()).toBe(1);
  });

  it('drops the count after Accept marks the section reviewed', () => {
    stashDashboardAiPatch({
      file_id: 'file-done',
      section_id: '5',
      section_key: 'vehicles',
      result: { make: 'Honda' },
      detectedFields: [{ label: 'Make', value: 'Honda' }],
      pending_accept: true,
      createdAt: Date.now(),
    });
    markAiSectionReviewed({ sectionId: '5', fileId: 'file-done' });
    takeDashboardAiPatch('5', 'file-done');

    expect(countPendingAiReviews('5')).toBe(0);
    expect(countPendingAiReviews()).toBe(0);
  });
});

describe('partitionVaultNavForNewData', () => {
  const groups = [
    {
      id: 'Start here',
      label: 'Start here',
      items: [
        { apiId: 'dashboard', name: 'Dashboard' },
        { apiId: '0', name: 'Getting started' },
      ],
    },
    {
      id: 'Property',
      label: 'Property',
      items: [
        { apiId: '5', name: 'Vehicles' },
        { apiId: '6', name: 'Residence' },
      ],
    },
    {
      id: 'Protection',
      label: 'Protection',
      items: [{ apiId: '7', name: 'Insurance' }],
    },
  ];

  it('pins matched sections to New data and returns them after the set clears', () => {
    const pinned = partitionVaultNavForNewData(groups, new Set(['5', '7']));
    expect(pinned.newDataItems.map(item => item.apiId)).toEqual(['5', '7']);
    expect(
      pinned.groupsForNav.find(group => group.id === 'Property')?.items.map(
        item => item.apiId,
      ),
    ).toEqual(['6']);
    expect(pinned.groupsForNav.some(group => group.id === 'Protection')).toBe(
      false,
    );

    const afterReview = partitionVaultNavForNewData(groups, new Set());
    expect(afterReview.newDataItems).toEqual([]);
    expect(
      afterReview.groupsForNav
        .find(group => group.id === 'Property')
        ?.items.map(item => item.apiId),
    ).toEqual(['5', '6']);
    expect(
      afterReview.groupsForNav
        .find(group => group.id === 'Protection')
        ?.items.map(item => item.apiId),
    ).toEqual(['7']);
  });
});
