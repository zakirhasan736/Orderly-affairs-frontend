import { SUBSECTION_TOPIC_CONFIG } from '@/utils/dynamicVaultTopics';
import type { VaultSubsection } from '@/utils/vaultNavigation';

const SUBSECTION_ORDER_KEY = 'orderlyAffairsNavSubsectionOrder';

export function loadSubsectionOrder(): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SUBSECTION_ORDER_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

export function saveSubsectionOrder(order: Record<string, string[]>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SUBSECTION_ORDER_KEY, JSON.stringify(order));
}

export function applySubsectionOrder<T extends { id: string }>(
  subsections: T[],
  sectionId: string,
  customOrder: Record<string, string[]>,
): T[] {
  const order = customOrder[sectionId];
  if (!order?.length) return subsections;

  const byId = new Map(subsections.map(sub => [sub.id, sub]));
  const ordered: T[] = [];
  const seen = new Set<string>();

  for (const id of order) {
    const sub = byId.get(id);
    if (sub) {
      ordered.push(sub);
      seen.add(id);
    }
  }

  for (const sub of subsections) {
    if (!seen.has(sub.id)) ordered.push(sub);
  }

  return ordered;
}

export function reorderIds(
  ids: string[],
  fromId: string,
  toId: string,
): string[] {
  const fromIndex = ids.indexOf(fromId);
  const toIndex = ids.indexOf(toId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return ids;

  const next = [...ids];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function reorderArray<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function parseTopicId(topicId: string) {
  const parts = topicId.split(':');
  if (parts.length === 2) {
    return {
      kind: 'simple' as const,
      subsectionId: parts[0],
      index: Number.parseInt(parts[1], 10),
    };
  }

  if (parts.length === 3) {
    return {
      kind: 'group' as const,
      subsectionId: parts[0],
      groupKey: parts[1],
      index: Number.parseInt(parts[2], 10),
    };
  }

  return null;
}

function buildSimpleTopicId(subsectionId: string, index: number) {
  return `${subsectionId}:${index}`;
}

function buildGroupTopicId(
  subsectionId: string,
  groupKey: string,
  index: number,
) {
  return `${subsectionId}:${groupKey}:${index}`;
}

/** Reorder repeatable items in section form data; returns null if reorder is invalid. */
export function reorderTopicInFormData(
  sectionId: string,
  subsectionId: string,
  fromTopicId: string,
  toTopicId: string,
  sectionData: Record<string, unknown> | undefined,
): Record<string, unknown> | null {
  if (!sectionData) return null;

  const from = parseTopicId(fromTopicId);
  const to = parseTopicId(toTopicId);
  if (!from || !to || from.subsectionId !== subsectionId || to.subsectionId !== subsectionId) {
    return null;
  }

  if (from.kind === 'group' && to.kind === 'group') {
    if (from.groupKey !== to.groupKey) return null;

    const raw = sectionData[from.groupKey];
    if (!Array.isArray(raw)) return null;

    const reordered = reorderArray(raw, from.index, to.index);
    return { ...sectionData, [from.groupKey]: reordered };
  }

  if (from.kind !== 'simple' || to.kind !== 'simple') return null;

  const config = SUBSECTION_TOPIC_CONFIG[sectionId]?.[subsectionId];
  if (!config) return null;

  const raw = sectionData[config.dataKey];
  if (!Array.isArray(raw)) return null;

  const reordered = reorderArray(raw, from.index, to.index);
  return { ...sectionData, [config.dataKey]: reordered };
}

/** Remove a user-added topic/item (from + Add) out of section form data. */
export function removeTopicFromFormData(
  sectionId: string,
  subsectionId: string,
  topicId: string,
  sectionData: Record<string, unknown> | undefined,
): Record<string, unknown> | null {
  if (!sectionData) return null;

  const parsed = parseTopicId(topicId);
  if (!parsed || parsed.subsectionId !== subsectionId) return null;
  if (!Number.isFinite(parsed.index) || parsed.index < 0) return null;

  if (parsed.kind === 'group') {
    const raw = sectionData[parsed.groupKey];
    if (!Array.isArray(raw) || parsed.index >= raw.length) return null;
    const next = raw.filter((_, i) => i !== parsed.index);
    return { ...sectionData, [parsed.groupKey]: next };
  }

  const config = SUBSECTION_TOPIC_CONFIG[sectionId]?.[subsectionId];
  if (!config) return null;

  const raw = sectionData[config.dataKey];
  if (!Array.isArray(raw) || parsed.index >= raw.length) return null;
  const next = raw.filter((_, i) => i !== parsed.index);
  return { ...sectionData, [config.dataKey]: next };
}

/** After deleting topic at index, remap active topic id if needed. */
export function remapTopicIdAfterDelete(
  topicId: string | null | undefined,
  subsectionId: string,
  deletedTopicId: string,
): string | null {
  if (!topicId) return null;

  const active = parseTopicId(topicId);
  const deleted = parseTopicId(deletedTopicId);
  if (!active || !deleted || active.subsectionId !== subsectionId) {
    return topicId;
  }

  if (active.kind === 'group' && deleted.kind === 'group') {
    if (active.groupKey !== deleted.groupKey) return topicId;
    if (active.index === deleted.index) return null;
    if (active.index > deleted.index) {
      return buildGroupTopicId(
        subsectionId,
        active.groupKey,
        active.index - 1,
      );
    }
    return topicId;
  }

  if (active.kind === 'simple' && deleted.kind === 'simple') {
    if (active.index === deleted.index) return null;
    if (active.index > deleted.index) {
      return buildSimpleTopicId(subsectionId, active.index - 1);
    }
    return topicId;
  }

  return topicId;
}

/** Map a topic id to its new id after an index-based reorder within the same list. */
export function remapTopicIdAfterReorder(
  topicId: string,
  subsectionId: string,
  fromTopicId: string,
  toTopicId: string,
): string {
  const parsed = parseTopicId(topicId);
  const from = parseTopicId(fromTopicId);
  const to = parseTopicId(toTopicId);
  if (!parsed || !from || !to || parsed.subsectionId !== subsectionId) {
    return topicId;
  }

  if (parsed.kind === 'group' && from.kind === 'group' && to.kind === 'group') {
    if (parsed.groupKey !== from.groupKey || from.groupKey !== to.groupKey) {
      return topicId;
    }

    let index = parsed.index;
    const fromIndex = from.index;
    const toIndex = to.index;

    if (index === fromIndex) {
      index = toIndex;
    } else if (fromIndex < toIndex && index > fromIndex && index <= toIndex) {
      index -= 1;
    } else if (fromIndex > toIndex && index >= toIndex && index < fromIndex) {
      index += 1;
    }

    return buildGroupTopicId(subsectionId, parsed.groupKey, index);
  }

  if (parsed.kind === 'simple' && from.kind === 'simple' && to.kind === 'simple') {
    let index = parsed.index;
    const fromIndex = from.index;
    const toIndex = to.index;

    if (index === fromIndex) {
      index = toIndex;
    } else if (fromIndex < toIndex && index > fromIndex && index <= toIndex) {
      index -= 1;
    } else if (fromIndex > toIndex && index >= toIndex && index < fromIndex) {
      index += 1;
    }

    return buildSimpleTopicId(subsectionId, index);
  }

  return topicId;
}

export type { VaultSubsection };
