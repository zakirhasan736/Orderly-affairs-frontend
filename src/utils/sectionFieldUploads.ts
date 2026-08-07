import { formConfig } from '@/config/formConfig';
import type { FieldDefinition } from '@/types/formTypes';

export type SectionFieldUploadRef = {
  fieldKey: string;
  fieldLabel: string;
  publicId?: string;
  fileName: string;
  mimeType?: string;
};

function isUploadFieldDef(field: FieldDefinition | undefined): boolean {
  return String(field?.type || '') === 'TextInputWithUpload';
}

function collectUploadFieldDefs(
  fields: FieldDefinition[] | undefined,
  into: Map<string, string>,
) {
  for (const field of fields || []) {
    if (!isUploadFieldDef(field) || !field.key) continue;
    into.set(field.key, field.label || field.key);
  }
}

/** Map field keys → labels for TextInputWithUpload fields in a section. */
export function getSectionUploadFieldLabels(
  sectionId: string | null | undefined,
): Map<string, string> {
  const map = new Map<string, string>();
  if (!sectionId) return map;
  const section = (formConfig.chunks || [])
    .flatMap(chunk => chunk.sections || [])
    .find(s => String(s.id) === String(sectionId));
  if (!section) return map;

  for (const sub of section.subsections || []) {
    collectUploadFieldDefs(sub.fields, map);
    for (const group of sub.groups || []) {
      collectUploadFieldDefs(group.fields, map);
    }
  }
  return map;
}

function pushFilesFromValue(
  value: unknown,
  fieldKey: string,
  fieldLabel: string,
  out: SectionFieldUploadRef[],
  seen: Set<string>,
) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  const record = value as Record<string, unknown>;
  const files = Array.isArray(record.files) ? record.files : [];
  files.forEach((file, index) => {
    if (!file || typeof file !== 'object') return;
    const entry = file as Record<string, unknown>;
    const publicId = String(entry.public_id || entry.s3_key || '').trim();
    const fileName =
      String(entry.name || entry.original_filename || '').trim() ||
      `Document ${index + 1}`;
    const dedupe = publicId || `${fieldKey}:${fileName}:${index}`;
    if (seen.has(dedupe)) return;
    seen.add(dedupe);
    out.push({
      fieldKey,
      fieldLabel,
      publicId: publicId || undefined,
      fileName,
      mimeType: String(entry.mime_type || entry.content_type || '') || undefined,
    });
  });
}

function walk(
  node: unknown,
  labels: Map<string, string>,
  out: SectionFieldUploadRef[],
  seen: Set<string>,
  parentKey?: string,
) {
  if (!node || typeof node !== 'object') return;

  if (Array.isArray(node)) {
    node.forEach(item => walk(item, labels, out, seen, parentKey));
    return;
  }

  const record = node as Record<string, unknown>;

  // Current object is itself an upload field value.
  if (('files' in record || 'text' in record) && parentKey) {
    pushFilesFromValue(
      record,
      parentKey,
      labels.get(parentKey) || parentKey,
      out,
      seen,
    );
  }

  for (const [key, child] of Object.entries(record)) {
    if (key === 'files' || key === '_deleted_files' || key === 'deleted_files') {
      continue;
    }
    if (
      child &&
      typeof child === 'object' &&
      !Array.isArray(child) &&
      ('files' in (child as object) || 'text' in (child as object))
    ) {
      pushFilesFromValue(
        child,
        key,
        labels.get(key) || labels.get(parentKey || '') || key,
        out,
        seen,
      );
      continue;
    }
    walk(child, labels, out, seen, key);
  }
}

/** Collect field-level vault uploads nested under a section data bucket. */
export function collectSectionFieldUploads(
  sectionData: Record<string, unknown> | null | undefined,
  sectionId?: string | null,
): SectionFieldUploadRef[] {
  if (!sectionData || typeof sectionData !== 'object') return [];
  const labels = getSectionUploadFieldLabels(sectionId);
  const out: SectionFieldUploadRef[] = [];
  const seen = new Set<string>();
  walk(sectionData, labels, out, seen);
  return out;
}

/** True when section form data has at least one attached file. */
export function sectionDataHasFieldUploads(
  sectionData: Record<string, unknown> | null | undefined,
  sectionId?: string | null,
): boolean {
  return collectSectionFieldUploads(sectionData, sectionId).length > 0;
}

/** Count attached files under section form data. */
export function countSectionFieldUploads(
  sectionData: Record<string, unknown> | null | undefined,
  sectionId?: string | null,
): number {
  return collectSectionFieldUploads(sectionData, sectionId).length;
}
