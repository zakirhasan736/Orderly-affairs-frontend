import {
  AI_SECTION_BY_ID,
  AI_SECTION_BY_KEY,
} from '@/utils/aiSectionRegistry';

export type AiUploadHistoryItem = {
  id: string;
  fileName: string;
  status: string;
  progress?: number;
  createdAt: string;
  updatedAt: string;
  /** Backend AI document id (Mongo / disk). */
  fileId?: string;
  /** MIME type from server (helps image / PDF / text preview). */
  mimeType?: string;
  /** SHA-256 of file bytes when known — used to replace same document. */
  contentHash?: string;
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
    .replace(/\.[a-z0-9]{1,8}$/i, '')
    .replace(/[\s._-]*\(\d+\)$/g, '')
    .replace(/[\s._-]*(copy)$/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Map API section keys (insurance_policies) or ids (7) → vault section id ("7").
 * Section popups filter by numeric ids; Mongo stores routed_section keys.
 */
export function toVaultSectionId(
  raw: string | null | undefined,
): string | null {
  const value = String(raw || '').trim();
  if (!value || value === 'overview') return null;
  if (AI_SECTION_BY_ID[value]) return value;
  if (AI_SECTION_BY_KEY[value]) return AI_SECTION_BY_KEY[value].id;
  // "7A" / "12B" → parent section id
  const parent = value.match(/^(\d+)/)?.[1];
  if (parent && AI_SECTION_BY_ID[parent]) return parent;
  return null;
}

function collectVaultSectionIds(
  ...groups: Array<Array<string | null | undefined> | undefined>
): string[] {
  const set = new Set<string>();
  for (const group of groups) {
    for (const raw of group || []) {
      const id = toVaultSectionId(raw);
      if (id) set.add(id);
    }
  }
  return Array.from(set);
}

function normalizeItem(raw: any): AiUploadHistoryItem | null {
  if (!raw || typeof raw !== 'object') return null;
  if (!raw.id || !raw.fileName) return null;
  const sectionId =
    raw.sectionId != null && String(raw.sectionId).trim()
      ? String(raw.sectionId)
      : undefined;
  const sectionIds: string[] = Array.isArray(raw.sectionIds)
    ? Array.from(
        new Set(
          (raw.sectionIds as unknown[])
            .map(id => String(id || '').trim())
            .filter((id): id is string => Boolean(id)),
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
    mimeType:
      raw.mimeType || raw.mime_type
        ? String(raw.mimeType || raw.mime_type)
        : undefined,
    contentHash:
      raw.contentHash || raw.content_hash
        ? String(raw.contentHash || raw.content_hash)
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
export function sameDocumentTopic(
  a: Pick<
    AiUploadHistoryItem,
    'fileName' | 'sectionId' | 'sectionIds' | 'source' | 'contentHash'
  >,
  b: Pick<
    AiUploadHistoryItem,
    'fileName' | 'sectionId' | 'sectionIds' | 'source' | 'contentHash'
  >,
): boolean {
  const aHash = String(a.contentHash || '').trim();
  const bHash = String(b.contentHash || '').trim();
  const sameBytes = Boolean(aHash && bHash && aHash === bHash);
  const sameName =
    normalizeFileName(a.fileName) === normalizeFileName(b.fileName);

  if (!sameBytes && !sameName) {
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

  // Exact same file bytes → one card regardless of section stamps.
  if (sameBytes) return true;

  // Both still pending classification — same filename counts as same topic.
  if (aSections.size === 0 && bSections.size === 0) return true;

  // Share at least one real section id.
  for (const id of aSections) {
    if (bSections.has(id)) return true;
  }

  // One pending + one classified: still same file being processed.
  if (aSections.size === 0 || bSections.size === 0) return true;

  // Overview re-upload of the same filename should replace prior overview cards
  // even when prior stamps span partner sections (vehicles + insurance).
  if (aSource === 'overview' && bSource === 'overview') return true;

  return false;
}

/** Keep newest row per document+topic; drop older duplicates from localStorage. */
export function collapseDuplicates(items: AiUploadHistoryItem[]): AiUploadHistoryItem[] {
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
  // Durable list lives on the server (Cloudinary + Mongo). Memory only holds
  // in-flight progress for this tab — never rehydrate from localStorage.
  memoryCache = [];
  if (typeof window !== 'undefined') {
    try {
      const store = storage();
      store?.removeItem(STORAGE_KEY);
      store?.removeItem(LEGACY_KEY);
    } catch {
      // ignore
    }
  }
  return memoryCache;
}

function writeHistory(items: AiUploadHistoryItem[]) {
  const next = collapseDuplicates(items).slice(0, MAX_ITEMS);
  memoryCache = next;
  // Intentionally no localStorage — server list is the source of truth.
}

function itemMatchesSection(
  item: AiUploadHistoryItem,
  sectionId: string,
): boolean {
  const want = toVaultSectionId(sectionId) || String(sectionId);
  const primary = toVaultSectionId(item.sectionId);
  if (primary && primary === want) return true;
  if (String(item.sectionId || '') === want) return true;
  return (item.sectionIds || []).some(id => {
    const normalized = toVaultSectionId(id);
    return normalized === want || String(id) === want;
  });
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
  return collectVaultSectionIds(prev, [nextSectionId], extra);
}

/**
 * Upsert one footprint per document+topic.
 * Re-uploading the same file for Vehicles replaces the previous Vehicles card
 * (including failed/filled attempts) instead of stacking duplicates.
 * Returns previous backend file ids that were replaced (caller/backend deletes them).
 */
export function upsertAiUploadHistory(
  item: Omit<AiUploadHistoryItem, 'createdAt' | 'updatedAt'> & {
    createdAt?: string;
    updatedAt?: string;
  },
): { item: AiUploadHistoryItem; replacedFileIds: string[] } | null {
  if (!item?.id || !item.fileName) return null;

  const existing = readHistory();
  const now = new Date().toISOString();

  const incomingSection =
    item.sectionId != null && String(item.sectionId).trim()
      ? toVaultSectionId(item.sectionId) || String(item.sectionId).trim()
      : undefined;

  // Prefer same id; otherwise same fileName + section/topic.
  const prevById = existing.find(row => row.id === item.id);
  const prevByTopic = existing.find(row =>
    sameDocumentTopic(row, {
      fileName: item.fileName,
      sectionId: incomingSection,
      sectionIds: item.sectionIds,
      source: item.source,
      contentHash: item.contentHash,
    }),
  );
  const prev = prevById || prevByTopic;

  const preservedSectionId =
    incomingSection && incomingSection !== 'overview'
      ? incomingSection
      : prev?.sectionId && prev.sectionId !== 'overview'
        ? toVaultSectionId(prev.sectionId) || prev.sectionId
        : incomingSection || prev?.sectionId;

  const sectionIds = mergeSectionIds(
    prev?.sectionIds,
    preservedSectionId,
    item.sectionIds,
  );

  const isFreshUpload =
    item.status === 'uploading' ||
    Boolean(item.fileId && prev?.fileId && item.fileId !== prev.fileId) ||
    Boolean(item.fileId && !prev?.fileId && prev);

  const nextItem: AiUploadHistoryItem = {
    // Always track the latest live job id so progress merge keeps working.
    id: String(item.id),
    fileName: item.fileName,
    status: item.status,
    progress: item.progress,
    // New upload clears old fileId until the new id is known.
    fileId:
      item.status === 'uploading'
        ? item.fileId
        : item.fileId || prev?.fileId,
    mimeType: item.mimeType || prev?.mimeType,
    contentHash: item.contentHash || prev?.contentHash,
    sectionId: preservedSectionId,
    sectionIds,
    targetSectionLabel: item.targetSectionLabel ?? prev?.targetSectionLabel,
    error: item.error,
    source: item.source ?? prev?.source,
    // Re-upload of same topic = fresh uploaded/updated timestamps.
    createdAt: isFreshUpload
      ? item.createdAt || now
      : item.createdAt || prev?.createdAt || now,
    updatedAt: item.updatedAt || now,
  };

  const replacedFileIds: string[] = [];
  // Drop this id AND any older same-topic duplicates.
  const next = existing.filter(row => {
    if (row.id === item.id) return false;
    if (prev && row.id === prev.id) {
      if (row.fileId && row.fileId !== nextItem.fileId) {
        replacedFileIds.push(row.fileId);
      }
      return false;
    }
    if (sameDocumentTopic(row, nextItem)) {
      if (row.fileId && row.fileId !== nextItem.fileId) {
        replacedFileIds.push(row.fileId);
      }
      return false;
    }
    return true;
  });
  next.unshift(nextItem);
  writeHistory(next);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('orderly-ai-upload-history', { detail: nextItem }),
    );
  }

  return { item: nextItem, replacedFileIds: Array.from(new Set(replacedFileIds)) };
}

/**
 * Attach the new backend file id to the matching history card (same file + section).
 */
export function bindAiUploadHistoryFileId(args: {
  fileName: string;
  fileId: string;
  sectionId?: string | null;
  source?: 'overview' | 'section';
  mimeType?: string;
  contentHash?: string;
}) {
  if (!args.fileName || !args.fileId) return;
  const existing = readHistory();
  const now = new Date().toISOString();
  const match = existing.find(row =>
    sameDocumentTopic(row, {
      fileName: args.fileName,
      sectionId: args.sectionId || undefined,
      source: args.source,
      contentHash: args.contentHash,
    }),
  );
  if (!match) return;

  upsertAiUploadHistory({
    ...match,
    fileId: args.fileId,
    mimeType: args.mimeType || match.mimeType,
    contentHash: args.contentHash || match.contentHash,
    updatedAt: now,
    createdAt: now,
  });
}

/**
 * Stamp additional related section ids onto an existing history card so the
 * same overview upload appears in each partner section's bottom-right panel.
 */
export function linkAiUploadHistorySections(args: {
  fileId?: string | null;
  fileName?: string | null;
  sectionIds: Array<string | null | undefined>;
}) {
  const fileId = args.fileId ? String(args.fileId) : '';
  const fileName = args.fileName ? String(args.fileName) : '';
  const extraIds = Array.from(
    new Set(
      (args.sectionIds || [])
        .map(id => String(id || '').trim())
        .filter(id => Boolean(id) && id !== 'overview'),
    ),
  );
  if (!extraIds.length || (!fileId && !fileName)) return;

  const existing = readHistory();
  const match =
    existing.find(row => fileId && row.fileId && row.fileId === fileId) ||
    existing.find(
      row =>
        fileName &&
        normalizeFileName(row.fileName) === normalizeFileName(fileName),
    );
  if (!match) return;

  upsertAiUploadHistory({
    ...match,
    fileId: fileId || match.fileId,
    sectionIds: mergeSectionIds(match.sectionIds, match.sectionId, extraIds),
    updatedAt: new Date().toISOString(),
  });
}

/** Clear all upload footprints (memory + wipe any legacy localStorage keys). */
export function clearAiUploadHistory() {
  memoryCache = [];
  const store = storage();
  if (store) {
    try {
      store.removeItem(STORAGE_KEY);
      store.removeItem(LEGACY_KEY);
    } catch {
      // ignore
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('orderly-ai-upload-history'));
  }
}

/**
 * Replace durable history rows from GET /ai/documents.
 * Keeps in-flight (uploading/processing/queued) memory rows so progress UI stays live.
 */
export function hydrateAiUploadHistoryFromServer(
  docs: Array<{
    file_id?: string;
    name?: string;
    original_filename?: string;
    mime_type?: string;
    status?: string;
    filled?: boolean;
    consumed_sections?: string[];
    pending_sections?: string[];
    created_at?: string | null;
    updated_at?: string | null;
    section?: string | null;
    content_hash?: string | null;
  }>,
): AiUploadHistoryItem[] {
  const existing = readHistory();
  const existingByFileId = new Map(
    existing
      .filter(item => item.fileId)
      .map(item => [String(item.fileId), item] as const),
  );
  const inFlight = existing.filter(item => {
    const status = String(item.status || '').toLowerCase();
    return (
      status === 'uploading' ||
      status === 'processing' ||
      status === 'queued' ||
      status === 'extracting' ||
      status === 'classifying' ||
      status === 'starting' ||
      status === 'reading' ||
      status === 'routing' ||
      status === 'filling' ||
      status === 'almost'
    );
  });

  const serverItems: AiUploadHistoryItem[] = [];
  for (const doc of docs || []) {
    const fileId = String(doc.file_id || '').trim();
    if (!fileId) continue;
    const fileName = String(
      doc.original_filename || doc.name || 'Uploaded document',
    );
    const prev = existingByFileId.get(fileId);
    const sectionIds = collectVaultSectionIds(
      [doc.section],
      doc.consumed_sections,
      doc.pending_sections,
      prev?.sectionIds,
      prev?.sectionId ? [prev.sectionId] : undefined,
    );
    const primarySection =
      toVaultSectionId(doc.section) ||
      sectionIds[0] ||
      (prev?.sectionId && prev.sectionId !== 'overview'
        ? toVaultSectionId(prev.sectionId) || prev.sectionId
        : undefined);
    const createdAt =
      doc.created_at || doc.updated_at || new Date().toISOString();
    const updatedAt =
      doc.updated_at || doc.created_at || new Date().toISOString();
    const rawStatus = String(doc.status || '').trim().toLowerCase();
    const filled =
      Boolean(doc.filled) ||
      (Array.isArray(doc.consumed_sections) && doc.consumed_sections.length > 0);
    const doneStatuses = new Set([
      'ready',
      'done',
      'complete',
      'completed',
      'filled',
    ]);
    const status =
      filled || doneStatuses.has(rawStatus) || !rawStatus ? 'done' : rawStatus;

    serverItems.push({
      id: `server:${fileId}`,
      fileName,
      status,
      progress: status === 'done' ? 100 : undefined,
      createdAt,
      updatedAt,
      fileId,
      mimeType: doc.mime_type || undefined,
      contentHash: doc.content_hash || undefined,
      sectionId: primarySection,
      sectionIds,
      source: prev?.source === 'section' ? 'section' : 'overview',
      targetSectionLabel:
        prev?.targetSectionLabel ||
        (primarySection && AI_SECTION_BY_ID[primarySection]
          ? AI_SECTION_BY_ID[primarySection].label
          : undefined),
    });
  }

  // Drop in-flight rows that already exist on the server (by fileId or same file name).
  const serverIds = new Set(
    serverItems.map(item => item.fileId).filter(Boolean) as string[],
  );
  const serverNames = new Set(
    serverItems.map(item => normalizeFileName(item.fileName)),
  );
  const keepInFlight = inFlight.filter(item => {
    if (item.fileId && serverIds.has(item.fileId)) return false;
    if (serverNames.has(normalizeFileName(item.fileName))) return false;
    // Drop ghost "processing" rows older than 30 minutes with no live file id.
    const updated = Date.parse(item.updatedAt || item.createdAt || '');
    if (
      !item.fileId &&
      Number.isFinite(updated) &&
      Date.now() - updated > 30 * 60 * 1000
    ) {
      return false;
    }
    return true;
  });

  // Prefer server (authoritative) rows; keep truly-live in-flight only.
  writeHistory([...keepInFlight, ...serverItems]);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('orderly-ai-upload-history'));
  }
  return listAiUploadHistory();
}

/** Remove replaced server file ids from the in-memory list after a topic replace. */
export function removeReplacedAiUploadFileIds(fileIds: string[]): void {
  const ids = new Set(
    (fileIds || []).map(id => String(id || '').trim()).filter(Boolean),
  );
  if (!ids.size) return;
  const existing = readHistory();
  const next = existing.filter(
    row => !(row.fileId && ids.has(String(row.fileId))),
  );
  if (next.length === existing.length) return;
  writeHistory(next);
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

/** Relative age for overview + section history cards (“Updated 3 days ago”). */
export function formatUploadRelativeDays(
  iso: string | null | undefined,
): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return 'Updated just now';

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Updated just now';
  if (minutes < 60) {
    return minutes === 1
      ? 'Updated 1 minute ago'
      : `Updated ${minutes} minutes ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours === 1 ? 'Updated 1 hour ago' : `Updated ${hours} hours ago`;
  }

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Updated yesterday';
  if (days < 7) return `Updated ${days} days ago`;

  const weeks = Math.floor(days / 7);
  if (days < 30) {
    return weeks === 1 ? 'Updated 1 week ago' : `Updated ${weeks} weeks ago`;
  }

  const months = Math.floor(days / 30);
  if (days < 365) {
    return months === 1
      ? 'Updated 1 month ago'
      : `Updated ${months} months ago`;
  }

  const years = Math.floor(days / 365);
  return years === 1 ? 'Updated 1 year ago' : `Updated ${years} years ago`;
}

/** Compact relative age for file cards (“21hrs ago”, “10m ago”). */
export function formatUploadRelativeShort(
  iso: string | null | undefined,
): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return 'just now';

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? '1hr ago' : `${hours}hrs ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (days < 30) return weeks === 1 ? '1w ago' : `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (days < 365) return months === 1 ? '1mo ago' : `${months}mo ago`;

  const years = Math.floor(days / 365);
  return years === 1 ? '1y ago' : `${years}y ago`;
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
