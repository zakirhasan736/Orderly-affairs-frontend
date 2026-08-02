/**
 * Tracks which document×section fills already completed so we don't re-run
 * Auto-fill on the same temporary document. Multiple documents for one
 * section (e.g. two vehicle cards) each get their own done flag.
 */

export type AiAutofillDoneRecord = {
  sectionId: string;
  fileId?: string;
  fileName?: string;
  completedAt: string;
};

const STORAGE_KEY = 'orderly_ai_autofill_done_sections';

function doneKey(sectionId: string, fileId?: string | null) {
  const sid = String(sectionId || '').trim();
  const fid = String(fileId || '').trim();
  return fid ? `${sid}::${fid}` : sid;
}

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
  const key = doneKey(args.sectionId, args.fileId);
  const record: AiAutofillDoneRecord = {
    sectionId: args.sectionId,
    fileId: args.fileId,
    fileName: args.fileName,
    completedAt: new Date().toISOString(),
  };
  map[key] = record;
  // Keep a section-level marker for UI pins ("overview already filled").
  map[args.sectionId] = record;
  writeMap(map);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('orderly-ai-autofill-done', {
        detail: record,
      }),
    );
  }
}

export function getAiAutofillDoneForSection(
  sectionId: string,
  fileId?: string | null,
): AiAutofillDoneRecord | null {
  if (!sectionId) return null;
  const map = readMap();
  if (fileId) {
    return map[doneKey(sectionId, fileId)] || null;
  }
  return map[sectionId] || null;
}

/**
 * When fileId is provided: true only if that document already filled the section.
 * Without fileId: true if any document has filled the section (pin / overview hint).
 */
export function isAiAutofillDoneForSection(
  sectionId: string,
  fileId?: string | null,
): boolean {
  if (!sectionId) return false;
  const map = readMap();
  if (fileId) {
    return Boolean(map[doneKey(sectionId, fileId)]);
  }
  return Object.keys(map).some(
    key => key === sectionId || key.startsWith(`${sectionId}::`),
  );
}

export function clearAiAutofillDoneForSection(sectionId: string) {
  if (!sectionId) return;
  const map = readMap();
  let changed = false;
  for (const key of Object.keys(map)) {
    if (key === sectionId || key.startsWith(`${sectionId}::`)) {
      delete map[key];
      changed = true;
    }
  }
  if (changed) writeMap(map);
}

export function listSectionsStillPendingForFile(
  fileId: string,
  pendingSectionIds: string[],
  filledSectionIds: string[],
) {
  const filled = new Set(filledSectionIds);
  return pendingSectionIds.filter(id => !filled.has(id));
}
