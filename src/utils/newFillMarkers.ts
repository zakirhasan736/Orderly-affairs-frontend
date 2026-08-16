/**
 * Client-side markers for newly AI-filled section cards.
 * Overview + nav use these for “New” badges and deep links.
 */

export type NewFillMarker = {
  id: string;
  sectionId: string;
  subsectionId?: string;
  topicGroupKey?: string;
  index?: number;
  topicId?: string;
  label: string;
  createdAt: number;
  seenAt?: number | null;
};

const STORAGE_KEY = 'oa_new_fills_v1';
export const NEW_FILLS_CHANGED = 'orderly-new-fills-changed';

function storageKey(ownerId?: string | null) {
  return ownerId ? `${STORAGE_KEY}:${ownerId}` : STORAGE_KEY;
}

function readKey(key: string): NewFillMarker[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readAll(ownerId?: string | null): NewFillMarker[] {
  if (typeof window === 'undefined') return [];
  const keys = new Set<string>([storageKey()]);
  if (ownerId) keys.add(storageKey(ownerId));
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY)) keys.add(key);
    }
  } catch {
    // ignore
  }
  const byId = new Map<string, NewFillMarker>();
  keys.forEach(key => {
    readKey(key).forEach(item => {
      if (item?.id) byId.set(String(item.id), item);
    });
  });
  return [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
}

function writeAll(items: NewFillMarker[], ownerId?: string | null) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(ownerId), JSON.stringify(items.slice(-40)));
    window.dispatchEvent(new CustomEvent(NEW_FILLS_CHANGED));
  } catch {
    /* ignore */
  }
}

export function listNewFills(ownerId?: string | null): NewFillMarker[] {
  return readAll(ownerId);
}

export function listUnseenNewFills(ownerId?: string | null): NewFillMarker[] {
  return readAll(ownerId).filter(item => !item.seenAt);
}

/** Newest first, including already-opened markers (for the one-view hub). */
export function listAllNewFills(ownerId?: string | null): NewFillMarker[] {
  return [...readAll(ownerId)].sort((a, b) => b.createdAt - a.createdAt);
}

export function unmarkSectionFillsSeen(
  sectionId: string,
  opts?: { subsectionId?: string; ownerId?: string | null },
) {
  const next = readAll(opts?.ownerId).map(item => {
    if (item.sectionId !== sectionId) return item;
    if (opts?.subsectionId && item.subsectionId !== opts.subsectionId) {
      return item;
    }
    return { ...item, seenAt: null };
  });
  writeAll(next, opts?.ownerId);
}

export function recordNewFill(
  marker: Omit<NewFillMarker, 'id' | 'createdAt' | 'seenAt'> & {
    id?: string;
  },
  ownerId?: string | null,
) {
  const topicId =
    marker.topicId ||
    (marker.subsectionId != null && marker.index != null
      ? marker.topicGroupKey
        ? `${marker.subsectionId}:${marker.topicGroupKey}:${marker.index}`
        : `${marker.subsectionId}:${marker.index}`
      : undefined);

  const next: NewFillMarker = {
    id:
      marker.id ||
      `${marker.sectionId}:${topicId || marker.subsectionId || 'section'}:${Date.now()}`,
    sectionId: marker.sectionId,
    subsectionId: marker.subsectionId,
    topicGroupKey: marker.topicGroupKey,
    index: marker.index,
    topicId,
    label: marker.label,
    createdAt: Date.now(),
    seenAt: null,
  };

  const existing = readAll(ownerId).filter(
    item =>
      !(
        item.sectionId === next.sectionId &&
        item.topicId === next.topicId &&
        !item.seenAt
      ),
  );
  writeAll([next, ...existing], ownerId);
  return next;
}

export function markNewFillSeen(id: string, ownerId?: string | null) {
  const next = readAll(ownerId).map(item =>
    item.id === id ? { ...item, seenAt: Date.now() } : item,
  );
  writeAll(next, ownerId);
}

export function markSectionFillsSeen(
  sectionId: string,
  opts?: { subsectionId?: string; topicId?: string; ownerId?: string | null },
) {
  const next = readAll(opts?.ownerId).map(item => {
    if (item.sectionId !== sectionId) return item;
    if (opts?.topicId && item.topicId !== opts.topicId) return item;
    if (opts?.subsectionId && item.subsectionId !== opts.subsectionId) {
      return item;
    }
    if (item.seenAt) return item;
    return { ...item, seenAt: Date.now() };
  });
  writeAll(next, opts?.ownerId);
}

export function isNewFillActive(
  fills: NewFillMarker[],
  match: {
    sectionId: string;
    subsectionId?: string;
    topicGroupKey?: string;
    index?: number;
  },
): boolean {
  return fills.some(item => {
    if (item.seenAt) return false;
    if (item.sectionId !== match.sectionId) return false;
    if (match.subsectionId && item.subsectionId !== match.subsectionId) {
      return false;
    }
    if (
      match.topicGroupKey != null &&
      match.index != null &&
      item.topicGroupKey === match.topicGroupKey &&
      item.index === match.index
    ) {
      return true;
    }
    if (match.index == null && item.subsectionId === match.subsectionId) {
      return true;
    }
    return false;
  });
}

export function sectionHasUnseenFills(
  fills: NewFillMarker[],
  sectionId: string,
): boolean {
  return fills.some(item => item.sectionId === sectionId && !item.seenAt);
}

export function subsectionHasUnseenFills(
  fills: NewFillMarker[],
  sectionId: string,
  subsectionId: string,
): boolean {
  return fills.some(
    item =>
      item.sectionId === sectionId &&
      item.subsectionId === subsectionId &&
      !item.seenAt,
  );
}
