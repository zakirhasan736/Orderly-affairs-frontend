import type { FieldDefinition } from '@/types/formTypes';
import { getSectionFieldDefinitions } from '@/utils/aiSectionFieldCatalog';
import type { DetectedAiFact } from '@/utils/aiDashboardPatchCache';
import { normalizeUploadField } from '@/utils/sectionUploadFields';
import { AI_SECTION_BY_ID } from '@/utils/aiSectionRegistry';

export type FieldMatchRow = {
  fieldKey: string;
  fieldLabel: string;
  currentValue: string;
  aiValue: string | null;
  status: 'filled' | 'available' | 'empty';
  fieldType?: string;
  /** 0–100 how well AI fact matches this section field. */
  matchConfidence: number;
  subsectionId?: string | null;
};

function asPlainText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value).trim();
  }
  if (Array.isArray(value)) {
    return value
      .map(item => asPlainText(item))
      .filter(Boolean)
      .join(', ');
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if ('text' in record) return asPlainText(record.text);
    if ('label' in record) return asPlainText(record.label);
    if ('name' in record) return asPlainText(record.name);
    if ('value' in record) return asPlainText(record.value);
  }
  return '';
}

/** Prefer values from the active subsection / nested topic buckets. */
function collectCurrentValues(
  sectionData: unknown,
  subsection?: string | null,
): Map<string, string> {
  const map = new Map<string, string>();

  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    Object.entries(node as Record<string, unknown>).forEach(([key, value]) => {
      if (key === '__rowId') return;
      if (value && typeof value === 'object') {
        visit(value);
      }
      const text = asPlainText(value);
      if (!text) return;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, text);
      } else if (!existing.includes(text)) {
        map.set(key, `${existing}; ${text}`);
      }
    });
  };

  if (
    subsection &&
    sectionData &&
    typeof sectionData === 'object' &&
    !Array.isArray(sectionData)
  ) {
    const record = sectionData as Record<string, unknown>;
    const exact = record[subsection];
    if (exact !== undefined) {
      visit(exact);
      return map;
    }
    // Soft match subsection keys (1A vs vital_info naming drift).
    const softKey = Object.keys(record).find(
      key =>
        key.toLowerCase() === String(subsection).toLowerCase() ||
        key.toLowerCase().includes(String(subsection).toLowerCase()) ||
        String(subsection).toLowerCase().includes(key.toLowerCase()),
    );
    if (softKey) {
      visit(record[softKey]);
      return map;
    }
  }

  visit(sectionData);
  return map;
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s\-]+/g, '_');
}

function findAiMatchForField(
  field: FieldDefinition,
  facts: DetectedAiFact[],
  subsection?: string | null,
): { value: string; confidence: number } | null {
  const keyNorm = normalizeKey(field.key);
  const labelNorm = normalizeKey(field.label || '');
  let best: { value: string; confidence: number } | null = null;

  const scoped = subsection
    ? [
        ...facts.filter(
          fact =>
            !fact.subsection ||
            normalizeKey(String(fact.subsection)) ===
              normalizeKey(String(subsection)) ||
            normalizeKey(String(fact.subsection)).includes(
              normalizeKey(String(subsection)),
            ),
        ),
        ...facts,
      ]
    : facts;

  const seen = new Set<string>();
  for (const fact of scoped) {
    const dedupe = `${fact.field_key}|${fact.label}|${fact.value}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);

    const factKey = normalizeKey(fact.field_key || '');
    const factLabel = normalizeKey(fact.label || '');
    let confidence = 0;

    if (factKey && factKey === keyNorm) confidence = 96;
    else if (
      factKey &&
      (factKey.endsWith(keyNorm) || keyNorm.endsWith(factKey))
    ) {
      confidence = 88;
    } else if (
      factLabel &&
      labelNorm &&
      factLabel === labelNorm
    ) {
      confidence = 84;
    } else if (
      factLabel &&
      labelNorm &&
      (factLabel.includes(labelNorm) || labelNorm.includes(factLabel))
    ) {
      confidence = 72;
    }

    if (confidence <= 0) continue;
    if (!best || confidence > best.confidence) {
      best = { value: fact.value, confidence };
    }
  }

  return best;
}

export function buildFieldMatchRows(args: {
  sectionId: string;
  subsection?: string | null;
  sectionData: unknown;
  facts: DetectedAiFact[];
}): FieldMatchRow[] {
  const resolvedSub =
    args.subsection ||
    AI_SECTION_BY_ID[args.sectionId]?.defaultSubsection ||
    null;
  const fields = getSectionFieldDefinitions(args.sectionId, resolvedSub);
  const currentMap = collectCurrentValues(args.sectionData, resolvedSub);
  const rows: FieldMatchRow[] = [];
  const seen = new Set<string>();

  for (const field of fields) {
    if (seen.has(field.key)) continue;
    seen.add(field.key);

    const currentValue = currentMap.get(field.key) || '';
    const match = findAiMatchForField(field, args.facts, resolvedSub);
    const aiValue = match?.value || null;
    let status: FieldMatchRow['status'] = 'empty';
    let matchConfidence = 0;

    if (aiValue) {
      const curNorm = currentValue.toLowerCase().trim();
      const aiNorm = aiValue.toLowerCase().trim();
      matchConfidence = match?.confidence || 70;
      if (
        curNorm &&
        (curNorm === aiNorm ||
          curNorm.includes(aiNorm) ||
          aiNorm.includes(curNorm))
      ) {
        status = 'filled';
        matchConfidence = Math.max(matchConfidence, 98);
      } else {
        status = 'available';
      }
    } else if (currentValue) {
      status = 'filled';
      matchConfidence = 100;
    }

    rows.push({
      fieldKey: field.key,
      fieldLabel: field.label || field.key,
      currentValue,
      aiValue,
      status,
      fieldType: field.type,
      matchConfidence,
      subsectionId: resolvedSub,
    });
  }

  for (const fact of args.facts) {
    const key = fact.field_key || fact.label;
    if (!key || seen.has(key)) continue;
    // Skip facts clearly belonging to another subsection when we scoped.
    if (
      resolvedSub &&
      fact.subsection &&
      normalizeKey(String(fact.subsection)) !==
        normalizeKey(String(resolvedSub)) &&
      !normalizeKey(String(fact.subsection)).includes(
        normalizeKey(String(resolvedSub)),
      )
    ) {
      continue;
    }
    seen.add(key);
    const currentValue = fact.field_key
      ? currentMap.get(fact.field_key) || ''
      : '';
    const matched =
      Boolean(currentValue) &&
      currentValue.toLowerCase().includes(fact.value.toLowerCase());
    rows.push({
      fieldKey: key,
      fieldLabel: fact.label,
      currentValue,
      aiValue: fact.value,
      status: matched ? 'filled' : 'available',
      matchConfidence: matched ? 90 : 65,
      subsectionId: fact.subsection || resolvedSub,
    });
  }

  return rows;
}

export function countUnfilledAiRows(rows: FieldMatchRow[]) {
  return rows.filter(row => row.status === 'available' && row.aiValue).length;
}

export function countEditableEmptyRows(rows: FieldMatchRow[]) {
  return rows.filter(
    row => row.status === 'empty' || row.status === 'available',
  ).length;
}

export function averageMatchConfidence(rows: FieldMatchRow[]) {
  const scored = rows.filter(row => row.matchConfidence > 0);
  if (!scored.length) return 0;
  return Math.round(
    scored.reduce((sum, row) => sum + row.matchConfidence, 0) / scored.length,
  );
}

function coerceEditValue(fieldType: string | undefined, text: string) {
  if (fieldType === 'TextInputWithUpload') {
    return normalizeUploadField(text);
  }
  return text;
}

/** Write popup edits into section form data. */
export function applyFieldEditsToSectionData(args: {
  sectionId: string;
  subsection?: string | null;
  sectionData: unknown;
  edits: Record<string, string>;
}): Record<string, unknown> {
  const fields = getSectionFieldDefinitions(args.sectionId, args.subsection);
  const fieldTypeByKey = new Map(fields.map(field => [field.key, field.type]));
  const defaultSub =
    args.subsection ||
    AI_SECTION_BY_ID[args.sectionId]?.defaultSubsection ||
    null;

  const current =
    args.sectionData &&
    typeof args.sectionData === 'object' &&
    !Array.isArray(args.sectionData)
      ? { ...(args.sectionData as Record<string, unknown>) }
      : {};

  const applyOnto = (target: Record<string, unknown>) => {
    const next = { ...target };
    Object.entries(args.edits).forEach(([key, raw]) => {
      const text = String(raw ?? '').trim();
      if (!text) return;
      next[key] = coerceEditValue(fieldTypeByKey.get(key), text);
    });
    return next;
  };

  if (!defaultSub) {
    return applyOnto(current);
  }

  const bucket = current[defaultSub];
  if (Array.isArray(bucket)) {
    const items = [...bucket];
    if (items.length === 0) {
      items.push(applyOnto({}));
    } else {
      const first =
        items[0] && typeof items[0] === 'object' && !Array.isArray(items[0])
          ? (items[0] as Record<string, unknown>)
          : {};
      items[0] = applyOnto(first);
    }
    return { ...current, [defaultSub]: items };
  }

  if (bucket && typeof bucket === 'object') {
    return {
      ...current,
      [defaultSub]: applyOnto(bucket as Record<string, unknown>),
    };
  }

  return {
    ...current,
    [defaultSub]: [applyOnto({})],
  };
}
