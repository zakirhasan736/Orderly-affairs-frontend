export type AiUploadHistoryItem = {
  id: string;
  fileName: string;
  status: string;
  progress?: number;
  createdAt: string;
  updatedAt: string;
  /** Backend AI document id (Mongo / disk). */
  fileId?: string;
  /** Primary section stamp ("5") or "overview". */
  sectionId?: string;
  /** All section ids this upload relates to (primary + partners). */
  sectionIds?: string[];
  targetSectionLabel?: string;
  error?: string;
  /** Where the upload started. */
  source?: 'overview' | 'section';
};

const STORAGE_KEY = 'orderly_ai_upload_history_v2';
const LEGACY_KEY = 'orderly_ai_upload_history';
const MAX_ITEMS = 200;

/** In-memory source of truth for this tab. */
let memoryCache: AiUploadHistoryItem[] | null = null;

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function normalizeFileName(name: string): string {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function normalizeItem(raw: any): AiUploadHistoryItem | null {
  if (!raw || typeof raw !== 'object') return null;
  if (!raw.id || !raw.fileName) return null;
  const sectionId =
    raw.sectionId != null && String(raw.sectionId).trim()
      ? String(raw.sectionId)
      : undefined;
  const sectionIds = Array.isArray(raw.sectionIds)
    ? Array.from(
        new Set(
          raw.sectionIds
            .map((id: unknown) => String(id || '').trim())
            .filter(Boolean),
        ),
      )
    : sectionId
      ? [sectionId]
      : [];

  return {
    id: String(raw.id),
    fileName: String(raw.fileName),
    status: String(raw.status || 'done'),
    progress: typeof raw.progress === 'number' ? raw.progress : undefined,
    createdAt: String(raw.createdAt || raw.updatedAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || raw.createdAt || new Date().toISOString()),
    fileId:
      raw.fileId || raw.file_id
        ? String(raw.fileId || raw.file_id)
        : undefined,
    sectionId,
    sectionIds,
    targetSectionLabel: raw.targetSectionLabel
      ? String(raw.targetSectionLabel)
      : undefined,
    error: raw.error ? String(raw.error) : undefined,
    source:
      raw.source === 'overview' || raw.source === 'section'
        ? raw.source
        : undefined,
  };
}

/**
 * Same document + same topic/section = one footprint.
 * Used so re-uploading Auto_Insurance for Vehicles replaces the old card.
 */
function sameDocumentTopic(
  a: Pick<AiUploadHistoryItem, 'fileName' | 'sectionId' | 'sectionIds' | 'source'>,
  b: Pick<AiUploadHistoryItem, 'fileName' | 'sectionId' | 'sectionIds' | 'source'>,
): boolean {
  if (normalizeFileName(a.fileName) !== normalizeFileName(b.fileName)) {
    return false;
  }

  const aSource = a.source || 'overview';
  const bSource = b.source || 'overview';
  // Section uploads only collide with the same section source.
  if (aSource === 'section' || bSource === 'section') {
    if (aSource !== bSource) return false;
  }

  const aSections = new Set(
    [
      ...(a.sectionIds || []),
      ...(a.sectionId && a.sectionId !== 'overview' ? [a.sectionId] : []),
    ].map(String),
  );
  const bSections = new Set(
    [
      ...(b.sectionIds || []),
      ...(b.sectionId && b.sectionId !== 'overview' ? [b.sectionId] : []),
    ].map(String),
  );

  // Both still pending classification — same filename counts as same topic.
  if (aSections.size === 0 && bSections.size === 0) return true;

  // Share at least one real section id.
  for (const id of aSections) {
    if (bSections.has(id)) return true;
  }

  // One pending + one classified: still same file being processed.
  if (aSections.size === 0 || bSections.size === 0) return true;

  return false;
}

/** Keep newest row per document+topic; drop older duplicates from localStorage. */
function collapseDuplicates(items: AiUploadHistoryItem[]): AiUploadHistoryItem[] {
  const sorted = [...items].sort((a, b) =>
    String(b.updatedAt).localeCompare(String(a.updatedAt)),
  );
  const kept: AiUploadHistoryItem[] = [];

  for (const item of sorted) {
    const dupIndex = kept.findIndex(row => sameDocumentTopic(row, item));
    if (dupIndex === -1) {
      kept.push(item);
      continue;
    }
    // Merge section stamps into the newer keeper.
    const keeper = kept[dupIndex];
    kept[dupIndex] = {
      ...keeper,
      sectionIds: Array.from(
        new Set([
          ...(keeper.sectionIds || []),
          ...(item.sectionIds || []),
          ...(item.sectionId && item.sectionId !== 'overview'
            ? [item.sectionId]
            : []),
          ...(keeper.sectionId && keeper.sectionId !== 'overview'
            ? [keeper.sectionId]
            : []),
        ]),
      ),
      sectionId:
        keeper.sectionId && keeper.sectionId !== 'overview'
          ? keeper.sectionId
          : item.sectionId || keeper.sectionId,
    };
  }

  return kept;
}

function readHistory(): AiUploadHistoryItem[] {
  if (memoryCache) return memoryCache;

  const store = storage();
  if (!store) {
    memoryCache = [];
    return memoryCache;
  }

  try {
    const raw = store.getItem(STORAGE_KEY) || store.getItem(LEGACY_KEY);
    let items: AiUploadHistoryItem[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        items = parsed
          .map(normalizeItem)
          .filter(Boolean) as AiUploadHistoryItem[];
      }
    }
    items = collapseDuplicates(items);
    memoryCache = items;
    // Persist collapse so old duplicate attempts are cleared from storage.
    try {
      store.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
    } catch {
      // ignore
    }
    return memoryCache;
  } catch {
    memoryCache = [];
    return memoryCache;
  }
}

function writeHistory(items: AiUploadHistoryItem[]) {
  const next = collapseDuplicates(items).slice(0, MAX_ITEMS);
  memoryCache = next;
  const store = storage();
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // memory still holds list for this session
  }
}

function itemMatchesSection(
  item: AiUploadHistoryItem,
  sectionId: string,
): boolean {
  const want = String(sectionId);
  if (String(item.sectionId || '') === want) return true;
  return (item.sectionIds || []).some(id => String(id) === want);
}

export function listAiUploadHistory(filter?: {
  sectionId?: string | null;
  source?: 'overview' | 'section';
}): AiUploadHistoryItem[] {
  const all = readHistory();
  if (!filter?.sectionId && !filter?.source) return [...all];

  return all.filter(item => {
    if (filter.sectionId) {
      return itemMatchesSection(item, filter.sectionId);
    }
    if (filter.source === 'overview') {
      return true;
    }
    if (filter.source === 'section') {
      return item.source === 'section' || !item.source;
    }
    return true;
  });
}

function mergeSectionIds(
  prev: string[] | undefined,
  nextSectionId?: string,
  extra?: string[],
): string[] {
  const set = new Set<string>();
  for (const id of prev || []) {
    if (id) set.add(String(id));
  }
  for (const id of extra || []) {
    if (id) set.add(String(id));
  }
  if (nextSectionId && nextSectionId !== 'overview') {
    set.add(String(nextSectionId));
  }
  return Array.from(set);
}

/**
 * Upsert one footprint per document+topic.
 * Re-uploading the same file for Vehicles replaces the previous Vehicles card
 * (including failed/filled attempts) instead of stacking duplicates.
 */
export function upsertAiUploadHistory(
  item: Omit<AiUploadHistoryItem, 'createdAt' | 'updatedAt'> & {
    createdAt?: string;
    updatedAt?: string;
  },
) {
  if (!item?.id || !item.fileName) return;

  const existing = readHistory();
  const now = new Date().toISOString();

  const incomingSection =
    item.sectionId != null && String(item.sectionId).trim()
      ? String(item.sectionId)
      : undefined;

  // Prefer same id; otherwise same fileName + section/topic.
  const prevById = existing.find(row => row.id === item.id);
  const prevByTopic = existing.find(row =>
    sameDocumentTopic(row, {
      fileName: item.fileName,
      sectionId: incomingSection,
      sectionIds: item.sectionIds,
      source: item.source,
    }),
  );
  const prev = prevById || prevByTopic;

  const preservedSectionId =
    incomingSection && incomingSection !== 'overview'
      ? incomingSection
      : prev?.sectionId && prev.sectionId !== 'overview'
        ? prev.sectionId
        : incomingSection || prev?.sectionId;

  const sectionIds = mergeSectionIds(
    prev?.sectionIds,
    preservedSectionId,
    item.sectionIds,
  );

  const nextItem: AiUploadHistoryItem = {
    // Always track the latest live job id so progress merge keeps working.
    id: String(item.id),
    fileName: item.fileName,
    status: item.status,
    progress: item.progress,
    fileId: item.fileId || prev?.fileId,
    sectionId: preservedSectionId,
    sectionIds,
    targetSectionLabel: item.targetSectionLabel ?? prev?.targetSectionLabel,
    error: item.error,
    source: item.source ?? prev?.source,
    // New upload of same file = fresh "Uploaded" time; keep only one card.
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now,
  };

  // Drop this id AND any older same-topic duplicates.
  const next = existing.filter(row => {
    if (row.id === item.id) return false;
    if (prev && row.id === prev.id) return false;
    if (sameDocumentTopic(row, nextItem)) return false;
    return true;
  });
  next.unshift(nextItem);
  writeHistory(next);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('orderly-ai-upload-history', { detail: nextItem }),
    );
  }
}

/** Clear all upload footprints (localStorage + memory). */
export function clearAiUploadHistory() {
  memoryCache = [];
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(STORAGE_KEY);
    store.removeItem(LEGACY_KEY);
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('orderly-ai-upload-history'));
  }
}

/** Remove one footprint by job id and/or backend file id. */
export function removeAiUploadHistoryItem(args: {
  id?: string | null;
  fileId?: string | null;
}): AiUploadHistoryItem | null {
  const id = args.id ? String(args.id) : '';
  const fileId = args.fileId ? String(args.fileId) : '';
  if (!id && !fileId) return null;

  const existing = readHistory();
  const removed =
    existing.find(
      row =>
        (id && row.id === id) ||
        (fileId && row.fileId && row.fileId === fileId),
    ) || null;
  if (!removed) return null;

  const next = existing.filter(row => row.id !== removed.id);
  writeHistory(next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('orderly-ai-upload-history', {
        detail: { removed: true, id: removed.id, fileId: removed.fileId },
      }),
    );
  }
  return removed;
}

export function formatUploadHistoryWhen(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const day = date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${day} · ${time}`;
}

export function formatUploadHistoryDay(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatUploadHistoryTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}
