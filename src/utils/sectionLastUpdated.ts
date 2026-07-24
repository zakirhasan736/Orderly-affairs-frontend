const STORAGE_KEY = 'orderly_section_last_updated';

function readMap(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, string>) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/** ISO timestamp string for a section's last update. */
export function getSectionLastUpdated(sectionId: string): string | null {
  return readMap()[sectionId] || null;
}

export function listSectionLastUpdated(): Record<string, string> {
  return readMap();
}

export function setSectionLastUpdated(
  sectionId: string,
  isoTimestamp?: string | Date | null,
) {
  const map = readMap();
  const value =
    isoTimestamp instanceof Date
      ? isoTimestamp.toISOString()
      : typeof isoTimestamp === 'string' && isoTimestamp.trim()
        ? isoTimestamp
        : new Date().toISOString();
  map[sectionId] = value;
  writeMap(map);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('orderly-section-last-updated', {
        detail: { sectionId, updatedAt: value },
      }),
    );
  }
}

export function mergeSectionLastUpdated(entries: Record<string, string>) {
  const map = readMap();
  Object.entries(entries).forEach(([sectionId, iso]) => {
    if (!sectionId || !iso) return;
    const existing = map[sectionId];
    if (!existing || new Date(iso).getTime() >= new Date(existing).getTime()) {
      map[sectionId] = iso;
    }
  });
  writeMap(map);
}

/** e.g. "Updated Fri, Jul 24 · 9:15 AM" */
export function formatSectionLastUpdated(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const day = date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const time = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `Updated ${day} · ${time}`;
}
