/**
 * After overview AI upload: merge extracted data into each matched section
 * and SAVE to the backend in the background — user does not open sections manually.
 */

import { getSection1, saveSection1 } from '@/libs/api/section1';
import { getSection5, saveSection5 } from '@/libs/api/section5';
import { getSection6, saveSection6 } from '@/libs/api/section6';
import { getSection7, saveSection7 } from '@/libs/api/section7';
import { getSection8, saveSection8 } from '@/libs/api/section8';
import { getSection9, saveSection9 } from '@/libs/api/section9';
import { getSection10, saveSection10 } from '@/libs/api/section10';
import { getSection11, saveSection11 } from '@/libs/api/section11';
import { getSection12, saveSection12 } from '@/libs/api/section12';
import { getSection13, saveSection13 } from '@/libs/api/section13';
import { getSection14, saveSection14 } from '@/libs/api/section14';
import { getSection15, saveSection15 } from '@/libs/api/section15';
import { getSection16, saveSection16 } from '@/libs/api/section16';
import { getSection17, saveSection17 } from '@/libs/api/section17';
import { getSection18, saveSection18 } from '@/libs/api/section18';
import { getSection19, saveSection19 } from '@/libs/api/section19';
import { getSection20, saveSection20 } from '@/libs/api/section20';
import { getSection21, saveSection21 } from '@/libs/api/section21';
import {
  mapSection1ResponseToUI,
  mapUIToSection1Payload,
} from '@/libs/mappers/section1Mapper';
import { applyAiResultToSectionForm } from '@/utils/aiSectionFormApply';
import { AI_SECTION_BY_ID } from '@/utils/aiSectionRegistry';
import {
  listDashboardAiPatchesForSection,
  takeDashboardAiPatch,
  type StashedAiPatch,
} from '@/utils/aiDashboardPatchCache';
import { markAiAutofillDoneForSection } from '@/utils/aiAutofillDoneSections';
import { markAiSectionFilled } from '@/utils/aiSectionFillGuard';
import { markAiSectionReviewed } from '@/utils/aiSectionReviewState';

type SectionIo = {
  load: () => Promise<Record<string, unknown>>;
  save: (data: Record<string, unknown>) => Promise<unknown>;
};

async function loadDataEnvelope(loader: () => Promise<any>) {
  const res = await loader();
  if (res?.data && typeof res.data === 'object') return res.data as Record<string, unknown>;
  if (res && typeof res === 'object') return res as Record<string, unknown>;
  return {};
}

const SECTION_IO: Record<string, SectionIo> = {
  '1': {
    load: async () => mapSection1ResponseToUI(await getSection1()),
    save: async data => saveSection1(mapUIToSection1Payload(data)),
  },
  '5': {
    load: () => loadDataEnvelope(getSection5),
    save: data => saveSection5({ '5A': data?.['5A'] ?? [] }),
  },
  '6': {
    load: () => loadDataEnvelope(getSection6),
    save: data => saveSection6({ '6A': data?.['6A'] }),
  },
  '7': {
    load: () => loadDataEnvelope(getSection7),
    save: data => saveSection7({ '7A': data?.['7A'] }),
  },
  '8': {
    load: () => loadDataEnvelope(getSection8),
    save: data => saveSection8({ '8A': data?.['8A'] }),
  },
  '9': {
    load: () => loadDataEnvelope(getSection9),
    save: data => saveSection9({ '9A': data?.['9A'] }),
  },
  '10': {
    load: () => loadDataEnvelope(getSection10),
    save: data => saveSection10({ '10A': data?.['10A'] }),
  },
  '11': {
    load: () => loadDataEnvelope(getSection11),
    save: data => saveSection11({ '11A': data?.['11A'] }),
  },
  '12': {
    load: () => loadDataEnvelope(getSection12),
    save: data =>
      saveSection12({
        ...(data?.['12A'] ? { '12A': data['12A'] } : {}),
        ...(data?.['12B'] ? { '12B': data['12B'] } : {}),
      }),
  },
  '13': {
    load: () => loadDataEnvelope(getSection13),
    save: data => saveSection13({ '13A': data?.['13A'] }),
  },
  '14': {
    load: () => loadDataEnvelope(getSection14),
    save: data => saveSection14({ '14A': data?.['14A'] }),
  },
  '15': {
    load: () => loadDataEnvelope(getSection15),
    save: data =>
      saveSection15({
        ...(data?.['15A'] ? { '15A': data['15A'] } : {}),
        ...(data?.['15B'] ? { '15B': data['15B'] } : {}),
      }),
  },
  '16': {
    load: () => loadDataEnvelope(getSection16),
    save: data =>
      saveSection16({
        ...(data?.['16A'] ? { '16A': data['16A'] } : {}),
        ...(data?.['16B'] ? { '16B': data['16B'] } : {}),
      }),
  },
  '17': {
    load: () => loadDataEnvelope(getSection17),
    save: data => saveSection17(data),
  },
  '18': {
    load: () => loadDataEnvelope(getSection18),
    save: data => saveSection18(data),
  },
  '19': {
    load: () => loadDataEnvelope(getSection19),
    save: data => saveSection19(data),
  },
  '20': {
    load: () => loadDataEnvelope(getSection20),
    save: data => saveSection20(data),
  },
  '21': {
    load: () => loadDataEnvelope(getSection21),
    save: data => saveSection21(data),
  },
};

export type BackgroundPersistResult = {
  sectionId: string;
  sectionKey: string;
  ok: boolean;
  data?: Record<string, unknown>;
  error?: string;
  addedCards?: number;
};

/** Serialize load→merge→save per section so rapid Accepts cannot overwrite each other. */
const persistChains = new Map<string, Promise<unknown>>();

function enqueueSectionPersist<T>(
  sectionId: string,
  task: () => Promise<T>,
): Promise<T> {
  const prev = persistChains.get(sectionId) || Promise.resolve();
  const next = prev.catch(() => undefined).then(task);
  persistChains.set(sectionId, next.then(() => undefined, () => undefined));
  return next;
}

async function persistAiResultUnlocked(args: {
  sectionId: string;
  sectionKey?: string;
  result: unknown;
  subsection?: string | null;
}): Promise<BackgroundPersistResult> {
  const { sectionId, result, subsection } = args;
  const sectionKey =
    args.sectionKey || AI_SECTION_BY_ID[sectionId]?.key || sectionId;
  const io = SECTION_IO[sectionId];

  if (!io) {
    return {
      sectionId,
      sectionKey,
      ok: false,
      error: `No save handler for section ${sectionId}`,
    };
  }

  try {
    const current = await io.load();
    const beforeLen = Array.isArray(current?.[subsection || ''] )
      ? (current[subsection as string] as unknown[]).length
      : Array.isArray(current?.['5A'])
        ? (current['5A'] as unknown[]).length
        : Array.isArray(current?.['7A'])
          ? (current['7A'] as unknown[]).length
          : 0;

    const merged = applyAiResultToSectionForm(
      sectionId,
      current,
      result,
      subsection,
      // Overview batch: update matching cards, never spawn duplicates, no popup spam.
      { conflictMode: 'overwrite' },
    );

    if (!merged) {
      return {
        sectionId,
        sectionKey,
        ok: false,
        error: 'No matching fields to apply',
      };
    }

    await io.save(merged);

    const defaultSub =
      subsection || AI_SECTION_BY_ID[sectionId]?.defaultSubsection || '';
    const afterItems = Array.isArray(merged[defaultSub])
      ? (merged[defaultSub] as unknown[])
      : Array.isArray(merged['5A'])
        ? (merged['5A'] as unknown[])
        : Array.isArray(merged['7A'])
          ? (merged['7A'] as unknown[])
          : [];

    if (typeof window !== 'undefined') {
      const { setSectionLastUpdated } = await import(
        '@/utils/sectionLastUpdated'
      );
      setSectionLastUpdated(sectionId);
      window.dispatchEvent(
        new CustomEvent('orderly-ai-section-persisted', {
          detail: { sectionId, sectionKey, data: merged },
        }),
      );
    }

    return {
      sectionId,
      sectionKey,
      ok: true,
      data: merged,
      addedCards: Math.max(0, afterItems.length - beforeLen),
    };
  } catch (error: any) {
    return {
      sectionId,
      sectionKey,
      ok: false,
      error: error?.message || 'Background save failed',
    };
  }
}

/**
 * Load current section → conceptually merge AI result → save. Runs without UI navigation.
 * Concurrent calls for the same section are queued (no lost Toyota/Honda/Jeep cards).
 */
export async function persistAiResultToSectionBackground(args: {
  sectionId: string;
  sectionKey?: string;
  result: unknown;
  subsection?: string | null;
}): Promise<BackgroundPersistResult> {
  return enqueueSectionPersist(args.sectionId, () =>
    persistAiResultUnlocked(args),
  );
}

export type FlushStashesResult = {
  ok: boolean;
  saved: number;
  failed: number;
  sectionIds: string[];
  error?: string;
};

/**
 * Persist every pending stash for a section (oldest first), then drop them.
 * Used when Accepting one inbox row so sibling docs (Honda/Jeep) are not left behind.
 */
export async function persistAllPendingStashesForSection(args: {
  sectionId: string;
  /** Prefer this stash first (e.g. with user-edited facts). */
  primary?: StashedAiPatch | null;
  onFileDone?: (fileId: string, sectionId: string) => void;
}): Promise<FlushStashesResult> {
  const { sectionId, primary, onFileDone } = args;
  const others = listDashboardAiPatchesForSection(sectionId).filter(
    item =>
      !primary ||
      item.file_id !== primary.file_id ||
      item.section_id !== primary.section_id,
  );
  // Oldest first so chronological uploads append in order.
  const queue = [
    ...(primary ? [primary] : []),
    ...[...others].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)),
  ];

  if (!queue.length) {
    return { ok: true, saved: 0, failed: 0, sectionIds: [] };
  }

  let saved = 0;
  let failed = 0;
  let lastError: string | undefined;
  const sectionIds = new Set<string>([sectionId]);

  for (const stash of queue) {
    const result = await persistAiResultToSectionBackground({
      sectionId: stash.section_id,
      sectionKey: stash.section_key,
      result: stash.result,
      subsection: stash.subsection,
    });

    if (!result.ok) {
      failed += 1;
      lastError = result.error;
      continue;
    }

    saved += 1;
    markAiSectionFilled(stash.section_id);
    markAiAutofillDoneForSection({
      sectionId: stash.section_id,
      fileId: stash.file_id,
      fileName: stash.file_name,
    });
    markAiSectionReviewed({
      sectionId: stash.section_id,
      fileId: stash.file_id,
    });
    const { markDashboardAiPatchPersisted } = await import(
      '@/utils/aiDashboardPatchCache'
    );
    markDashboardAiPatchPersisted(stash.section_id, stash.file_id);
    takeDashboardAiPatch(stash.section_id, stash.file_id);
    onFileDone?.(stash.file_id, stash.section_id);
    sectionIds.add(stash.section_id);
  }

  return {
    ok: failed === 0,
    saved,
    failed,
    sectionIds: [...sectionIds],
    error: lastError,
  };
}

/**
 * Also flush partner-section stashes for the same uploaded files
 * (vehicle Accept also saves that file's insurance extract).
 */
export async function persistPartnerStashesForFiles(args: {
  fileIds: string[];
  excludeSectionId?: string;
  onFileDone?: (fileId: string, sectionId: string) => void;
}): Promise<FlushStashesResult> {
  const { fileIds, excludeSectionId, onFileDone } = args;
  const fileSet = new Set(fileIds.filter(Boolean));
  if (!fileSet.size) {
    return { ok: true, saved: 0, failed: 0, sectionIds: [] };
  }

  const { listDashboardAiPatches, markDashboardAiPatchPersisted } = await import(
    '@/utils/aiDashboardPatchCache'
  );
  const partners = listDashboardAiPatches()
    .filter(
      item =>
        fileSet.has(item.file_id) &&
        item.section_id !== excludeSectionId,
    )
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  let saved = 0;
  let failed = 0;
  let lastError: string | undefined;
  const sectionIds = new Set<string>();

  for (const stash of partners) {
    const result = await persistAiResultToSectionBackground({
      sectionId: stash.section_id,
      sectionKey: stash.section_key,
      result: stash.result,
      subsection: stash.subsection,
    });
    if (!result.ok) {
      failed += 1;
      lastError = result.error;
      continue;
    }
    saved += 1;
    markAiSectionFilled(stash.section_id);
    markAiAutofillDoneForSection({
      sectionId: stash.section_id,
      fileId: stash.file_id,
      fileName: stash.file_name,
    });
    markAiSectionReviewed({
      sectionId: stash.section_id,
      fileId: stash.file_id,
    });
    markDashboardAiPatchPersisted(stash.section_id, stash.file_id);
    takeDashboardAiPatch(stash.section_id, stash.file_id);
    onFileDone?.(stash.file_id, stash.section_id);
    sectionIds.add(stash.section_id);
  }

  return {
    ok: failed === 0,
    saved,
    failed,
    sectionIds: [...sectionIds],
    error: lastError,
  };
}
