import { clearAiSectionReviewed } from '@/utils/aiSectionReviewState';

const STORAGE_KEY = 'orderly_dashboard_ai_patches';

export type DetectedAiFact = {
  concept?: string | null;
  field_key?: string;
  label: string;
  value: string;
  section_key?: string;
  subsection?: string | null;
};

export type StashedAiPatch = {
  file_id: string;
  section_id: string;
  section_key: string;
  subsection?: string | null;
  result: unknown;
  /** Unwrapped patch snapshot for quick apply */
  patch?: Record<string, unknown>;
  /** Temporary visualized facts from this document read */
  detectedFields?: DetectedAiFact[];
  document_summary?: string;
  file_name?: string;
  createdAt: number;
  /**
   * Overview inbox: stashed for review — not written to the vault until Accept.
   */
  pending_accept?: boolean;
  /** True after a successful client vault write for this stash. */
  vault_persisted?: boolean;
};

/** One stash slot per document × section so batch uploads never overwrite. */
function stashKey(sectionId: string, fileId?: string | null): string {
  const section = String(sectionId || '').trim();
  const file = String(fileId || '').trim();
  return file ? `${section}::${file}` : section;
}

function parseStashKey(key: string): { sectionId: string; fileId: string } {
  const sep = key.indexOf('::');
  if (sep < 0) return { sectionId: key, fileId: '' };
  return {
    sectionId: key.slice(0, sep),
    fileId: key.slice(sep + 2),
  };
}

function readMap(): Record<string, StashedAiPatch> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};

    // Migrate legacy section-only keys → section::file when file_id is present.
    const migrated: Record<string, StashedAiPatch> = {};
    Object.entries(parsed as Record<string, StashedAiPatch>).forEach(
      ([key, entry]) => {
        if (!entry || typeof entry !== 'object') return;
        const sectionId = entry.section_id || parseStashKey(key).sectionId;
        const fileId = entry.file_id || parseStashKey(key).fileId;
        const nextKey = stashKey(sectionId, fileId || undefined);
        migrated[nextKey] = {
          ...entry,
          section_id: sectionId,
          file_id: fileId || entry.file_id || '',
        };
      },
    );
    return migrated;
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, StashedAiPatch>) {
  if (typeof window === 'undefined') return;
  try {
    if (!Object.keys(map).length) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function entriesForSection(sectionId: string): StashedAiPatch[] {
  const sid = String(sectionId || '').trim();
  if (!sid) return [];
  return Object.values(readMap())
    .filter(entry => entry.section_id === sid)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function stashDashboardAiPatch(entry: StashedAiPatch) {
  const map = readMap();
  const key = stashKey(entry.section_id, entry.file_id);
  map[key] = {
    ...entry,
    createdAt: entry.createdAt || Date.now(),
  };
  writeMap(map);
  clearAiSectionReviewed(entry.section_id);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('orderly-ai-patch-stashed', {
        detail: {
          sectionId: entry.section_id,
          fileId: entry.file_id,
        },
      }),
    );
  }
}

/**
 * Remove and return a stash.
 * Prefer fileId when accepting a specific document so sibling uploads stay.
 * Without fileId, returns/removes the newest stash for the section.
 */
export function takeDashboardAiPatch(
  sectionId: string,
  fileId?: string | null,
): StashedAiPatch | null {
  const map = readMap();
  if (fileId) {
    const key = stashKey(sectionId, fileId);
    const entry = map[key];
    if (!entry) {
      // Legacy / missing file key — fall back to section scan.
      const fallback = entriesForSection(sectionId).find(
        item => !item.file_id || item.file_id === fileId,
      );
      if (!fallback) return null;
      const fallbackKey = stashKey(fallback.section_id, fallback.file_id);
      delete map[fallbackKey];
      writeMap(map);
      return fallback;
    }
    delete map[key];
    writeMap(map);
    return entry;
  }

  const newest = entriesForSection(sectionId)[0];
  if (!newest) return null;
  delete map[stashKey(newest.section_id, newest.file_id)];
  writeMap(map);
  return newest;
}

/** Peek one stash (newest for section, or exact file when fileId provided). */
export function peekDashboardAiPatch(
  sectionId: string,
  fileId?: string | null,
): StashedAiPatch | null {
  if (fileId) {
    const exact = readMap()[stashKey(sectionId, fileId)];
    if (exact) return exact;
    return (
      entriesForSection(sectionId).find(
        item => !item.file_id || item.file_id === fileId,
      ) || null
    );
  }
  return entriesForSection(sectionId)[0] || null;
}

/** All stashes for a section (newest first) — used for multi-doc Accept/merge. */
export function listDashboardAiPatchesForSection(
  sectionId: string,
): StashedAiPatch[] {
  return entriesForSection(sectionId);
}

/** True when a section still has AI fills that have not hit the vault yet. */
export function hasUnpersistedDashboardAiPatches(sectionId: string): boolean {
  return listDashboardAiPatchesForSection(sectionId).some(
    entry => !entry.vault_persisted,
  );
}

export function markDashboardAiPatchPersisted(
  sectionId: string,
  fileId?: string | null,
): void {
  const map = readMap();
  const sid = String(sectionId || '').trim();
  if (!sid) return;
  let changed = false;
  Object.entries(map).forEach(([key, entry]) => {
    if (!entry || entry.section_id !== sid) return;
    if (fileId && entry.file_id && entry.file_id !== fileId) return;
    map[key] = { ...entry, vault_persisted: true, pending_accept: false };
    changed = true;
  });
  if (changed) writeMap(map);
}

export function listDashboardAiPatches(): StashedAiPatch[] {
  return Object.values(readMap()).sort((a, b) => b.createdAt - a.createdAt);
}

export function listAllDetectedFields(): DetectedAiFact[] {
  const facts: DetectedAiFact[] = [];
  const seen = new Set<string>();

  listDashboardAiPatches().forEach(entry => {
    (entry.detectedFields || []).forEach(fact => {
      const dedupe = `${fact.label}|${fact.value}`.toLowerCase();
      if (seen.has(dedupe)) return;
      seen.add(dedupe);
      facts.push({
        ...fact,
        section_key: fact.section_key || entry.section_key,
      });
    });
  });

  return facts;
}
