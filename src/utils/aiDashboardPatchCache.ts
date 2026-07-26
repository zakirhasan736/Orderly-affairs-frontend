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
};

function readMap(): Record<string, StashedAiPatch> {
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

export function stashDashboardAiPatch(entry: StashedAiPatch) {
  const map = readMap();
  map[entry.section_id] = {
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

export function takeDashboardAiPatch(sectionId: string): StashedAiPatch | null {
  const map = readMap();
  const entry = map[sectionId];
  if (!entry) return null;
  delete map[sectionId];
  writeMap(map);
  return entry;
}

export function peekDashboardAiPatch(sectionId: string): StashedAiPatch | null {
  return readMap()[sectionId] || null;
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
