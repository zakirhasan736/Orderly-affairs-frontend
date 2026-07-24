/**
 * Tracks sections already filled from overview (or section) AI upload
 * so we don't re-run Auto-fill on the same temporary document.
 */

export type AiAutofillDoneRecord = {
  sectionId: string;
  fileId?: string;
  fileName?: string;
  completedAt: string;
};

const STORAGE_KEY = 'orderly_ai_autofill_done_sections';

function readMap(): Record<string, AiAutofillDoneRecord> {
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

function writeMap(map: Record<string, AiAutofillDoneRecord>) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function markAiAutofillDoneForSection(args: {
  sectionId: string;
  fileId?: string;
  fileName?: string;
}) {
  if (!args.sectionId) return;
  const map = readMap();
  map[args.sectionId] = {
    sectionId: args.sectionId,
    fileId: args.fileId,
    fileName: args.fileName,
    completedAt: new Date().toISOString(),
  };
  writeMap(map);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('orderly-ai-autofill-done', {
        detail: map[args.sectionId],
      }),
    );
  }
}

export function getAiAutofillDoneForSection(
  sectionId: string,
): AiAutofillDoneRecord | null {
  if (!sectionId) return null;
  return readMap()[sectionId] || null;
}

export function isAiAutofillDoneForSection(sectionId: string): boolean {
  return Boolean(getAiAutofillDoneForSection(sectionId));
}

export function clearAiAutofillDoneForSection(sectionId: string) {
  if (!sectionId) return;
  const map = readMap();
  if (!map[sectionId]) return;
  delete map[sectionId];
  writeMap(map);
}

export function listSectionsStillPendingForFile(
  fileId: string,
  pendingSectionIds: string[],
  filledSectionIds: string[],
) {
  const filled = new Set(filledSectionIds);
  return pendingSectionIds.filter(id => !filled.has(id));
}
