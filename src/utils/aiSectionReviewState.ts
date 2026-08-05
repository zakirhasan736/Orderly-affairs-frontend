/**
 * Tracks which sections the user has already reviewed after an AI fill,
 * so the sidebar "New data" badge can clear without re-running autofill.
 */

const STORAGE_KEY = 'orderly_ai_section_reviews_dismissed';

function readSet(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set();
  } catch {
    return new Set();
  }
}

function writeSet(set: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

function reviewKey(sectionId: string, fileId?: string | null) {
  return `${sectionId}:${fileId || 'any'}`;
}

export function markAiSectionReviewed(args: {
  sectionId: string;
  fileId?: string | null;
}) {
  if (!args.sectionId) return;
  const set = readSet();
  // File-scoped only — reviewing one document must not hide other docs
  // (or partner sections) from Review & fill.
  set.add(reviewKey(args.sectionId, args.fileId));
  writeSet(set);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('orderly-ai-section-reviewed', {
        detail: args,
      }),
    );
  }
}

export function isAiSectionReviewed(
  sectionId: string,
  fileId?: string | null,
): boolean {
  if (!sectionId) return false;
  const set = readSet();
  // Per-document only when fileId is known — never treat a sibling review
  // (or legacy section-wide stamp) as dismissing this document.
  if (fileId) {
    return set.has(reviewKey(sectionId, fileId));
  }
  return set.has(reviewKey(sectionId, null));
}

export function clearAiSectionReviewed(sectionId: string) {
  if (!sectionId) return;
  const set = readSet();
  for (const key of [...set]) {
    if (key.startsWith(`${sectionId}:`)) set.delete(key);
  }
  writeSet(set);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('orderly-ai-section-reviewed', {
        detail: { sectionId, cleared: true },
      }),
    );
  }
}

/** Put a dismissed AI review back into the activity list. */
export function unmarkAiSectionReviewed(args: {
  sectionId: string;
  fileId?: string | null;
}) {
  if (!args.sectionId) return;
  const set = readSet();
  set.delete(reviewKey(args.sectionId, args.fileId));
  if (args.fileId) {
    // Keep section-wide dismiss unless this was the only stamp.
    // Prefer restoring the specific file entry.
  } else {
    set.delete(reviewKey(args.sectionId, null));
  }
  writeSet(set);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('orderly-ai-section-reviewed', {
        detail: { ...args, unread: true },
      }),
    );
  }
}
